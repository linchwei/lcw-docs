# 协同文档服务端增强计划（Phase 2-5 详细实施）

> Phase 1（权限模型增强 + 审计日志）已完成 ✅
> 本文档为 Phase 2-5 的详细实施计划，包含精确的文件改动、代码模式和验证步骤。

---

## 第二阶段：版本历史增强（自动版本 + 回滚）

### 2.1 自动版本创建（Bull 队列 + 定时任务）

**目标**：定时为活跃文档自动创建版本快照，单文档最多 1000 个版本

#### 2.1.1 注册 BullModule（需 Redis）

**文件**: `apps/server/src/app.module.ts`

```typescript
// 在 imports 中添加
BullModule.forRoot({
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
})
BullModule.registerQueue({
  name: 'version-snapshot',
})
```

**注意**：Bull 依赖 Redis。需安装 `ioredis` 并确保 Redis 服务运行。如果 Redis 不可用，可降级为 `@nestjs/schedule` 直接定时任务（无队列）。

#### 2.1.2 创建版本快照处理器

**新建**: `apps/server/src/modules/version/version.processor.ts`

```typescript
import { Process, Processor } from '@nestjs/bull'
import { Logger } from '@nestjs/common'
import { Job } from 'bull'
import { PostgresqlPersistence } from 'y-postgresql'
import { nanoid } from 'nanoid'

import { VersionEntity } from '../../entities/version.entity'

@Processor('version-snapshot')
export class VersionProcessor {
  constructor(
    @InjectRepository(VersionEntity)
    private readonly versionRepository: Repository<VersionEntity>,
    @Inject('YJS_POSTGRESQL_ADAPTER')
    private readonly yjsPostgresqlAdapter: PostgresqlPersistence,
  ) {}

  @Process('create-snapshot')
  async handleSnapshot(job: Job<{ pageId: string }>) {
    const { pageId } = job.data
    // 1. 从 yjsPostgresqlAdapter 获取 Yjs 文档
    // 2. 生成快照 doc.getXmlElement(`document-store-${pageId}`).toJSON()
    // 3. 检查该文档版本数量，超过 1000 则删除最旧的
    // 4. 保存 VersionEntity
  }
}
```

#### 2.1.3 创建定时任务调度器

**新建**: `apps/server/src/modules/version/version.scheduler.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { InjectQueue } from '@nestjs/bull'
import { Queue } from 'bull'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, MoreThan } from 'typeorm'

import { PageEntity } from '../../entities/page.entity'

@Injectable()
export class VersionScheduler {
  constructor(
    @InjectQueue('version-snapshot') private readonly snapshotQueue: Queue,
    @InjectRepository(PageEntity)
    private readonly pageRepository: Repository<PageEntity>,
  ) {}

  // 每 30 分钟检查一次活跃文档
  @Cron('*/30 * * * *')
  async autoSnapshot() {
    // 1. 查询最近 30 分钟内有更新的文档（updatedAt > now - 30min）
    // 2. 对每个活跃文档，检查是否有实质性变更（与最新版本对比）
    // 3. 有变更则入队 snapshotQueue.add('create-snapshot', { pageId })
  }
}
```

#### 2.1.4 更新 VersionModule

**文件**: `apps/server/src/modules/version/version.module.ts`

- 导入 `BullModule.registerQueue({ name: 'version-snapshot' })`
- 导入 `ScheduleModule.forRoot()`（如果 app.module 未全局注册）
- 注册 `VersionProcessor` 和 `VersionScheduler` 为 providers

#### 2.1.5 版本数量限制

在 `VersionProcessor.handleSnapshot()` 中：
- 创建新版本前，查询该 pageId 的版本总数
- 如果 >= 1000，删除最旧的版本（按 createdAt ASC 排序，删除超出部分）

### 2.2 版本回滚

**目标**：支持将文档回滚到指定历史版本

#### 2.2.1 扩展 VersionEntity

**文件**: `apps/server/src/entities/version.entity.ts`

