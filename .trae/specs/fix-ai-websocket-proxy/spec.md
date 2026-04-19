# 修复 AI 流式响应和 WebSocket 连接问题 Spec

## Why
部署到服务器后，AI 聊天接口不返回数据（SSE 流式响应被 Nginx 缓冲），WebSocket 协同编辑连接不上（Nginx 配置问题导致 upgrade 请求未正确代理）。

## What Changes
- 修改 `apps/web/nginx.conf`，为 `/api/` location 添加 SSE 流式响应支持（禁用缓冲、设置合适的 Content-Type）
- 修改 `apps/web/nginx.conf`，确保 WebSocket `/doc-yjs-` location 优先级高于 `/` 的 try_files
- 修改 `apps/server/src/main.ts`，为 AI chat 接口设置正确的 SSE 响应头

## Impact
- Affected code: `apps/web/nginx.conf`, `apps/server/src/modules/ai/ai.controller.ts`
- Affected infrastructure: 服务器上需要重新构建 web 镜像

## ADDED Requirements

### Requirement: AI SSE 流式响应
系统 SHALL 在 Nginx 反向代理后正确返回 AI 聊天的 SSE 流式响应数据。

#### Scenario: AI 聊天流式响应
- **WHEN** 前端调用 `POST /api/ai/chat`
- **THEN** Nginx 不缓冲响应，SSE 数据实时流式传输到前端

### Requirement: WebSocket 协同编辑连接
系统 SHALL 在 Nginx 反向代理后正确建立 WebSocket 连接。

#### Scenario: WebSocket 连接建立
- **WHEN** 前端发起 `ws://host/doc-yjs-{pageId}` WebSocket 升级请求
- **THEN** Nginx 正确代理 upgrade 请求到 server，WebSocket 连接成功建立

## MODIFIED Requirements

### Requirement: Nginx 反向代理配置
原配置中 `/api/` location 缺少 SSE 支持（proxy_buffering、Cache-Control、X-Accel-Buffering），WebSocket location 需要确保优先级。

修改点：
1. `/api/` location 添加 `proxy_buffering off`、`proxy_cache off`、`X-Accel-Buffering: no` 头，确保 SSE 流式响应不被缓冲
2. `/api/` location 的 `proxy_read_timeout` 增加到 300s（AI 响应可能较慢）
3. `/doc-yjs-` location 确保在 `/` 之前匹配（Nginx 前缀匹配中，更长前缀优先，当前配置已正确）

### Requirement: AI Controller SSE 响应头
AI chat 接口需要显式设置 SSE 响应头，确保 Nginx 和浏览器正确识别流式响应。
