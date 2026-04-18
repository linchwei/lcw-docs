# 协同文档服务端增强计划

## 现状分析

| PRD 需求 | 当前状态 | 差距 |
|----------|----------|------|
| CRDT + 事件溯源 | Yjs CRDT 已实现，PostgreSQL 持久化 | 缺少版本向量、操作日志持久化、增量拉取接口 |
| RBAC + 文档 ACL | owner/editor/viewer 三角色 | 缺少 commenter 角色、审计日志、权限变更通知 |
| 离线同步 | Yjs 天然支持离线合并 | 缺少 IndexedDB 持久化、离线队列、push/pull 接口 |
| 冷热分离存储 | 仅 PostgreSQL | 缺少 Redis 缓存、S3 快照存储、版本回滚 |
| 50 人同屏 | WebSocket 已支持 | 需压测验证，可能需要优化广播策略 |
| 1000+ 历史版本 | 手动快照，无回滚 | 缺少自动版本、回滚接口 |

## 已有基础设施（可复用）

- `@nestjs/bull` + `bull` 依赖已安装（Redis 队列，未使用）
- `@nestjs/schedule` 依赖已安装（定时任务，未使用）
- `y-postgresql` 已实现 Yjs 持久化
- WebSocket 网关已实现 JWT 认证和权限控制
- VersionEntity 已有快照存储结构

---

## 分阶段实施计划

### 第一阶段：权限模型增强 + 审计日志（最小改动，最大收益）

**目标**：补齐 commenter 角色，实现审计日志，权限变更通知

#### 1.1 新增 commenter 角色

- **文件**: `collaborator.entity.ts`、`collaborator.dto.ts`、`collaborator.service.ts`
- **改动**:
  - DTO 角色枚举从 `['editor', 'viewer']` 扩展为 `['editor', 'commenter', 'viewer']`
  - `page.service.ts` 的 `checkPageAccess()` 返回值支持 commenter
  - WebSocket 网关：commenter 角色为 readOnly（同 viewer），但允许评论操作
  - 前端：commenter 可见评论面板，viewer 不可见

#### 1.2 审计日志模块

- **新建**: `modules/audit/` 模块
- **实体**: `AuditLogEntity`
  - id, auditId, userId, action, resourceType, resourceId, details(JSON), ip, userAgent, createdAt
- **服务**: `AuditService.log()` — 异步写入审计记录
- **守卫**: 可选的 `AuditLog` 装饰器，自动记录控制器写操作
- **接口**:
  - `GET /doc/{id}/audit_log` — 获取文档审计日志（仅 owner）
  - `GET /audit` — 获取全局审计日志（管理员）

#### 1.3 权限变更通知

- **复用**: 现有 NotificationEntity 和 NotificationService
- **改动**:
  - `CollaboratorService.add()` — 创建通知给被添加的用户
  - `CollaboratorService.update()` — 创建通知给角色变更的用户
  - `CollaboratorService.remove()` — 创建通知给被移除的用户
- **前端**: 通知铃铛展示权限变更消息

---

### 第二阶段：版本历史增强（自动版本 + 回滚）

**目标**：自动创建版本快照，支持版本回滚

#### 2.1 自动版本创建

- **方案**: 使用 Bull 队列 + 定时任务
- **新建**: `modules/version/version.processor.ts` — Bull 队列消费者
- **触发策略**:
  - 定时快照：每 30 分钟检查活跃文档，有变更则自动创建快照
  - 里程碑快照：文档首次编辑、首次协作者加入时创建
  - 手动快照：保留现有手动创建接口
- **限制**: 单文档最多保留 1000 个版本，超出后自动清理最旧版本

#### 2.2 版本回滚

- **接口**: `POST /doc/{id}/rollback?version={versionId}`
- **实现**:
  1. 从 VersionEntity 读取目标版本的 snapshot
  2. 获取当前 Yjs 文档
  3. 计算当前状态与目标快照的差异
  4. 将差异作为 Yjs Update 应用到文档
  5. 广播更新给所有连接的客户端
  6. 回滚前自动创建当前版本快照（安全网）
- **权限**: 仅 owner 可执行回滚

#### 2.3 版本对比

- **接口**: `GET /doc/{id}/versions/{v1}/diff/{v2}`
- **实现**: 比较两个快照的 JSON 结构，返回增删改的差异

---

### 第三阶段：离线同步

**目标**：客户端离线编辑，上线后自动同步

#### 3.1 客户端 IndexedDB 持久化

- **依赖**: `y-indexeddb`
- **改动**: `Doc/index.tsx`
  - 创建 `IndexeddbPersistence(`doc-yjs-${pageId}`, doc)` 实例
  - 页面加载时先从 IndexedDB 读取本地数据，再连接 WebSocket
  - 离线时编辑自动存入 IndexedDB
  - 上线后 WebSocket 自动同步（Yjs CRDT 保证合并正确性）

