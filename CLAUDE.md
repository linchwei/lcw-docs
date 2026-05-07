# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LCW-Docs 是一个基于 Prosemirror/Tiptap 的类 Notion/飞书协同文档编辑器，采用 pnpm monorepo + Turborepo 组织。

## Build & Development

```bash
# 启动所有包开发服务器（前端 Vite + 后端 Nest watch）
pnpm dev

# 仅启动后端
pnpm dev:server

# 构建所有包
pnpm build

# 构建单个包
pnpm --filter @lcw-doc/server build
pnpm --filter @lcw-doc/web build
pnpm --filter @lcw-doc/core build
```

## Test

```bash
# 运行所有单元测试（turbo）
pnpm test

# 运行 E2E 测试（Playwright，需先启动前后端）
pnpm test:e2e
pnpm test:e2e:headed

# 后端单独测试
pnpm --filter @lcw-doc/server test

# 前端单独测试
pnpm --filter @lcw-doc/web test
```

## Lint & Code Quality

```bash
pnpm lint             # ESLint
pnpm typecheck        # TypeScript 类型检查
pnpm spellcheck       # cSpell 拼写检查
pnpm commit           # 交互式规范提交（cz-git）
pnpm clean            # 清理构建产物和缓存
pnpm clean:all        # 清理所有包括 node_modules
```

## Docker Commands

```bash
pnpm docker:start     # docker compose up
pnpm docker:stop      # docker compose down
pnpm docker:deploy    # 生产部署
pnpm docker:build-deploy  # 构建并生产部署
```

## Deployment

```bash
pnpm ship             # git push + npm version patch + 打 tag 部署
pnpm ship:minor       # minor 版本部署
pnpm ship:major       # major 版本部署
```

## Project Architecture

### Monorepo Structure

- **apps/server** — NestJS 11 后端
  - `src/modules/` — 业务模块（ai, auth, collaborator, comment, doc-yjs, folder, notification, page, share, tag, upload, user, version）
  - `src/entities/` — TypeORM 实体
  - `src/fundamentals/` — 基础设施（日志、Sentry、Prometheus 指标、Yjs-PostgreSQL 存储）
  - WebSocket 协同：`doc-yjs.gateway.ts` 处理 `/doc-yjs-*` 路径的 ws 升级
  - Swagger: 启动后访问 `/doc`

- **apps/web** — Vite 6 + React 19 + TailwindCSS 4 前端
  - `src/pages/` — 路由页面：Doc（编辑器）、DocList（文档列表）、DocGraph（文档图谱）、Share（分享页）、Login（登录）
  - `src/components/` — UI 组件（AI 面板、评论、版本对比、分享、协作等）
  - `src/services/` — API 服务层（axios 封装）
  - `src/router/` — react-router-dom 路由配置
  - `src/views/` — 页面级视图组件（Doc, Login, Share）

- **packages/core** — `@lcw-doc/core` 编辑器核心引擎
  - `src/blocks/` — 块定义（CodeBlock, ImageBlock, FileBlock, AudioBlock, VideoBlock, TableBlock）
  - `src/editor/` — LcwDocEditor, LcwDocExtensions, LcwDocSchema
  - `src/extensions/` — 编辑器扩展（FormattingToolbar, SideMenu, SuggestionMenu, LinkToolbar, FilePanel, TableHandles）
  - `src/api/exporters/` — 导出（Markdown, HTML）
  - `src/api/parsers/` — 导入解析（Markdown, HTML）

- **packages/react** — `@lcw-doc/react` React 封装组件（编辑器 UI、工具栏、侧边菜单等）

- **packages/shadcn** — `@lcw-doc/shadcn` 编辑器 shadcn/ui 主题组件

- **packages/shadcn-shared-ui** — `@lcw-doc/shadcn-shared-ui` 通用 UI 组件库

### Key Architecture Decisions

1. **协同编辑**: Yjs CRDT 引擎通过 WebSocket 连接，服务端 `y-postgresql` 持久化到 PostgreSQL，客户端 `y-indexeddb` 支持离线编辑
2. **Nginx 反向代理**: `apps/web/nginx.conf` 中 `/api/` 代理到 server:8082，`/doc-yjs-*` 升级为 WebSocket 连接
3. **AI**: MiniMax API 通过 SSE 流式响应，包含全局对话和选中文本处理两种模式
4. **认证**: Passport + JWT，WebSocket 连接通过 URL token 参数鉴权
5. **代码规范**: ESLint + Prettier（`app/` → arrowParens: avoid, semi: false, singleQuote: true, tabWidth: 4）+ Husky + lint-staged + commitlint（conventional commits）

### Important Notes

- Node.js 版本要求：20+（`.nvmrc` 指定 20）
- 包管理器：pnpm 10.33.0+（corepack 推荐）
- 前端 Vite 配置中 `/api` 在开发模式代理到 `localhost:8082`
- 数据库同步（`DB_SYNCHRONIZE`）仅首次部署开启，之后关闭
