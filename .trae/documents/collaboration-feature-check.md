# 协同功能检查与修复计划

## 当前架构概述

协同功能基于 **Yjs + y-websocket + PostgreSQL** 技术栈：

- **前端**：`WebsocketProvider` 连接 `ws://localhost:8082`，房间名 `doc-yjs-${pageId}`
- **后端**：NestJS 服务器端口 8082，通过 HTTP upgrade 拦截 WebSocket 请求
- **持久化**：`y-postgresql` 库，存储在 PostgreSQL `yjs-writings` 表
- **认证**：JWT token 或 shareId + password
- **状态指示**：`syncStatus` 显示 connecting/connected/disconnected

## 潜在问题分析

### 1. 数据库依赖
PostgreSQL 必须在 5433 端口运行。如果未启动，`PostgresqlPersistence.build()` 会失败，可能导致：
- 服务器启动失败
- 协同数据无法持久化

### 2. writeState 未真正等待数据库刷盘
[yjs-postgresql.module.ts](file:///Users/lin/Desktop/levy/project/lcw-docs/apps/server/src/fundamentals/yjs-postgresql/yjs-postgresql.module.ts) 中 `writeState` 直接 `resolve(true)`，没有等待数据库真正写入完成。当所有连接断开时，文档会被销毁，但数据可能未完全持久化。

### 3. bindState 顺序问题
`bindState` 中先 `storeUpdate` 存储 ydoc 的当前状态（此时可能为空），再 `applyUpdate` 应用持久化状态。这个顺序可能导致空更新被先存储。

### 4. 光标头像依赖外部服务
[cursorRender.ts](file:///Users/lin/Desktop/levy/project/lcw-docs/apps/web/src/pages/Doc/cursorRender.ts) 和 [AvatarList.tsx](file:///Users/lin/Desktop/levy/project/lcw-docs/apps/web/src/pages/Doc/AvatarList.tsx) 使用 `robohash.org` 获取头像，网络不通时无法显示。

## 实施步骤

### 步骤 1：环境检查
- 检查 PostgreSQL 是否运行（`docker compose ps`）
- 检查后端服务器是否运行（`curl http://localhost:8082/api`）
- 如果 PostgreSQL 未运行，启动它（`docker compose up -d`）
- 如果服务器未运行，启动它（`pnpm dev:server`）

### 步骤 2：浏览器测试协同连接
- 打开编辑器页面，观察 `syncStatus` 状态指示器
- 检查浏览器控制台是否有 WebSocket 连接错误
- 检查服务器日志是否有连接/认证错误

### 步骤 3：双标签页实时协同测试
- 在两个浏览器标签页打开同一文档
- 验证实时内容同步
- 验证光标位置共享
- 验证远程用户头像显示

### 步骤 4：根据测试结果修复问题
可能需要的修复：
1. **数据库未运行** → 启动 Docker PostgreSQL
2. **WebSocket 连接失败** → 检查服务器日志，修复认证或连接问题
3. **数据未持久化** → 修复 `writeState` 和 `bindState` 逻辑
4. **光标头像不显示** → 替换为纯 CSS 头像（与之前侧边栏优化一致）
5. **其他运行时问题** → 根据具体错误修复

### 步骤 5：验证修复
- 重新测试协同功能
- 确认双标签页同步正常
- 确认数据持久化正常
- 运行 typecheck 确保无类型错误
