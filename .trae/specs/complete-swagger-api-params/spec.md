# 完善 Swagger API 入参和返回模型 Spec

## Why
当前 Swagger 文档只有端点描述（@ApiOperation），但所有 57 个端点都缺少请求体（requestBody）和响应模型（responseSchema），导致 API 文档无法展示入参字段和返回数据结构，实用性极低。

## What Changes
- 为所有 POST/PUT 端点添加 `@ApiBody({ schema })` 定义请求体结构
- 为所有端点添加 `@ApiResponse({ schema })` 定义响应数据结构
- 使用 `@nestjs/swagger` 的 `ApiExtraModels` + `getSchemaPath` 注册通用响应包装器
- 在 main.ts 中使用 `SwaggerModule.setup` 的 `extraModels` 选项

## Impact
- Affected code: 所有 17 个控制器文件 + main.ts

## ADDED Requirements

### Requirement: 请求体文档
系统 SHALL 为所有 POST/PUT 端点通过 @ApiBody 装饰器定义请求体 JSON Schema，包含字段名、类型、是否必填、枚举值、描述。

#### Scenario: Swagger UI 展示请求体
- **WHEN** 用户在 Swagger UI 中展开一个 POST 端点
- **THEN** 能看到请求体的所有字段、类型、是否必填、示例值

### Requirement: 响应模型文档
系统 SHALL 为所有端点通过 @ApiResponse 装饰器定义 200 和 401 响应的 JSON Schema，包含 data 字段的结构。

#### Scenario: Swagger UI 展示响应模型
- **WHEN** 用户在 Swagger UI 中展开一个端点
- **THEN** 能看到 200 响应的完整数据结构，包括字段名和类型

### Requirement: 通用响应包装器
系统 SHALL 定义统一的 API 响应格式 `{ data: T, success: boolean }`，并在 Swagger 中注册为通用模型。
