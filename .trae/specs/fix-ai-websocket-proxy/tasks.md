# Tasks

- [x] Task 1: 修改 nginx.conf 支持 SSE 流式响应和 WebSocket
  - [x] `/api/` location 添加 `proxy_buffering off` 和 `proxy_cache off`
  - [x] `/api/` location 添加 `add_header X-Accel-Buffering no` 
  - [x] `/api/` location 的 `proxy_read_timeout` 改为 300s
  - [x] `/api/` location 添加 `proxy_set_header Accept-Encoding` 允许流式传输
- [x] Task 2: 修改 AI Controller 设置正确的 SSE 响应头
  - [x] 在 chat 方法中使用 `@Res()` 装饰器获取 Response 对象
  - [x] 设置 `Content-Type: text/event-stream`、`Cache-Control: no-cache`、`Connection: keep-alive` 响应头
  - [x] 将 MiniMax API 的流式响应 pipe 到客户端 Response
- [ ] Task 3: 在服务器上重新构建并部署
  - [x] 更新服务器上的 nginx.conf 和 ai.controller.ts
  - [x] 重新构建 web 和 server 镜像
  - [x] 重启服务并验证

# Task Dependencies
- Task 2 depends on Task 1 (可并行)
- Task 3 depends on Task 1 and Task 2
