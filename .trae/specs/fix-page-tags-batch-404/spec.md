# 修复 page-tags/batch 接口 404 错误 Spec

## Why
`POST /api/page-tags/batch` 接口返回 404，原因是 `@Throttle()` 装饰器从 `@nestjs/common` 导入，但该包并不导出 `Throttle`（值为 `undefined`），导致控制器加载时抛出 TypeError，整个 `TagController` 无法注册到 NestJS 路由表中。

## What Changes
- 将 `tag.controller.ts` 中 `Throttle` 的导入来源从 `@nestjs/common` 修正为 `@nestjs/throttler`

## Impact
- Affected specs: tag 模块所有 API 路由
- Affected code: `apps/server/src/modules/tag/tag.controller.ts`

## ADDED Requirements

### Requirement: Throttle 装饰器正确导入
系统 SHALL 从 `@nestjs/throttler` 导入 `Throttle` 装饰器，而非 `@nestjs/common`。

#### Scenario: 服务器启动时 TagController 正常注册
- **WHEN** 服务器启动
- **THEN** `TagController` 所有路由（包括 `POST /api/page-tags/batch`）正常注册，无 TypeError

#### Scenario: 批量标签接口正常响应
- **WHEN** 客户端发送 `POST /api/page-tags/batch` 请求，body 为 `{ pageIds: [] }`
- **THEN** 返回 `{ data: {}, success: true }`，而非 404

## MODIFIED Requirements

### Requirement: Tag 读取端点放宽限流（修正导入）
`@Throttle()` 装饰器 SHALL 从 `@nestjs/throttler` 导入，确保限流配置在运行时生效。