新增字段：
```typescript
@Column({ type: 'varchar', length: 20, default: 'manual' })
source: string  // 'manual' | 'auto' | 'rollback-safety'（回滚前安全网快照）
```

#### 2.2.2 添加回滚方法

**文件**: `apps/server/src/modules/version/version.service.ts`

新增 `rollback()` 方法：
```typescript
async rollback(params: { pageId: string; versionId: string; userId: number }) {
  // 1. 权限校验：仅 owner 可回滚
  // 2. 读取目标版本的 snapshot
  // 3. 回滚前自动创建当前版本快照（source: 'rollback-safety'）
  // 4. 从 yjsPostgresqlAdapter 获取当前 Yjs 文档
  // 5. 解析目标 snapshot 为 Yjs 文档结构
  // 6. 计算当前状态与目标快照的差异
  // 7. 将差异作为 Yjs Update 应用到文档
  // 8. 通过 WebSocket 广播更新给所有连接的客户端
  // 9. 记录审计日志
  return { success: true, safetyVersionId }
}
```

**关键实现细节**：
- Yjs 回滚的核心：`Y.encodeStateAsUpdate(doc)` 获取当前状态，`Y.applyUpdate(doc, targetState)` 应用目标状态
- 但直接 applyUpdate 不会"删除"当前内容，需要用 `Y.encodeStateVector` + `lib0/encoding` 计算差异更新
- 更可靠的方式：清空当前文档内容，然后从目标快照恢复
- 广播更新：通过 `docs` Map 获取 WSSharedDoc，触发 update 事件自动广播

#### 2.2.3 添加回滚接口

**文件**: `apps/server/src/modules/version/version.controller.ts`

```typescript
@Post('page/:pageId/version/:versionId/rollback')
async rollback(
  @Param('pageId') pageId: string,
  @Param('versionId') versionId: string,
  @Request() req,
) {
  const result = await this.versionService.rollback({
    pageId, versionId, userId: req.user.id,
  })
  return { data: result, success: true }
}
```

#### 2.2.4 权限校验

在 `rollback()` 方法中添加：
- 查询 page 的 owner（page.user.id）
- 如果 req.user.id !== owner.id，抛出 ForbiddenError

### 2.3 版本对比

**目标**：比较两个版本的差异

#### 2.3.1 添加版本对比方法

**文件**: `apps/server/src/modules/version/version.service.ts`

```typescript
async diff(params: { pageId: string; versionId1: string; versionId2: string; userId: number }) {
  // 1. 读取两个版本的 snapshot
  // 2. 解析 JSON 字符串为结构化对象
  // 3. 深度对比两个对象，生成差异描述
  // 4. 返回 { added: [], removed: [], modified: [] }
}
```

**差异对比策略**：
- 快照格式为 Yjs XML 的 JSON 字符串
- 使用递归对比算法，按块（block）级别比较
- 返回块级别的增删改，不深入到字符级别（避免过于复杂）

#### 2.3.2 添加版本对比接口

**文件**: `apps/server/src/modules/version/version.controller.ts`

```typescript
@Get('page/:pageId/version/:v1/diff/:v2')
async diff(
  @Param('pageId') pageId: string,
  @Param('v1') v1: string,
  @Param('v2') v2: string,
  @Request() req,
) {
  const data = await this.versionService.diff({
    pageId, versionId1: v1, versionId2: v2, userId: req.user.id,
  })
  return { data, success: true }
}
```

### 2.4 前端版本面板增强

#### 2.4.1 添加回滚功能

**文件**: `apps/web/src/components/VersionPanel/index.tsx`

改动：
- 选中版本后，底部显示"恢复到此版本"按钮
- 点击后弹出确认对话框
- 确认后调用 `POST /page/:pageId/version/:versionId/rollback`
- 回滚成功后刷新编辑器内容

#### 2.4.2 添加版本对比功能

**文件**: `apps/web/src/components/VersionPanel/index.tsx`

