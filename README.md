# LCW-Docs

基于 Prosemirror 和 Tiptap 的类 Notion / 飞书风格协同文档编辑器，支持实时多人协作、AI 助手、块编辑、版本历史等企业级功能。

## 功能特性

### 块编辑器
- 丰富的块类型：段落、标题（H1-H3）、有序/无序/任务列表、代码块（Shiki 语法高亮）、表格、引用、分割线、Callout
- Slash 命令菜单快速插入块
- 拖拽排序、嵌套缩进
- 文本样式：粗体、斜体、下划线、删除线、代码、文字颜色、背景色、对齐方式
- 链接编辑器、Mention (@提及)
- 图片/文件拖拽上传与粘贴插入
- Markdown 快捷输入

### 实时协同编辑
- 基于 Yjs CRDT 引擎，多人实时编辑零冲突
- WebSocket 长连接，协同光标与选区可见
- 离线编辑支持（IndexedDB 本地持久化），联网自动同步
- 协作者在线状态感知

### AI 助手
- 全局 AI 对话面板（MiniMax 流式响应）
- 选中文本 AI 处理（翻译、总结、润色、续写等）
- AI 生成的块内容直接插入文档

### 文档管理
- 文件夹组织、标签分类
- 文档收藏、回收站
- 全文搜索
- 封面图设置
- 文档图谱（反向链接、关系可视化）

### 分享与权限
- 公开分享链接（支持密码保护）
- 四级权限：Owner / Editor / Commenter / Viewer
- 协作者管理与邀请

### 评论系统
- 行内评论与回复
- 评论解决/重新打开
- 评论计数提示

### 版本历史
- 自动版本快照
- 版本对比与回滚

### 导出
- Markdown
- HTML
- PDF
- DOCX (Word)

### 其他
- 暗色模式
- 通知系统
- 键盘快捷键
- 文档大纲导航
- 字数统计与状态栏
- Prometheus 监控指标
- Swagger API 文档

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | React 19 + Vite 6 |
| UI 样式 | TailwindCSS 4 + shadcn/ui |
| 编辑器核心 | Prosemirror + Tiptap（@lcw-doc/core） |
| 协同引擎 | Yjs + y-websocket + y-indexeddb |
| 后端框架 | NestJS 11 |
| 数据库 | PostgreSQL 16 + TypeORM |
| 认证 | Passport + JWT |
| AI | MiniMax API（SSE 流式） |
| 容器化 | Docker + docker-compose |
| CI/CD | GitHub Actions |
| 代码规范 | ESLint + Prettier + Husky + lint-staged + commitlint + cz-git |
| 包管理 | pnpm 10 monorepo + Turborepo |

## 项目架构

```
lcw-docs/
├── apps/
│   ├── server/              # NestJS 后端服务
│   │   ├── src/config/      # 数据库等配置
│   │   ├── src/entities/    # TypeORM 实体
│   │   ├── src/modules/     # 业务模块
│   │   │   ├── ai/          # AI 助手
│   │   │   ├── auth/        # 认证（JWT + Local）
│   │   │   ├── collaborator/# 协作者管理
│   │   │   ├── comment/     # 评论
│   │   │   ├── doc-yjs/     # WebSocket 协同网关
│   │   │   ├── folder/      # 文件夹
│   │   │   ├── health/      # 健康检查
│   │   │   ├── notification/# 通知
│   │   │   ├── page/        # 页面 CRUD
│   │   │   ├── share/       # 分享
│   │   │   ├── tag/         # 标签
│   │   │   ├── upload/      # 文件上传
│   │   │   ├── user/        # 用户
│   │   │   └── version/     # 版本历史
│   │   ├── src/fundamentals/# 基础设施（日志、Sentry、指标、Yjs-PG）
│   │   └── Dockerfile
│   └── web/                 # Vite + React 前端
│       ├── src/blocks/      # 自定义编辑器块（AI、引用、Callout 等）
│       ├── src/components/  # UI 组件
│       ├── src/pages/       # 页面（Doc、DocList、Share、Login）
│       ├── src/services/    # API 服务层
│       ├── nginx.conf       # Nginx 反向代理配置
│       └── Dockerfile
├── packages/
│   ├── core/                # @lcw-doc/core - 编辑器核心引擎
│   │   └── src/             # Prosemirror/Tiptap 块定义、Schema、API、导出器
│   ├── react/               # @lcw-doc/react - React 组件封装
│   │   └── src/             # 编辑器 UI 组件（工具栏、侧边菜单、建议菜单等）
│   ├── shadcn/              # @lcw-doc/shadcn - 编辑器 shadcn/ui 主题组件
│   └── shadcn-shared-ui/    # @lcw-doc/shadcn-shared-ui - 通用 UI 组件库
├── e2e/                     # Playwright E2E 测试
├── monitoring/              # Prometheus 配置
└── docker-compose.local.yml # 生产 Docker Compose
```

