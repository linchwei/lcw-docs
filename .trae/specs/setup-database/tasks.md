# Tasks

## Task 1: 启动数据库
- [x] Task 1.1: 停止旧的 PostgreSQL 容器（如有）
- [x] Task 1.2: 使用 docker-compose up -d 启动 PostgreSQL
- [x] Task 1.3: 验证数据库容器运行状态和连接

## Task 2: 构建并启动后端服务
- [x] Task 2.1: 构建后端项目（pnpm run build）
- [x] Task 2.2: 启动后端服务（node dist/main.js）
- [x] Task 2.3: 验证后端服务成功连接数据库

## Task 3: 启动前端服务
- [x] Task 3.1: 确认前端 dev server 运行中
- [x] Task 3.2: 验证前端代理配置正确

## Task 4: 使用 MCP 测试注册和登录
- [x] Task 4.1: 打开浏览器访问登录页
- [x] Task 4.2: 测试注册新用户
- [x] Task 4.3: 测试登录功能
- [x] Task 4.4: 验证登录成功后跳转

# Task Dependencies
- Task 1 必须在 Task 2 之前完成
- Task 2 必须在 Task 4 之前完成
- Task 3 可以与 Task 2 并行