改动：
- 版本列表支持多选（Shift+点击选中两个版本）
- 选中两个版本后显示"对比"按钮
- 点击后调用 `GET /page/:pageId/version/:v1/diff/:v2`
- 在弹窗中展示差异（新增/删除/修改的块）

#### 2.4.3 添加前端 API 方法

**文件**: `apps/web/src/services/version.ts`

新增：
```typescript
export const rollbackVersion = async (pageId: string, versionId: string) => {
  return await request.post(`/page/${pageId}/version/${versionId}/rollback`)
}

export const diffVersions = async (pageId: string, v1: string, v2: string) => {
  return await request.get(`/page/${pageId}/version/${v1}/diff/${v2}`)
}
```

#### 2.4.4 更新类型定义

**文件**: `apps/web/src/types/api.ts`

Version 接口新增 `source` 字段：
```typescript
export interface Version {
  id: number
  versionId: string
  pageId: string
  snapshot: string
  description: string | null
  source: string  // 'manual' | 'auto' | 'rollback-safety'
  createdBy: number
  createdAt: string
}
```

新增 VersionDiff 类型：
```typescript
export interface VersionDiff {
  added: Array<{ blockType: string; content: string }>
  removed: Array<{ blockType: string; content: string }>
  modified: Array<{ blockType: string; oldContent: string; newContent: string }>
}
```

---

## 第三阶段：离线同步

### 3.1 客户端 IndexedDB 持久化

**目标**：离线编辑时自动保存到 IndexedDB，上线后自动同步

#### 3.1.1 安装 y-indexeddb

```bash
cd apps/web && pnpm add y-indexeddb
```

#### 3.1.2 集成 IndexedDB 持久化

**文件**: `apps/web/src/pages/Doc/index.tsx`

改动：
```typescript
import { IndexeddbPersistence } from 'y-indexeddb'

// 在 doc 创建后、provider 连接前
const indexeddbProvider = useMemo(() => {
  return new IndexeddbPersistence(`doc-yjs-${pageId}`, doc)
}, [pageId, doc])

// 修改连接逻辑：先等 IndexedDB 同步完成，再连接 WebSocket
useEffect(() => {
  if (indexeddbProvider) {
    indexeddbProvider.whenSynced.then(() => {
      provider.connect()
    })
  }
  return () => {
    provider.disconnect()
    doc.destroy()
    setGlobalEditor(null)
  }
}, [pageId, provider, doc, indexeddbProvider, setGlobalEditor])
```

**同步状态增强**：
- 新增 `localSynced` 状态（IndexedDB 同步完成）
- 新增 `remoteSynced` 状态（WebSocket 同步完成）
- 底部状态栏显示：本地已保存 / 正在同步 / 已同步

#### 3.1.3 Share 页面同样集成

**文件**: `apps/web/src/pages/Share/ShareDocEditor.tsx`

同样添加 IndexeddbPersistence（分享页面也支持离线查看）

### 3.2 增量操作拉取接口

**目标**：客户端可通过 HTTP 拉取增量操作，不依赖 WebSocket 长连接

#### 3.2.1 新增 SyncModule

**新建**: `apps/server/src/modules/sync/sync.module.ts`

```typescript
@Module({
  imports: [TypeOrmModule.forFeature([PageEntity, CollaboratorEntity])],
  controllers: [SyncController],
  providers: [SyncService],
  exports: [SyncService],
})
export class SyncModule {}
```

#### 3.2.2 新增 SyncService

**新建**: `apps/server/src/modules/sync/sync.service.ts`

核心方法：
```typescript
async getOps(params: { pageId: string; since: number; userId: number }) {
  // 1. 权限校验
  // 2. 从 yjsPostgresqlAdapter 获取 Yjs 文档
  // 3. 使用 Y.encodeStateAsUpdate(doc, stateVector) 获取增量更新
  // 4. since 参数为客户端的 stateVector（Base64 编码）
  // 5. 返回增量更新（Base64 编码的 Uint8Array）+ 当前 stateVector
}
```

