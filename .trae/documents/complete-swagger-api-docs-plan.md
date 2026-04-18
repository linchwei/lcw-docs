# 完善 Swagger API 文档计划

## 问题分析

### 问题 1：Swagger UI 无法访问
- `main.ts` 中配置了 `SwaggerModule.setup('doc', app, document)`，路径为 `/api/doc`
- **根因**：`helmet()` 中间件默认设置 Content-Security-Policy (CSP) 头，阻止 Swagger UI 的内联脚本执行，导致页面空白或无法加载

### 问题 2：所有端点缺少 Swagger 装饰器
- 17 个控制器、57 个端点，**全部没有** `@ApiTags`、`@ApiOperation`、`@ApiResponse` 等装饰器
- 即使 Swagger UI 能访问，也只显示空壳，无任何有意义的 API 文档

### 问题 3：Zod DTO 不被 Swagger 识别
- 项目使用 Zod schema 定义 DTO，而非 class-validator + class-transformer
- NestJS Swagger 默认只能识别 class-validator 的 class，无法从 Zod schema 自动生成模型定义
- 需要手动创建 `ApiProperty` 装饰的 class 或使用 `@nestjs/swagger` 的 `createZodDto` / 手动 schema 注册

## 实施方案

### 第一步：修复 Swagger UI 访问问题
- 在 `main.ts` 中配置 helmet 允许 Swagger UI 所需的 CSP 策略
- 或在开发环境禁用 helmet 的 CSP

### 第二步：为所有控制器添加 Swagger 装饰器
按模块分组，为每个控制器添加：
- `@ApiTags('中文标签名')` — 控制器级别分组
- `@ApiOperation({ summary: '中文描述' })` — 每个端点的操作描述
- `@ApiResponse({ status: 200, description: '成功' })` — 响应说明
- `@ApiBearerAuth()` — 需要认证的端点
- `@ApiParam()` / `@ApiQuery()` — 参数说明

### 第三步：注册 Zod Schema 到 Swagger
- 使用 `@nestjs/swagger` 的 `@ApiBody({ schema })` 手动为每个端点定义请求体 schema
- 或创建 Swagger 兼容的 DTO class（使用 `@ApiProperty`）

### 第四步：完善 Swagger 文档配置
- 在 `DocumentBuilder` 中添加更详细的描述、联系方式、许可证等

## 模块分组与标签规划

| 控制器 | @ApiTags | 端点数 |
|--------|----------|--------|
| AuthController | 认证 | 4 |
| UserController | 用户 | 1 |
| PageController | 页面 | 14 |
| TagController | 标签 | 9 |
| ShareController | 分享 | 5 |
| CollaboratorController | 协作者 | 4 |
| CommentController | 评论 | 5 |
| FolderController | 文件夹 | 4 |
| AiController | AI 助手 | 1 |
| UploadController | 文件上传 | 1 |
| NotificationController | 通知 | 5 |
| VersionController | 版本历史 | 6 |
| AuditController | 审计日志 | 1 |
| ApplicationController | 应用 | 4 |
| SyncController | 文档同步 | 3 |
| HealthController | 健康检查 | 3 |
| MetricsController | 监控指标 | 1 |

## 修改文件清单

| 文件 | 修改内容 |
|------|---------|
| `apps/server/src/main.ts` | 修复 helmet CSP + 完善 DocumentBuilder 配置 |
| `apps/server/src/modules/auth/auth.controller.ts` | 添加 Swagger 装饰器 |
| `apps/server/src/modules/user/user.controller.ts` | 添加 Swagger 装饰器 |
| `apps/server/src/modules/page/page.controller.ts` | 添加 Swagger 装饰器 |
| `apps/server/src/modules/tag/tag.controller.ts` | 添加 Swagger 装饰器 |
| `apps/server/src/modules/share/share.controller.ts` | 添加 Swagger 装饰器 |
| `apps/server/src/modules/collaborator/collaborator.controller.ts` | 添加 Swagger 装饰器 |
| `apps/server/src/modules/comment/comment.controller.ts` | 添加 Swagger 装饰器 |
| `apps/server/src/modules/folder/folder.controller.ts` | 添加 Swagger 装饰器 |
| `apps/server/src/modules/ai/ai.controller.ts` | 添加 Swagger 装饰器 |
| `apps/server/src/modules/upload/upload.controller.ts` | 添加 Swagger 装饰器 |
| `apps/server/src/modules/notification/notification.controller.ts` | 添加 Swagger 装饰器 |
| `apps/server/src/modules/version/version.controller.ts` | 添加 Swagger 装饰器 |
| `apps/server/src/modules/audit/audit.controller.ts` | 添加 Swagger 装饰器 |
| `apps/server/src/modules/application/application.controller.ts` | 添加 Swagger 装饰器 |
| `apps/server/src/modules/sync/sync.controller.ts` | 添加 Swagger 装饰器 |
| `apps/server/src/modules/health/health.controller.ts` | 添加 Swagger 装饰器 |
| `apps/server/src/fundamentals/metrics/metrics.controller.ts` | 添加 Swagger 装饰器 |

## 实施步骤

1. 修复 main.ts（helmet CSP + DocumentBuilder）
2. 为高频使用的控制器添加 Swagger 装饰器（Auth、User、Page、Tag）
3. 为其余控制器添加 Swagger 装饰器（Share、Collaborator、Comment、Folder、AI、Upload、Notification、Version、Audit、Application、Sync）
4. 为基础设施控制器添加 Swagger 装饰器（Health、Metrics）
5. 启动服务器验证 Swagger UI 可访问且文档完整
