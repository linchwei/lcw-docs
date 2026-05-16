# 新人接手指南：lcw-docs 协作文档编辑器

> 目标：**3 天内熟悉项目并能够进行开发**  
> 项目版本：1.0.3 | 包管理器：pnpm 10+ | Node：参考 .nvmrc

---

## 目录

- [Day 0：环境搭建](#day-0环境搭建)
- [Day 1：理解整体架构](#day-1理解整体架构)
- [Day 2：深入核心模块](#day-2深入核心模块)
- [Day 3：实战开发](#day-3实战开发)
- [附录](#附录)

---

## Day 0：环境搭建

### 0.1 系统要求

- **Node.js** >= 18（推荐 22+）
- **pnpm** >= 10.33.0
- **PostgreSQL** 16+
- **Redis** 7+（用于 Bull 任务队列）
- **Docker**（可选，推荐用 Docker 启动数据库）

### 0.2 克隆并安装依赖

```bash
git clone <仓库地址> lcw-docs
cd lcw-docs

# 确保使用正确的 Node 版本
nvm use        # 或手动切换到 .nvmrc 指定的版本

# 安装依赖（记得使用 pnpm，不要用 npm/yarn）
pnpm install
```

> `pnpm install` 会安装所有 workspace 包（apps/* 和 packages/*）的依赖。
> 由于使用 pnpm workspace，`packages/*` 之间的依赖会被自动链接。

### 0.3 启动基础设施（推荐 Docker）

项目提供了三套 Docker Compose 配置：

```bash
# 方案 A：仅启动基础设施（数据库 + Redis），推荐
docker compose -f docker-compose.yml -p lcw-docs up -d

# 方案 B：本地开发模式（基础设施 + 热重载）
docker compose -f docker-compose.local.yml -p lcw-docs up -d

# 方案 C：完整部署模式（生产构建）
docker compose -f docker-compose.deploy.yml -p lcw-docs up -d
```

**推荐方案 A + 本地 `pnpm dev`**：Docker 只跑 PostgreSQL 和 Redis，前端/后端在宿主机开发。

`docker-compose.yml` 包含的服务：

| 服务 | 端口 | 说明 |
|------|------|------|
| PostgreSQL | 5432 | 主数据库 |
| Redis | 6379 | Bull 队列 + 缓存 |
| pgadmin | 5050 | 数据库管理界面 |

### 0.4 配置后端环境变量

```bash
# 复制示例配置（如果有 .env.example）
cp apps/server/.env.example apps/server/.env
```

`.env` 中需要关注的关键配置：

```env
# 数据库连接
DATABASE_URL=postgresql://lcw:lcw123@localhost:5432/lcw_docs

# JWT 密钥
JWT_SECRET=your-jwt-secret-key

# MiniMax AI 配置（无则 AI 功能不可用）
MINIMAX_API_KEY=your-minimax-api-key
MINIMAX_GROUP_ID=your-minimax-group-id

# 文件上传路径
UPLOAD_DIR=./uploads
```

> 如果是本地开发，PostgreSQL 默认用户/密码见 `docker-compose.yml`。

### 0.5 初始化数据库

```bash
# 进入 server 目录
cd apps/server

# 运行 TypeORM 迁移
pnpm run migration:run

# 或者（如果是同步模式）直接启动会自动建表
pnpm start:dev
```

数据库迁移文件位于 `apps/server/src/migrations/`。

### 0.6 启动开发服务器

```bash
# 在项目根目录运行（同时启动所有子项目）
pnpm dev

# 或者分别启动
pnpm dev:server   # 仅启动后端（8082 端口）
pnpm dev:desktop  # 启动 Tauri 桌面端（如果有）
```

启动后访问：

| 服务 | 地址 |
|------|------|
| 前端页面 | http://localhost:5173 |
| 后端 API | http://localhost:8082/api |
| Swagger 文档 | http://localhost:8082/doc |
| 数据库管理 | http://localhost:5050 |

> 第一次启动后端时，TypeORM 会同步创建所有表。

---

## Day 1：理解整体架构

### 1.1 项目全景图

```
lcw-docs/
├── apps/                    # 可部署的应用
│   ├── web/                 #   前端 SPA（React 19 + Vite 6）
│   │   └── src/
│   │       ├── pages/       #     页面级组件（路由对应的页面）
│   │       ├── components/  #     通用 UI 组件
│   │       ├── services/    #     API 调用（axios）
│   │       ├── context/     #     React Context
│   │       ├── blocks/      #     自定义编辑器块组件
│   │       ├── extensions/  #     自定义 ProseMirror 扩展
│   │       ├── utils/       #     工具函数
│   │       └── types/       #     TypeScript 类型定义
│   └── server/              #   后端 API（NestJS 11）
│       └── src/
│           ├── modules/     #     业务模块（每个功能一个模块）
│           ├── entities/    #     TypeORM 实体
│           ├── fundamentals/#     基础设施（日志、指标、Yjs）
│           └── test/        #     测试
├── packages/                # 可复用的库包
│   ├── core/                #   编辑器内核（框架无关）
│   ├── react/               #   React 绑定层
│   ├── shadcn/              #   编辑器 UI（shadcn 主题）
│   └── shadcn-shared-ui/    #   通用 UI 组件库
├── e2e/                     # Playwright 端到端测试
├── docs/                    # 项目文档
└── monitoring/              # Prometheus + Grafana 配置
```

### 1.2 核心概念

**Block（块）**：文档的基本组成单元。每个块是独立的（段落、标题、代码块、图片等），可以嵌套。

**Editor Engine（编辑器引擎）**：位于 `packages/core`，是框架无关的编辑器核心，处理所有编辑器操作逻辑。不依赖 React/Vue。

**CRDT / Yjs**：用于协同编辑的底层数据结构，自动解决多用户同时编辑的冲突。通过 WebSocket 同步。

**Schema**：定义文档中允许的块类型、行内元素和样式。项目基于 TipTap/ProseMirror 构建自定义 Schema。

### 1.3 路由结构

前端路由定义在 `apps/web/src/router/index.tsx`：

| 路径 | 页面 | 说明 |
|------|------|------|
| `/` | 重定向到 `/doc` | - |
| `/doc` | DocList | 文档列表/主页 |
| `/doc/:id` | Doc | 编辑器页面（核心） |
| `/doc/graph` | DocGraph | 知识图谱 |
| `/account/login` | Login | 登录 |
| `/share/:shareId` | Share | 分享文档 |

布局：`/doc` 路径下的页面使用 `AuthLayout`（需要登录），`/share` 和 `/account/login` 使用 `PublicLayout`。

### 1.4 数据流

```
用户操作 → React 组件 → API Service (axios) → NestJS Controller → Service → TypeORM → PostgreSQL
                                                                          ↓
用户操作编辑器 → LcwDocEditor API → ProseMirror Transaction → Yjs CRDT → WebSocket → 其他用户
                                                                          ↓
                                                                    y-postgresql → PostgreSQL
```

### 1.5 后端模块结构

每个业务功能是一个 NestJS Module，遵循相同的结构模式：

```
modules/xxx/
├── xxx.controller.ts    # 路由 + 请求处理
├── xxx.service.ts       # 业务逻辑
├── xxx.module.ts        # 模块注册
├── dto/                 # 请求/响应 DTO
└── (xxx.gateway.ts)     # WebSocket 网关（仅 doc-yjs）
```

17 个模块如下（按重要性排序）：

| 模块 | 核心文件 | 功能 |
|------|----------|------|
| `page` | modules/page/ | 文档 CRUD、搜索、回收站、收藏 |
| `doc-yjs` | modules/doc-yjs/ | Yjs WebSocket 协同网关 |
| `auth` | modules/auth/ | 登录、JWT、用户 | 
| `share` | modules/share/ | 分享链接 |
| `collaborator` | modules/collaborator/ | 协作者管理 |
| `comment` | modules/comment/ | 评论系统 |
| `tag` | modules/tag/ | 标签管理 |
| `folder` | modules/folder/ | 文件夹 |
| `version` | modules/version/ | 版本历史 |
| `notification` | modules/notification/ | 通知 |
| `ai` | modules/ai/ | AI 聊天 |
| `upload` | modules/upload/ | 文件上传 |

### 1.6 数据库实体

数据库实体定义在 `apps/server/src/entities/`：

| 实体 | 表名 | 说明 |
|------|------|------|
| `User` | users | 用户（含密码哈希） |
| `Page` | pages | 文档（标题、emoji、封面、内容快照） |
| `Folder` | folders | 文件夹（树形 parent-child） |
| `Tag` | tags | 标签（名称 + 颜色） |
| `PageTag` | page_tags | 文档-标签关联 |
| `Collaborator` | collaborators | 协作者（用户-文档-角色） |
| `Share` | shares | 分享链接（权限、密码、过期时间） |
| `Comment` | comments | 评论（锚点文本/位置、回复、解决状态） |
| `Version` | versions | 版本快照 |
| `Notification` | notifications | 通知（类型、是否已读） |
| `AuditLog` | audit_logs | 审计日志 |
| `Application` | applications | 应用管理 |

> **Yjs 数据** 存储在 `yjs-writings` 表中（由 `y-postgresql` 库自动管理），不是 TypeORM 实体。

---

## Day 2：深入核心模块

### 2.1 编辑器引擎（packages/core）

这是项目最核心的部分，建议按顺序阅读以下文件：

**Step 1：理解 Schema 系统**

```bash
# 阅读顺序（由浅入深）
packages/core/src/schema/         # Schema 定义 + 类型系统
packages/core/src/blocks/         # 所有内置块类型定义
packages/core/src/editor/LcwDocSchema.ts  # Schema 组装
```

Schema 定义了三类规格：
- **BlockSpec**：块类型（段落、标题、代码块等）
- **InlineContentSpec**：行内元素（文本、链接、@提及等）
- **StyleSpec**：样式（加粗、颜色、高亮等）

**Step 2：理解编辑器核心类**

```
packages/core/src/editor/LcwDocEditor.ts  # ★ 最重要的文件（~1100 行）
```

这个类是所有编辑器操作的入口，核心方法分组：

| 方法组 | 关键方法 | 作用 |
|--------|----------|------|
| 块操作 | `insertBlocks`, `updateBlock`, `removeBlocks`, `replaceBlocks`, `moveBlock`, `splitBlock`, `mergeBlocks` | 块级 CRUD |
| 嵌套 | `nestBlock`, `unnestBlock`, `canNestBlock`, `canUnnestBlock` | 块嵌套 |
| 文本 | `insertInlineContent`, `createLink`, `toggleStyles`, `addStyles`, `removeStyles` | 行内编辑 |
| 查询 | `document`, `getBlock`, `forEachBlock`, `getSelectedText`, `getSelection` | 文档遍历 |
| 光标 | `getTextCursorPosition`, `setTextCursorPosition` | 光标控制 |
| 导入导出 | `blocksToHTMLLossy`, `blocksToFullHTML`, `tryParseHTMLToBlocks`, `blocksToMarkdownLossy`, `tryParseMarkdownToBlocks` | 格式转换 |
| 协同 | `updateCollaborationUserInfo`, `openSuggestionMenu` | 协同控制 |

> **注意**：`LcwDocEditor` 不依赖任何 UI 框架，可以在任何 JavaScript 环境中使用。

**Step 3：理解 API 层**

```
packages/core/src/api/blockManipulation/  # 块操作命令
packages/core/src/api/exporters/           # HTML/Markdown 导出
packages/core/src/api/parsers/             # HTML/Markdown 解析
packages/core/src/api/clipboard/           # 剪贴板处理
packages/core/src/api/nodeConversions/     # ProseMirror Node ↔ Block 转换
```

### 2.2 React 绑定层（packages/react）

编辑器引擎的 React 包装，让 React 组件可以方便地使用编辑器：

**关键文件：**

```bash
packages/react/src/editor/LcwDocView.tsx   # ★ 主组件：<LcwDocView>
packages/react/src/hooks/                   # ★ 所有 React Hooks
  ├── useCreateLcwDoc.ts                    # 创建编辑器实例的 hook
  ├── useLcwDocEditor.ts                    # 获取编辑器实例
  ├── useActiveStyles.ts                    # 当前激活的样式（用于工具栏）
  └── ...
```

**核心 Hook 说明：**

- `useCreateLcwDoc` - 创建并返回 `LcwDocEditor` 实例。接受配置（schema、协同、上传等）
- `useLcwDocEditor` - 从 Context 获取编辑器实例，用于子组件
- `useSelectedBlocks` - 获取当前选中块列表，渲染工具栏时使用
- `useActiveStyles` - 获取当前活跃的样式状态（哪些按钮高亮）

### 2.3 前端应用（apps/web）

**入口和执行流程：**

```
src/main.tsx
  → src/App.tsx (QueryClientProvider + Router)
    → router/index.tsx (路由配置)
      → AuthLayout (侧边栏 + EditorProvider + GlobalAIChat)
        → DocList / Doc / DocGraph (页面组件)
```

**页面详解：**

**DocList**（`src/pages/DocList/index.tsx`）- 文档列表页
- 展示所有文档的卡片网格
- 支持创建、删除、收藏、封面图、标签管理
- Markdown 拖拽导入
- "与我共享" 区域

**Doc**（`src/pages/Doc/index.tsx`）- 编辑器页面（最复杂）
- 加载文档 → 创建 Yjs Document → 建立 WebSocket 连接 → 初始化编辑器
- 管理保存状态（saving/saved/unsaved）、同步状态（connected/disconnected）
- 渲染：面包屑 + 标题 + 封面 + 标签 + 编辑器 + 侧面板
- 侧面板：评论、版本历史、协作者、反向链接

**DocGraph**（`src/pages/DocGraph/index.tsx`）- 知识图谱
- ReactFlow + d3-force 力导向图
- 节点 = 文档，边 = @mention 引用
- 双击节点 → 跳转到文档

**关键 Context 和 Provider：**

```bash
src/context/EditorContext.tsx   # 编辑器实例上下文
```

EditorContext 提供 `currentEditor`，让 GlobalAIChat、StatusBar 等组件能访问当前打开的编辑器。

### 2.4 协同编辑原理

项目使用 **Yjs** 实现协同编辑，流程如下：

```
1. 用户 A 打开文档
   → 创建 Y.Doc 实例
   → WebSocketProvider 连接 ws://localhost:8082/doc-yjs-{pageId}
   → y-indexeddb 从本地 IndexedDB 加载缓存
   → PostgreSQL 中的 yjs-writings 数据同步到 Y.Doc

2. 用户 A 编辑
   → ProseMirror Transaction → y-prosemirror 转换为 Yjs 操作
   → WebSocket 广播到其他连接者

3. 用户 B 收到变更
   → Yjs 自动合并/解决冲突
   → y-prosemirror 将 Yjs 变更转换为 ProseMirror 步骤
   → 视图更新

4. 持久化
   → y-postgresql 监听 Y.Doc 的 update 事件
   → 自动写入 PostgreSQL yjs-writings 表
```

后端网关在 `apps/server/src/modules/doc-yjs/`：
- 端口共享：使用 HTTP Upgrade 机制将 WebSocket 和 REST API 共用 8082 端口
- 认证：JWT 验证或 shareId 验证
- 权限：每文档最多 50 连接，根据角色设置 `readOnly`
- 协作者自动添加：如果是有效用户且尚未成为协作者，自动添加为 editor

### 2.5 后端关键文件

```bash
# 入口
apps/server/src/main.ts           # 应用启动、中间件、Swagger、CORS

# 根模块（了解所有模块的注册关系）
apps/server/src/app.module.ts

# 协同编辑网关
apps/server/src/modules/doc-yjs/
  ├── doc-yjs.gateway.ts          # WebSocket 连接处理
  └── doc-yjs.module.ts

# Yjs 持久化实现
apps/server/src/fundamentals/yjs-postgresql/
  └── yjs-persistence.ts          # bindState / writeState 实现

# 认证
apps/server/src/modules/auth/
  ├── auth.controller.ts          # 登录/登出/当前用户
  ├── auth.service.ts
  └── strategies/
      ├── jwt.strategy.ts         # JWT 验证
      └── local.strategy.ts       # 密码验证
```

---

## Day 3：实战开发

### 3.1 常见开发场景

#### 场景 1：添加一个新页面

```bash
# 1. 创建页面组件
touch apps/web/src/pages/MyNewPage/index.tsx

# 2. 注册路由
# 编辑 apps/web/src/router/index.tsx，添加路由配置

# 3. 如果需要 API，在 services/ 中添加
# 编辑 apps/web/src/services/my-feature.ts

# 4. 在侧边栏添加导航入口
# 编辑 apps/web/src/components/LayoutAside/Aside.tsx
```

#### 场景 2：添加一个新 API 接口

```bash
# 1. 创建模块（如果还没有）
cd apps/server/src/modules
nest g module my-feature
nest g controller my-feature
nest g service my-feature

# 2. 定义 DTO
# 编辑 dto/my-feature.dto.ts

# 3. 实现业务逻辑
# 编辑 my-feature.service.ts

# 4. 注册路由
# 编辑 my-feature.controller.ts

# 5. 在 app.module.ts 中引入模块
```

#### 场景 3：新增编辑器块类型

```bash
# 1. 在 core 中定义块类型
# 编辑 packages/core/src/blocks/myBlockType.ts

# 2. 注册到默认块列表
# 编辑 packages/core/src/blocks/defaultBlocks.ts

# 3. 创建 React 渲染组件（可选）
# 编辑 packages/react/src/blocks/MyBlockType.tsx

# 4. 创建 UI 主题组件（可选）
# 编辑 packages/shadcn/src/blocks/MyBlockType.tsx
```

#### 场景 4：调试 WebSocket 协同

```bash
# 查看 WebSocket 连接状态
# 浏览器 DevTools → Network → WS → ws://localhost:8082

# 检查 Yjs 同步状态
# 在页面中查看 StatusBar 的同步指示器

# 验证数据持久化
psql -U lcw -d lcw_docs -c "SELECT COUNT(*) FROM yjs_writings;"

# 测试协同
# 打开两个浏览器窗口，编辑同一文档，观察光标和变更同步
```

### 3.2 常用命令速查

```bash
# 开发
pnpm dev                    # 启动所有子项目
pnpm dev:server             # 仅启动后端
pnpm --filter @lcw-doc/web dev   # 仅启动前端

# 构建
pnpm build                  # 构建所有子项目
pnpm --filter @lcw-doc/core build   # 仅构建 editor core

# 测试
pnpm test                   # 运行所有测试
pnpm test:e2e               # 运行 E2E 测试
pnpm test:e2e:headed        # 带浏览器界面的 E2E 测试

# 代码质量
pnpm lint                   # ESLint 检查
pnpm spellcheck             # 拼写检查
pnpm typecheck              # TypeScript 类型检查

# 清理
pnpm clean                  # 清理构建产物
pnpm clean:all              # 清理构建 + 依赖（需要重新 pnpm install）

# Docker
pnpm docker:start           # 启动基础设施
pnpm docker:stop            # 停止基础设施
pnpm docker:build-deploy    # 构建并部署
```

### 3.3 理解模块间引用

**前端 → 后端：**

前端 `apps/web` 通过 `src/services/` 调用后端 API。每个 service 使用共享的 `axios` 实例（`src/utils/request.ts`），该实例自动添加 JWT token 并在 401 时跳转到登录页。

```typescript
// services/page.ts 示例
import { request } from '../utils/request';

export const pageApi = {
  list: () => request.get('/page'),
  getById: (id: string) => request.get(`/page/${id}`),
  create: (data: CreatePageDto) => request.post('/page', data),
  update: (id: string, data: UpdatePageDto) => request.patch(`/page/${id}`, data),
  delete: (id: string) => request.delete(`/page/${id}`),
};
```

所有 API 类型定义在 `src/types/api.ts`。

**前端的 workspace 包引入：**

```typescript
// 通过包名直接引入（无需相对路径）
import { LcwDocEditor } from '@lcw-doc/core';
import { useCreateLcwDoc } from '@lcw-doc/react';
import { LcwDocView } from '@lcw-doc/shadcn';
import { Button } from '@lcw-doc/shadcn-shared-ui/components/ui/button';
```

这些映射在 `tsconfig.json` 的 `paths` 中配置，pnpm workspace 自动处理链接。

### 3.4 测试怎么写

**后端测试**（Jest）：

```typescript
// apps/server/src/test/*.spec.ts
// 使用 NestJS TestingModule
import { Test, TestingModule } from '@nestjs/testing';

describe('PageController', () => {
  let controller: PageController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PageController],
      providers: [PageService],
    }).compile();

    controller = module.get<PageController>(PageController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
```

**E2E 测试**（Playwright）：

```typescript
// e2e/*.spec.ts
// 启动真实浏览器模拟用户操作
test('用户登录后可以看到文档列表', async ({ page }) => {
  await page.goto('/account/login');
  await page.fill('[name="username"]', 'testuser');
  await page.fill('[name="password"]', 'testpass');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/doc');
});
```

### 3.5 常见问题排查

| 问题 | 可能原因 | 解决方法 |
|------|----------|----------|
| 前端页面白屏 / 404 | 后端未启动 | 检查 8082 端口是否在监听，查看后端日志 |
| WebSocket 连接失败 | 网关拒绝 / 认证失败 | 检查 JWT token 是否有效，查看 WebSocket 升级逻辑 |
| 数据库连不上 | 配置错误 / Docker 未启动 | `docker ps` 确认 PostgreSQL 在运行，检查 .env |
| 编辑器不显示 | Yjs 初始化失败 | 查看浏览器控制台 WebSocket 错误，检查 pageId 是否有效 |
| AI 功能不可用 | 未配置 MiniMax | 设置 `MINIMAX_API_KEY` 和 `MINIMAX_GROUP_ID` |
| 依赖安装失败 | pnpm 版本不匹配 | `pnpm --version` 确认版本，pm i -g pnpm@latest |
| TypeORM 同步失败 | 连接配置错误 | 检查 .env 的 DATABASE_URL，确认数据库已创建 |

---

## 附录

### A. 源代码地图

**Day 1 必读文件（了解全局）：**

```bash
# 项目配置
/package.json                        # 根 package.json（脚本、lint-staged）
/pnpm-workspace.yaml                 # workspace 配置
/turbo.json                          # Turborepo 任务编排
/docker-compose.yml                  # Docker 基础设施配置

# 前端入口
apps/web/src/main.tsx                # 应用入口
apps/web/src/App.tsx                 # 根组件
apps/web/src/router/index.tsx        # 路由配置
apps/web/src/layout/index.tsx        # 布局组件

# 后端入口
apps/server/src/main.ts              # 应用入口
apps/server/src/app.module.ts        # 根模块
```

**Day 2 必读文件（深入核心）：**

```bash
# 编辑器核心
packages/core/src/editor/LcwDocEditor.ts   # ★ 编辑器核心类
packages/core/src/editor/LcwDocSchema.ts   # ★ Schema 配置
packages/core/src/schema/                  # 类型系统定义
packages/core/src/blocks/defaultBlocks.ts  # 内置块类型

# React 绑定层
packages/react/src/editor/LcwDocView.tsx   # 编辑器组件
packages/react/src/hooks/useCreateLcwDoc.ts # ★ 创建编辑器的 hook

# 前端关键页面
apps/web/src/pages/Doc/index.tsx           # ★ 编辑器页面（最复杂）
apps/web/src/pages/Doc/DocEditor.tsx       # 编辑器创建逻辑

# 后端协同
apps/server/src/modules/doc-yjs/           # Yjs WebSocket 网关
apps/server/src/fundamentals/yjs-postgresql/ # Yjs 持久化
```

**Day 3 调试参考文件：**

```bash
# 前端网络层
apps/web/src/utils/request.ts              # axios 实例（JWT 拦截器）
apps/web/src/services/page.ts              # 页面 API 调用示例

# 后端模块示例
apps/server/src/modules/page/              # 页面模块（完整 CRUD 示例）
apps/server/src/modules/auth/              # 认证模块（JWT 示例）
```

### B. 技术栈速查

| 领域 | 技术 | 学习资源 |
|------|------|----------|
| React | 19 + Hooks | [react.dev](https://react.dev) |
| 路由 | react-router-dom v6 | [React Router 文档](https://reactrouter.com/) |
| 状态管理 | TanStack Query v5 | [tanstack.com/query](https://tanstack.com/query) |
| 编辑器 | TipTap + ProseMirror | [tiptap.dev](https://tiptap.dev/) |
| CRDT | Yjs | [yjs.dev](https://yjs.dev/) |
| 后端框架 | NestJS 11 | [docs.nestjs.com](https://docs.nestjs.com/) |
| ORM | TypeORM | [typeorm.io](https://typeorm.io/) |
| CSS | Tailwind CSS | [tailwindcss.com](https://tailwindcss.com/) |
| 图谱 | ReactFlow + d3-force | [reactflow.dev](https://reactflow.dev/) |
| UI 组件 | shadcn/ui + Radix | [ui.shadcn.com](https://ui.shadcn.com/) |

### C. 数据库连接信息（本地 Docker）

| 项目 | 值 |
|------|-----|
| 主机 | localhost |
| 端口 | 5432 |
| 用户 | lcw |
| 密码 | lcw123 |
| 数据库 | lcw_docs |
| pgAdmin | http://localhost:5050 (lcw@lcw.com / lcw123) |

### D. 相关文档

```bash
docs/                          # 项目业务文档
README.md                      # 项目说明
docker-compose.yml             # 基础设施配置
docker-compose.local.yml       # 本地开发配置
docker-compose.deploy.yml      # 部署配置
monitoring/                    # 监控面板配置
e2e/                           # E2E 测试
```

---

> **最后提醒**：本项目最复杂的部分是**编辑器引擎（packages/core）** 和**协同编辑（Yjs）**。如果你需要修改编辑器行为，请先在 `packages/core` 中找到对应方法；如果是修改编辑器 UI，则去 `packages/shadcn` 或 `packages/react`；如果是新增业务功能，大概率只需要改 `apps/web` + `apps/server`。