**关键**：Yjs 的 `encodeStateAsUpdate(doc, stateVector)` 可以获取指定 stateVector 之后的增量更新。客户端需要保存自己的 stateVector。

#### 3.2.3 新增 SyncController

**新建**: `apps/server/src/modules/sync/sync.controller.ts`

```typescript
@Controller()
@UseGuards(AuthGuard('jwt'))
export class SyncController {
  // GET /api/doc/:pageId/ops?since={stateVectorBase64}
  @Get('doc/:pageId/ops')
  async getOps(...) { ... }

  // POST /api/doc/:pageId/ops — 推送离线操作
  @Post('doc/:pageId/ops')
  async pushOps(...) { ... }

  // GET /api/doc/:pageId/snapshot — 获取最新快照
  @Get('doc/:pageId/snapshot')
  async getSnapshot(...) { ... }
}
```

### 3.3 离线操作推送接口

#### 3.3.1 pushOps 方法

**文件**: `apps/server/src/modules/sync/sync.service.ts`

```typescript
async pushOps(params: { pageId: string; update: string; userId: number }) {
  // 1. 权限校验（非 viewer/commenter）
  // 2. 解码 Base64 update 为 Uint8Array
  // 3. 从 yjsPostgresqlAdapter 获取 Yjs 文档
  // 4. Y.applyUpdate(doc, update) 应用更新
  // 5. 广播给其他连接的客户端（通过 docs Map 获取 WSSharedDoc）
  // 6. 返回当前 stateVector
}
```

### 3.4 同步状态管理（跨文档）

#### 3.4.1 跨文档同步拉取

**文件**: `apps/server/src/modules/sync/sync.service.ts`

```typescript
async pullAll(params: { userId: number; since: string }) {
  // 1. 查询用户有权限的所有文档
  // 2. 对每个文档，检查是否有 since 之后的更新
  // 3. 返回变更文档摘要列表 [{ pageId, hasUpdates, stateVector }]
}
```

#### 3.4.2 跨文档同步推送

```typescript
async pushAll(params: { userId: number; updates: Array<{ pageId: string; update: string }> }) {
  // 1. 对每个 update，验证权限后应用
  // 2. 返回每个文档的当前 stateVector
}
```

### 3.5 前端离线同步 UI

#### 3.5.1 同步状态指示器

**文件**: `apps/web/src/pages/Doc/index.tsx`

增强同步状态显示：
- `localSynced` + `remoteSynced` 双状态
- 状态栏显示：☁️ 已同步 / ⏳ 正在同步 / 💾 仅本地保存 / ⚠️ 离线模式

#### 3.5.2 离线提示

当 WebSocket 断开时：
- 显示"离线模式"横幅
- 编辑操作继续保存到 IndexedDB
- WebSocket 重连后自动同步

---

## 第四阶段：存储优化（冷热分离）

### 4.1 Redis 缓存层

**目标**：缓存热数据，减少 PostgreSQL 查询压力

#### 4.1.1 安装依赖

```bash
cd apps/server && pnpm add ioredis @nestjs/cache-manager cache-manager
```

#### 4.1.2 创建 Redis 配置模块

**新建**: `apps/server/src/fundamentals/redis/redis.module.ts`

```typescript
@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {
  static forRoot(): DynamicModule {
    return {
      module: RedisModule,
      providers: [
        {
          provide: 'REDIS_CLIENT',
          useFactory: () => {
            const client = new Redis({
              host: process.env.REDIS_HOST || 'localhost',
              port: parseInt(process.env.REDIS_PORT || '6379'),
            })
            return client
          },
        },
      ],
      exports: ['REDIS_CLIENT'],
    }
  }
}
```

#### 4.1.3 创建 RedisService

**新建**: `apps/server/src/fundamentals/redis/redis.service.ts`

核心方法：
- `get(key)` / `set(key, value, ttl)` / `del(key)`
- `setDocSnapshot(pageId, snapshot)` — 缓存文档快照
- `getDocSnapshot(pageId)` — 获取缓存的文档快照
- `setUserOnline(userId, pageId)` — 用户在线状态
- `getUserOnline(userId)` — 获取用户在线状态

