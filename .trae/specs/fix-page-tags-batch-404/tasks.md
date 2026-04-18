# Tasks

- [x] Task 1: 修正 Throttle 装饰器导入来源
  - [x] SubTask 1.1: 在 tag.controller.ts 中将 `Throttle` 从 `@nestjs/common` 的导入移除，改为从 `@nestjs/throttler` 导入
  - [x] SubTask 1.2: 验证其他使用 `@nestjs/common` 导入 `Throttle` 的控制器文件，如有则一并修正

- [x] Task 2: 重启服务器并验证路由
  - [x] SubTask 2.1: 清理 dist 目录并重新编译
  - [x] SubTask 2.2: 重启后端服务器
  - [x] SubTask 2.3: 使用 curl 测试 `POST /api/page-tags/batch` 返回非 404 响应
  - [x] SubTask 2.4: 测试其他 tag 路由（如 `GET /api/tags`）仍正常返回 401（未认证）

# Task Dependencies
- [Task 2] depends on [Task 1]