## 快速开始

### 环境要求

- Node.js 20+
- pnpm 10.33.0+
- PostgreSQL 16+（或使用 Docker）
- Docker & Docker Compose（部署用）

### 安装

```bash
git clone https://github.com/linchwei/lcw-docs.git
cd lcw-docs
pnpm install
```

### 本地开发

```bash
# 启动后端（需要先配置 .env）
pnpm dev:server

# 启动前端
pnpm dev
```

### 构建

```bash
# 构建所有包
pnpm build

# 单独构建
pnpm --filter @lcw-doc/core build
pnpm --filter @lcw-doc/server build
pnpm --filter @lcw-doc/web build
```

### 测试

```bash
# 单元测试
pnpm test

# E2E 测试
pnpm test:e2e

# 覆盖率
pnpm test:coverage
```

## 环境变量配置

在 `apps/server/` 目录创建 `.env` 文件：

```env
# 数据库
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your-password
DB_DATABASE=lcw_docs

# JWT 密钥
JWT_SECRET=your-jwt-secret

# AI（可选）
MINIMAX_API_KEY=your-minimax-api-key

# CORS
CORS_ORIGINS=http://localhost:5173

# Redis（可选，Bull 队列需要）
REDIS_HOST=localhost
REDIS_PORT=6379

# Sentry（可选，错误追踪）
SENTRY_DSN=

# 数据库同步（首次部署设为 true，之后改回 false）
DB_SYNCHRONIZE=false
```

## Docker 部署

### 生产部署

1. 在项目根目录创建 `.env` 文件（至少配置 `DB_PASSWORD` 和 `JWT_SECRET`）

2. 构建并启动：

```bash
docker compose -f docker-compose.local.yml up -d --build
```

3. 首次部署需要同步数据库表结构：

```bash
# 在 .env 中设置 DB_SYNCHRONIZE=true，然后重启 server
docker compose -f docker-compose.local.yml restart server
# 表创建完成后改回 DB_SYNCHRONIZE=false
```

### 服务端口

| 服务 | 端口 | 说明 |
|------|------|------|
| Web (Nginx) | 80 | 前端 + 反向代理 |
| Server (NestJS) | 8082 | 后端 API（容器内部） |
| PostgreSQL | 5432 | 数据库（容器内部） |

### Nginx 代理路由

| 路径 | 目标 | 说明 |
|------|------|------|
| `/` | 静态文件 | 前端 SPA |
| `/api/` | server:8082 | 后端 API（含 SSE 流式） |
| `/doc-yjs-*` | server:8082 | WebSocket 协同 |
| `/uploads/` | server:8082 | 文件上传 |

## CI/CD

### GitHub Actions 工作流

| 工作流 | 触发条件 | 说明 |
|--------|----------|------|
| `ci.yml` | push/PR 到 main/develop | Lint、TypeCheck、测试、构建验证 |
| `release.yml` | 推送 `v*.*.*` 标签 | SSH 到服务器拉取代码、构建镜像、部署 |
| `deploy.yml` | 手动触发 | SSH 到服务器部署最新 main |

### 部署命令

```bash
# 一键部署（patch 版本）
pnpm ship

# minor 版本
pnpm ship:minor

# major 版本
pnpm ship:major
```

### GitHub Secrets 配置

| Secret | 说明 |
|--------|------|
| `DEPLOY_HOST` | 服务器 IP |
| `DEPLOY_USER` | SSH 用户名 |
| `DEPLOY_SSH_KEY` | SSH 私钥 |
| `DEPLOY_PATH` | 项目部署路径 |

## 项目脚本

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动所有包的开发服务器 |
| `pnpm dev:server` | 启动后端开发服务器 |
| `pnpm build` | 构建所有包 |
| `pnpm lint` | ESLint 检查 |
| `pnpm typecheck` | TypeScript 类型检查 |
| `pnpm test` | 运行单元测试 |
| `pnpm test:e2e` | 运行 E2E 测试 |
| `pnpm commit` | 交互式规范提交（cz-git） |
| `pnpm ship` | 推送 + patch 版本 + 部署 |
| `pnpm ship:minor` | 推送 + minor 版本 + 部署 |
| `pnpm ship:major` | 推送 + major 版本 + 部署 |
| `pnpm clean` | 清理构建产物 |
| `pnpm clean:all` | 清理构建产物 + 依赖 |

## API 文档

启动后端服务后访问 Swagger 文档：

```
http://localhost:8082/doc
```

## License

ISC