#### 4.1.4 缓存策略

| 数据类型 | 缓存 Key | TTL | 更新策略 |
|----------|----------|-----|----------|
| 文档快照 | `doc:snapshot:{pageId}` | 1h | 文档更新时刷新 |
| 用户在线 | `user:online:{userId}` | 5min | 心跳续期 |
| 版本数量 | `doc:version-count:{pageId}` | 10min | 创建/删除版本时刷新 |

#### 4.1.5 集成到 Yjs 持久化

**文件**: `apps/server/src/fundamentals/yjs-postgresql/utils.ts`

在 `updateHandler` 中：
- 文档更新时，同时更新 Redis 缓存
- 在 `closeConn` 中：所有连接断开时，将最终状态写入 PG 后删除 Redis 缓存

### 4.2 S3 历史版本存储

**目标**：版本快照超过 30 天自动迁移到 S3

#### 4.2.1 安装依赖

```bash
cd apps/server && pnpm add @aws-sdk/client-s3
```

#### 4.2.2 创建 S3 存储服务

**新建**: `apps/server/src/fundamentals/storage/s3.service.ts`

核心方法：
- `upload(key: string, data: Buffer)` — 上传到 S3
- `download(key: string)` — 从 S3 下载
- `delete(key: string)` — 从 S3 删除
- `exists(key: string)` — 检查是否存在

#### 4.2.3 版本快照迁移

**文件**: `apps/server/src/modules/version/version.scheduler.ts`

新增定时任务：
```typescript
// 每天凌晨 2 点检查
@Cron('0 2 * * *')
async migrateOldSnapshots() {
  // 1. 查询 createdAt < now - 30天 的版本
  // 2. 将 snapshot 上传到 S3（key: versions/{pageId}/{versionId}）
  // 3. 更新 VersionEntity：snapshot 设为 's3://...' 标记
  // 4. 新增字段 storageType: 'local' | 's3'
}
```

#### 4.2.4 扩展 VersionEntity

**文件**: `apps/server/src/entities/version.entity.ts`

新增字段：
```typescript
@Column({ type: 'varchar', length: 10, default: 'local' })
storageType: string  // 'local' | 's3'
```

#### 4.2.5 读取逻辑适配

**文件**: `apps/server/src/modules/version/version.service.ts`

在 `findOne()` 和 `rollback()` 中：
- 如果 `storageType === 's3'`，从 S3 拉取快照
- 如果 `storageType === 'local'`，直接从数据库读取

### 4.3 文件上传优化（分块上传）

**目标**：支持大文件分块上传和断点续传

#### 4.3.1 扩展 UploadEntity

**新建**: `apps/server/src/entities/upload.entity.ts`

```typescript
@Entity('upload')
export class UploadEntity {
  @PrimaryGeneratedColumn()
  id: number
  @Column({ unique: true })
  uploadId: string
  @Column()
  filename: string
  @Column()
  totalSize: number
  @Column()
  chunkSize: number
  @Column({ default: 0 })
  uploadedChunks: number
  @Column({ default: 'pending' })
  status: string  // 'pending' | 'uploading' | 'completed'
  @Column()
  createdBy: number
  @CreateDateColumn()
  createdAt: Date
}
```

#### 4.3.2 扩展 UploadService

**文件**: `apps/server/src/modules/upload/upload.service.ts`

新增方法：
- `initiateUpload(filename, totalSize, chunkSize)` — 创建上传任务，返回 uploadId
- `uploadChunk(uploadId, chunkIndex, data)` — 接收分块
- `completeUpload(uploadId)` — 合并分块，存储到 S3/本地

#### 4.3.3 扩展 UploadController

**文件**: `apps/server/src/modules/upload/upload.controller.ts`

新增接口：
- `POST /upload/initiate` — 初始化分块上传
- `PUT /upload/chunk` — 上传分块
- `POST /upload/complete` — 完成上传

