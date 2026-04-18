# 增强后端服务器健壮性 Spec

## Why
后端服务缺乏基本的健壮性保障：无优雅关闭（导致数据丢失）、异常过滤器只捕获 HttpException（未处理异常导致进程崩溃）、数据库配置硬编码且无连接池、无全局请求验证、JWT 密钥弱默认值、无安全头等。这些问题使得服务在生产环境中极易崩溃且难以恢复。

## What Changes
- 添加优雅关闭（enableShutdownHooks + SIGTERM/SIGINT 处理）
- 添加全局 AllExceptionsFilter（捕获所有异常，记录日志，返回结构化响应）
- 数据库配置改为环境变量驱动，生产环境禁用 synchronize，添加连接池配置
- 添加全局 ValidationPipe（whitelist + forbidNonWhitelisted + transform）
- 为缺少验证的端点添加 DTO 验证（用户注册、通知、AI 聊天）
- JWT 密钥移除弱默认值，启动时强制检查
- 添加 Helmet 安全头中间件
- 添加请求体大小限制
- 健康检查端点返回正确的 HTTP 状态码
- Y.js storeUpdate 添加 await 和错误处理
- 添加 PM2 ecosystem 配置文件

## Impact
- Affected code: apps/server/src/main.ts, apps/server/src/config/database.ts, apps/server/src/fundamentals/, apps/server/src/modules/
- Affected specs: 无

## ADDED Requirements

### Requirement: 优雅关闭
系统 SHALL 在收到 SIGTERM/SIGINT 信号时执行优雅关闭：
1. 停止接受新请求
2. 等待进行中的请求完成（超时 10 秒）
3. 关闭 WebSocket 连接
4. 关闭数据库连接
5. 调用 app.close()

#### Scenario: 收到 SIGTERM 信号
- **WHEN** 进程收到 SIGTERM 信号
- **THEN** 系统完成进行中的请求后关闭，不丢失数据

### Requirement: 全局异常过滤器
系统 SHALL 使用 AllExceptionsFilter 捕获所有类型的异常（不仅限于 HttpException），记录错误日志，并返回结构化的 JSON 错误响应。

#### Scenario: 数据库查询失败
- **WHEN** TypeORM QueryFailedError 被抛出
- **THEN** 返回 500 状态码和 `{ statusCode: 500, message: "Internal server error", timestamp: "..." }` 响应

### Requirement: 环境变量驱动的数据库配置
系统 SHALL 从环境变量读取数据库连接参数（DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE），生产环境（NODE_ENV=production）自动禁用 synchronize，配置连接池（poolSize: 20, connectionTimeout: 5000ms）。

#### Scenario: 生产环境启动
- **WHEN** NODE_ENV=production
- **THEN** synchronize 为 false，数据库密码从 DB_PASSWORD 环境变量读取

### Requirement: 全局请求验证
系统 SHALL 使用全局 ValidationPipe（whitelist: true, forbidNonWhitelisted: true, transform: true），所有端点的请求体必须通过 DTO 验证。

#### Scenario: 用户注册提交非法字段
- **WHEN** POST /api/user/register 请求体包含 DTO 中未定义的字段
- **THEN** 返回 400 状态码和错误详情

### Requirement: JWT 密钥安全
系统 SHALL 在启动时检查 JWT_SECRET 环境变量是否已设置，若未设置则输出警告日志（开发环境）或拒绝启动（生产环境）。

### Requirement: 安全头
系统 SHALL 使用 Helmet 中间件添加安全响应头（X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security 等）。

### Requirement: 请求体大小限制
系统 SHALL 限制 JSON 请求体大小为 1MB，防止大请求体 DoS 攻击。

### Requirement: 健康检查状态码
系统 SHALL 在数据库不可用时返回 503 状态码（而非始终返回 200）。

### Requirement: Y.js 持久化错误处理
系统 SHALL 对 Y.js storeUpdate 调用添加 await 和 try-catch 错误处理，防止静默数据丢失。

### Requirement: PM2 集群配置
系统 SHALL 提供 ecosystem.config.js 配置文件，支持集群模式、自动重启和日志管理。

## MODIFIED Requirements
无

## REMOVED Requirements
无
