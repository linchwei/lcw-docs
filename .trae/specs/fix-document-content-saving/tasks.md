# Tasks

- [x] Task 1: 移除 main.ts 中的 WsAdapter
  - [x] SubTask 1.1: 删除 `import { WsAdapter } from '@nestjs/platform-ws'`
  - [x] SubTask 1.2: 删除 `app.useWebSocketAdapter(new WsAdapter(app))`

- [x] Task 2: 重写 DocYjsGateway 为普通 NestJS Provider
  - [x] SubTask 2.1: 移除 `@WebSocketGateway()` 装饰器、`@WebSocketServer()` 装饰器、`@SubscribeMessage()` 装饰器
  - [x] SubTask 2.2: 移除 `OnGatewayConnection`、`OnGatewayDisconnect` 接口实现
  - [x] SubTask 2.3: 实现 `OnModuleInit` 接口
  - [x] SubTask 2.4: 注入 `HttpAdapterHost` 获取底层 HTTP Server
  - [x] SubTask 2.5: 在 `onModuleInit` 中创建 `ws.Server({ noServer: true })`
  - [x] SubTask 2.6: 在 HTTP Server 上注册 `upgrade` 事件处理器，检查 URL 是否以 `/doc-yjs-` 开头
  - [x] SubTask 2.7: 在 ws.Server 的 `connection` 事件中执行 JWT 验证和 `setupWSConnection` 调用
  - [x] SubTask 2.8: 处理连接断开时的清理逻辑

- [x] Task 3: 验证 TypeScript 编译无错误
  - [x] SubTask 3.1: 运行 TypeScript 编译检查

- [x] Task 4: 使用 MCP 进行端到端测试
  - [x] SubTask 4.1: 启动后端和前端服务器
  - [x] SubTask 4.2: 打开浏览器登录并进入文档编辑页
  - [x] SubTask 4.3: 在编辑器中输入文本内容
  - [x] SubTask 4.4: 等待内容同步后刷新页面
  - [x] SubTask 4.5: 验证刷新后内容仍然存在

# Task Dependencies
- [Task 1] 和 [Task 2] 可并行执行
- [Task 3] 依赖 [Task 1] 和 [Task 2]
- [Task 4] 依赖 [Task 3]