#### 4.3.4 前端分块上传

**文件**: `apps/web/src/services/upload.ts`

新增 `uploadLargeFile()` 方法：
- 文件 > 5MB 时自动使用分块上传
- 逐块上传，显示进度条
- 支持断点续传（记录已上传的 chunk index）

---

## 第五阶段：并发控制加固

### 5.1 版本向量

**目标**：为每个文档操作维护版本号，支持因果追踪

#### 5.1.1 扩展 WSSharedDoc

**文件**: `apps/server/src/fundamentals/yjs-postgresql/utils.ts`

```typescript
class WSSharedDoc extends Y.Doc implements IWSSharedDoc {
  name: string
  conns: Map<object, Set<number>>
  awareness: awarenessProtocol.Awareness
  version: number  // 新增：版本计数器

  constructor(name: string) {
    super({ gc: gcEnabled })
    this.name = name
    this.conns = new Map()
    this.awareness = new awarenessProtocol.Awareness(this)
    this.version = 0
    // ... 其余不变
  }
}
```

#### 5.1.2 更新版本号

在 `updateHandler` 中：
```typescript
const updateHandler = (update: Uint8Array, origin: any, doc: Y.Doc) => {
  const sharedDoc = doc as IWSSharedDoc
  sharedDoc.version++  // 递增版本号

  // 广播时附带版本号
  const encoder = encoding.createEncoder()
  encoding.writeVarUint(encoder, messageSync)
  syncProtocol.writeUpdate(encoder, update)
  // 可选：在消息末尾追加版本号
  const message = encoding.toUint8Array(encoder)
  sharedDoc.conns.forEach((_, conn) => send(sharedDoc, conn, message))
}
```

#### 5.1.3 快照接口返回版本号

**文件**: `apps/server/src/modules/sync/sync.controller.ts`

```typescript
@Get('doc/:pageId/snapshot')
async getSnapshot(...) {
  // 返回 { snapshot, version, stateVector }
}
```

### 5.2 广播优化

**目标**：50 人同屏时降低广播延迟

#### 5.2.1 批量广播

**文件**: `apps/server/src/fundamentals/yjs-postgresql/utils.ts`

```typescript
// 替换逐个发送为批量广播
const updateHandler = (update: Uint8Array, origin: any, doc: Y.Doc) => {
  const sharedDoc = doc as IWSSharedDoc
  const encoder = encoding.createEncoder()
  encoding.writeVarUint(encoder, messageSync)
  syncProtocol.writeUpdate(encoder, update)
  const message = encoding.toUint8Array(encoder)

  // 使用 wss.clients 广播（如果可用）
  // 或优化遍历逻辑，减少 per-connection 开销
  sharedDoc.conns.forEach((_, conn) => {
    if (conn.readyState === wsReadyStateOpen) {
      conn.send(message)
    }
  })
}
```

#### 5.2.2 Awareness 更新节流

```typescript
// 在 WSSharedDoc 构造函数中
let awarenessThrottleTimer: NodeJS.Timeout | null = null
let pendingAwarenessUpdate: Uint8Array | null = null

const awarenessChangeHandler = ({ added, updated, removed }, conn) => {
  const changedClients = added.concat(updated, removed)
  // ... 更新 conns 逻辑不变

  const encoder = encoding.createEncoder()
  encoding.writeVarUint(encoder, messageAwareness)
  encoding.writeVarUint8Array(encoder, awarenessProtocol.encodeAwarenessUpdate(this.awareness, changedClients))
  pendingAwarenessUpdate = encoding.toUint8Array(encoder)

  if (!awarenessThrottleTimer) {
    awarenessThrottleTimer = setTimeout(() => {
      if (pendingAwarenessUpdate) {
        this.conns.forEach((_, c) => send(this, c, pendingAwarenessUpdate!))
        pendingAwarenessUpdate = null
      }
      awarenessThrottleTimer = null
    }, 100)  // 100ms 节流
  }
}
```

### 5.3 连接管理优化

**目标**：限制单文档最大连接数，优雅降级

