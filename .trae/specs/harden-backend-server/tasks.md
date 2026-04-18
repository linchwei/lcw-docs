# Tasks

- [x] Task 1: 添加优雅关闭 — main.ts 中添加 enableShutdownHooks() 和 SIGTERM/SIGINT 处理
- [x] Task 2: 添加 AllExceptionsFilter — 捕获所有异常，记录日志，返回结构化响应
- [x] Task 3: 数据库配置改为环境变量驱动 — 移除硬编码，添加连接池，生产环境禁用 synchronize
- [x] Task 4: 添加全局 ValidationPipe — whitelist + forbidNonWhitelisted + transform
- [x] Task 5: 为缺少验证的端点添加 DTO — 用户注册、AI 聊天端点
- [x] Task 6: JWT 密钥安全 — 移除弱默认值，启动时强制检查
- [x] Task 7: 添加 Helmet 安全头中间件
- [x] Task 8: 添加请求体大小限制（1MB）
- [x] Task 9: 健康检查返回正确状态码 — 数据库不可用时返回 503
- [x] Task 10: Y.js storeUpdate 添加 await 和错误处理
- [x] Task 11: 添加 PM2 ecosystem.config.js
- [x] Task 12: 通过 MCP 浏览器验证所有改动正常工作

# Task Dependencies
- [Task 2] depends on [Task 1]
- [Task 4] depends on [Task 2]
- [Task 5] depends on [Task 4]
- [Task 12] depends on [Task 1-11]
