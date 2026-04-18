# 修复文档内容无法保存 Spec

## Why
文档正文内容无法持久化保存。根本原因：NestJS `WsAdapter` 对 WebSocket 升级请求执行**精确路径匹配**（`pathname === wsServer.path`），而 `@WebSocketGateway()` 无参数时默认注册路径为 `/`。y-websocket 客户端将 room 名（`doc-yjs-{pageId}`）作为 URL 路径发送，实际请求路径为 `/doc-yjs-{pageId}`，与 `/` 不匹配，WsAdapter 直接 `socket.destroy()` 销毁连接。WebSocket 连接从未建立，YJS 文档内容无法同步到服务器。

## What Changes
- 移除 `main.ts` 中的 `WsAdapter`（`app.useWebSocketAdapter(new WsAdapter(app))`），因为 WsAdapter 不支持动态路径匹配
- 重写 `DocYjsGateway`：移除 `@WebSocketGateway()` 装饰器及相关 NestJS WebSocket 接口，改为普通 NestJS Provider
- 在 `DocYjsGateway` 的 `onModuleInit` 中，通过 `HttpAdapterHost` 获取底层 HTTP Server，手动注册 `upgrade` 事件处理器
- 创建 `ws.Server({ noServer: true })`，在 upgrade 处理器中检查 URL 是否以 `/doc-yjs-` 开头，匹配则委托给 ws.Server 处理
- 在 ws.Server 的 `connection` 事件中执行 JWT 验证和 `setupWSConnection` 调用

## Impact
- Affected code: `apps/server/src/main.ts`（移除 WsAdapter）, `apps/server/src/modules/doc-yjs/doc-yjs.gateway.ts`（完全重写）, `apps/server/src/modules/doc-yjs/doc-yjs.module.ts`（可能需要调整）
- **BREAKING**: 移除 WsAdapter 后，如果未来添加其他 NestJS WebSocket Gateway，需要重新引入或使用自定义方案

## ADDED Requirements

### Requirement: WebSocket 动态路径连接
系统 SHALL 支持 y-websocket 客户端使用 `/doc-yjs-{pageId}` 作为 URL 路径建立 WebSocket 连接，不再依赖 NestJS WsAdapter 的精确路径匹配。

#### Scenario: 文档编辑保存
- **WHEN** 用户在编辑器中输入内容
- **THEN** 内容通过 YJS WebSocket 同步到服务器并持久化到 PostgreSQL

#### Scenario: 页面刷新后内容恢复
- **WHEN** 用户刷新页面
- **THEN** 编辑器从 YJS PostgreSQL 加载之前保存的内容

#### Scenario: 非法路径拒绝
- **WHEN** WebSocket 连接路径不以 `/doc-yjs-` 开头
- **THEN** 连接被拒绝并关闭

#### Scenario: 无 Token 拒绝
- **WHEN** WebSocket 连接未携带有效的 JWT Token
- **THEN** 连接被拒绝并关闭

## MODIFIED Requirements

### Requirement: WebSocket 服务启动方式
WebSocket 服务不再通过 NestJS WsAdapter 管理，改为在 Provider 的 `onModuleInit` 生命周期中手动创建 `ws.Server` 并注册 HTTP upgrade 处理器。

## REMOVED Requirements

### Requirement: NestJS WsAdapter 路径匹配
**Reason**: WsAdapter 仅支持精确路径匹配，无法处理 y-websocket 的动态路径 `/doc-yjs-{pageId}`
**Migration**: 使用原生 `ws.Server` + HTTP upgrade 处理器替代