#### 5.3.1 连接数限制

**文件**: `apps/server/src/modules/doc-yjs/doc-yjs.gateway.ts`

```typescript
const MAX_CONNECTIONS_PER_DOC = 50

// 在 connection 处理中
const doc = getYDoc(docName)
if (doc.conns.size >= MAX_CONNECTIONS_PER_DOC) {
  // 超出限制，以 observer 模式连接（仅接收，不发送 awareness）
  setupWSConnection(connection, request, { docName, readOnly: true, observer: true })
  return
}
```

#### 5.3.2 自适应心跳

**文件**: `apps/server/src/fundamentals/yjs-postgresql/utils.ts`

```typescript
// 根据文档活跃度调整心跳间隔
const getPingInterval = (doc: IWSSharedDoc) => {
  // 活跃文档（有多个连接且有更新）：15s
  if (doc.conns.size > 1) return 15000
  // 空闲文档（仅一个连接）：60s
  return 60000
}
```

#### 5.3.3 Observer 模式

扩展 `setupWSConnection` 参数：
```typescript
interface ConnectionOptions {
  docName?: string
  gc?: boolean
  readOnly?: boolean
  observer?: boolean  // 新增：观察者模式，不发送 awareness
}
```

Observer 模式下：
- 可以接收文档更新和 awareness 信息
- 不能发送 update 和 awareness
- 不计入连接数限制

---

## 实施顺序和依赖关系

```
Phase 2（版本增强）
  ├── 2.1 自动版本 → 依赖 Redis（Bull 队列需要）
  ├── 2.2 版本回滚 → 无外部依赖
  └── 2.3 版本对比 → 无外部依赖

Phase 3（离线同步）
  ├── 3.1 IndexedDB → 前端独立，无后端依赖
  ├── 3.2 增量拉取 → 依赖 y-postgresql 查询
  └── 3.3 推送接口 → 依赖 docs Map 访问

Phase 4（存储优化）
  ├── 4.1 Redis 缓存 → 依赖 Redis 部署
  ├── 4.2 S3 存储 → 依赖 S3/MinIO 部署
  └── 4.3 分块上传 → 无外部依赖

Phase 5（并发加固）
  ├── 5.1 版本向量 → 修改 Yjs 核心引擎
  ├── 5.2 广播优化 → 修改 Yjs 核心引擎
  └── 5.3 连接管理 → 修改 WebSocket 网关
```

**推荐实施顺序**：
1. **Phase 2.2 + 2.3**（版本回滚 + 对比）— 无外部依赖，可立即开始
2. **Phase 3.1**（IndexedDB 离线持久化）— 前端独立，可并行
3. **Phase 2.1**（自动版本）— 需先部署 Redis
4. **Phase 3.2 + 3.3**（增量同步接口）— 后端独立
5. **Phase 5.3**（连接管理）— 改动小，收益大
6. **Phase 4.1**（Redis 缓存）— 需 Redis
7. **Phase 5.1 + 5.2**（版本向量 + 广播优化）— 修改核心引擎，需谨慎
8. **Phase 4.2**（S3 存储）— 需 S3 部署
9. **Phase 4.3**（分块上传）— 独立功能

## 风险和注意事项

1. **Redis 依赖**：Phase 2.1（Bull 队列）和 Phase 4.1（缓存）都需要 Redis。如果 Redis 不可用，Phase 2.1 可降级为 `@nestjs/schedule` 直接定时任务。
2. **Yjs 核心引擎修改**：Phase 5 涉及修改 `utils.ts` 中的核心协同逻辑，必须充分测试，避免破坏现有功能。
3. **版本回滚的原子性**：回滚操作需要确保"创建安全网快照 + 应用目标快照"的原子性，建议使用数据库事务。
4. **S3 可选**：如果部署环境无 S3/MinIO，Phase 4.2 可整体延后，不影响其他功能。
5. **最小改动原则**：每个 Phase 的实施应尽量复用现有代码和模式，避免大规模重构。