#### 3.2 增量操作拉取接口

- **接口**: `GET /doc/{id}/ops?since={version}`
- **实现**:
  - `since` 参数为客户端已知的最后版本号（Yjs clock 值）
  - 服务端从 `yjs-writings` 表读取该版本之后的所有 updates
  - 返回合并后的增量更新（Yjs Update 二进制格式）
- **注意**: Yjs 的 `y-postgresql` 已存储所有 updates，可直接查询

#### 3.3 离线操作推送接口

- **接口**: `POST /doc/{id}/ops`
- **实现**:
  - 接收客户端提交的 Yjs Update 二进制数据
  - 应用到服务端 Yjs 文档
  - 广播给其他连接的客户端
  - 返回服务端当前版本号

#### 3.4 同步状态管理

- **接口**: `GET /sync/pull?since={token}`
- **实现**: 返回用户所有有权限文档的变更摘要
- **接口**: `POST /sync/push`
- **实现**: 批量推送多个文档的离线操作

---

### 第四阶段：存储优化（冷热分离）

**目标**：引入 Redis 缓存热数据，S3 存储冷数据

#### 4.1 Redis 缓存层

- **依赖**: `@nestjs/bull` 已安装，需安装 `ioredis` 或 `@nestjs/cache-manager`
- **缓存策略**:
  - 热数据：当前文档快照（Yjs 编码后的状态向量 + 文档内容）
  - 会话数据：用户在线状态、awareness 信息
  - 限流计数：替代内存中的 ThrottlerStorage
- **缓存失效**: 文档所有连接断开后，将最终状态写入 PostgreSQL，删除 Redis 缓存

#### 4.2 S3 历史版本存储

- **依赖**: `@aws-sdk/client-s3` 或 `minio`
- **策略**:
  - 版本快照超过 30 天自动迁移到 S3
  - 访问历史版本时，先查 PostgreSQL，miss 后从 S3 拉取
  - 定时任务清理已迁移的本地快照
- **接口不变**: 对前端透明

#### 4.3 文件上传优化

- **改动**: `upload.service.ts`
- **大文件分块上传**:
  - 前端分块（5MB/块），逐块上传
  - 服务端合并后存储到 S3/本地
  - 支持断点续传
- **接口**:
  - `POST /upload/initiate` — 初始化分块上传，返回 uploadId
  - `PUT /upload/chunk` — 上传分块
  - `POST /upload/complete` — 完成上传，合并文件

---

### 第五阶段：并发控制加固

**目标**：支持 50 人同屏，P99 延迟 < 200ms

#### 5.1 版本向量

- **实现**: 在 `WSSharedDoc` 上维护 `versionVector: Map<string, number>`
- **每次 Update**: 递增版本号
- **广播**: 附带版本号，客户端可追踪因果顺序
- **接口**: `GET /doc/{id}/snapshot` 返回最新快照 + 版本号

#### 5.2 广播优化

- **问题**: 当前实现遍历所有连接逐个发送，50 人时 O(n) 延迟
- **优化**:
  - 使用 `ws.Server` 的 `broadcast` 方法（零拷贝广播）
  - 合并短时间内的多个 Update 为批量广播
  - Awareness 更新节流（100ms 内合并）

#### 5.3 连接管理优化

- **心跳优化**: 当前 30s 间隔，改为自适应（空闲时 60s，活跃时 15s）
- **连接池**: 限制单文档最大连接数（默认 50），超出排队
- **优雅降级**: 超过 50 人时，新连接为 observer 模式（仅接收，不发送 awareness）

---

## 实施优先级建议

| 优先级 | 阶段 | 预期收益 | 风险 |
|--------|------|----------|------|
| P0 | 第一阶段：权限+审计 | 安全合规，权限精确控制 | 低 |
| P1 | 第二阶段：版本增强 | 数据安全，防误操作 | 中 |
| P2 | 第三阶段：离线同步 | 用户体验大幅提升 | 中 |
| P3 | 第四阶段：存储优化 | 性能和成本优化 | 高（需引入新基础设施） |
| P4 | 第五阶段：并发加固 | 大规模协作支持 | 高（需压测验证） |

## 技术决策说明

1. **不引入 Automerge**：当前 Yjs 生态完整（y-prosemirror、y-postgresql、y-websocket），切换成本极高且无必要
2. **不引入 Kafka**：Bull + Redis 已能满足当前规模的消息队列需求，Kafka 适合更大规模
3. **不引入 MongoDB**：PostgreSQL + TypeORM 已稳定运行，Yjs 数据通过 y-postgresql 直接存 PG，无需额外数据库
4. **IndexedDB 优先于 Service Worker**：y-indexeddb 是 Yjs 官方推荐的离线方案，实现简单且可靠
5. **S3 可选**：如果部署环境无 S3，可继续使用本地文件系统，第四阶段可整体延后
