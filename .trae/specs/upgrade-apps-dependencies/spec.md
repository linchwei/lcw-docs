# 升级 Apps 依赖包 Spec

## Why
apps 目录下的项目依赖包版本较旧，需要升级到最新稳定版本以获得新功能、性能改进和安全修复。

## What Changes
- 升级 frontend/web 项目依赖（React 18→19、Vite 5→6、Tailwind CSS 3→4 等）
- 升级 backend/server 项目依赖（NestJS 10→11 等）
- 升级 backend/y-websocket-server-demo 项目依赖
- 升级 frontend/desktop Tauri 依赖
- 修复升级后的配置变更和类型错误

## Impact
- 影响文件：apps/frontend/web/package.json
- 影响文件：apps/frontend/web/vite.config.ts
- 影响文件：apps/frontend/web/tailwind.config.ts
- 影响文件：apps/frontend/web/postcss.config.mjs
- 影响文件：apps/frontend/web/src/index.css
- 影响文件：apps/backend/server/package.json
- 影响文件：apps/backend/y-websocket-server-demo/package.json
- 影响文件：apps/frontend/desktop/package.json

## ADDED Requirements

### Requirement: React 19 升级
将 frontend/web 的 React 从 18 升级到 19，需要同步升级相关类型定义。

#### Scenario: React 19 升级成功
- **WHEN** 运行 `pnpm install`
- **THEN** React 19 成功安装
- **WHEN** 运行 `pnpm run typecheck`
- **THEN** 无 React 相关类型错误

### Requirement: Vite 6 升级
将 Vite 从 5 升级到 6，检查配置文件兼容性。

#### Scenario: Vite 6 升级成功
- **WHEN** 运行 `pnpm run dev`
- **THEN** 开发服务器正常启动
- **WHEN** 运行 `pnpm run build`
- **THEN** 构建成功

### Requirement: Tailwind CSS 4 升级
将 Tailwind CSS 从 3 升级到 4，需要迁移配置文件到 CSS 方式。

#### Scenario: Tailwind CSS 4 升级成功
- **WHEN** 删除 tailwind.config.ts 和 postcss.config.mjs
- **THEN** 使用 @import "tailwindcss" 语法
- **WHEN** 运行 `pnpm run build`
- **THEN** 样式正确应用

### Requirement: NestJS 11 升级
将 backend/server 的 NestJS 从 10 升级到 11。

#### Scenario: NestJS 11 升级成功
- **WHEN** 运行 `pnpm install`
- **THEN** NestJS 11 成功安装
- **WHEN** 运行 `pnpm run build`
- **THEN** 构建成功

## MODIFIED Requirements

### Requirement: 保持功能不变
**原则**：只升级依赖版本和必要的配置调整，不修改业务代码逻辑。
