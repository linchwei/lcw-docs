# 修复页面标签 API 429 限流错误 Spec

## Why
`/api/page/:pageId/tags` 接口在文档列表页因 N+1 查询模式（每个卡片独立请求标签）触发后端全局 ThrottlerGuard 的 1秒/3次 限流，导致 429 Too Many Requests 错误，用户标签无法正常显示。

## What Changes
- 后端新增批量获取页面标签接口 `POST /api/page-tags/batch`，一次传入多个 pageId
- 后端为 tag 相关读取端点添加自定义 `@Throttle()` 装饰器，放宽限流阈值
- 前端 DocList 页面消除 N+1 查询，改为在列表层一次性批量获取所有页面标签
- 前端 QueryClient 配置合理的 `staleTime`，减少不必要的重复请求

## Impact
- Affected specs: tag 模块 API、DocList 页面渲染
- Affected code:
  - `apps/server/src/modules/tag/tag.controller.ts`
  - `apps/server/src/modules/tag/tag.service.ts`
  - `apps/server/src/modules/tag/tag.dto.ts`
  - `apps/web/src/pages/DocList/index.tsx`
  - `apps/web/src/services/tag.ts`
  - `apps/web/src/utils/query-client.ts`

## ADDED Requirements

### Requirement: 批量获取页面标签接口
系统 SHALL 提供 `POST /api/page-tags/batch` 接口，接受 `{ pageIds: string[] }` 请求体，返回 `{ data: Record<pageId, Tag[]>, success: true }`。

#### Scenario: 正常批量获取
- **WHEN** 客户端发送 `POST /api/page-tags/batch` 请求，body 为 `{ pageIds: ["page1", "page2"] }`
- **THEN** 返回 `{ data: { "page1": [...tags], "page2": [...tags] }, success: true }`

#### Scenario: 空 pageIds 数组
- **WHEN** 客户端发送 `POST /api/page-tags/batch` 请求，body 为 `{ pageIds: [] }`
- **THEN** 返回 `{ data: {}, success: true }`

#### Scenario: pageIds 数组过长
- **WHEN** 客户端发送超过 50 个 pageId
- **THEN** 返回 400 Bad Request

### Requirement: Tag 读取端点放宽限流
系统 SHALL 为 tag 模块的读取端点（`GET /api/tags`、`GET /api/page/:pageId/tags`、`GET /api/tag/:tagId/pages`、`POST /api/page-tags/batch`）设置自定义限流为 10秒/100次，避免正常使用触发 429。

#### Scenario: 短时间内多次请求标签
- **WHEN** 用户在 10 秒内请求标签接口不超过 100 次
- **THEN** 所有请求正常返回，不触发 429

### Requirement: 前端消除标签 N+1 查询
系统 SHALL 在 DocList 页面使用批量接口一次性获取所有页面标签，而非每个卡片独立发起 `useQuery` 请求。

#### Scenario: 加载包含 N 个文档的列表页
- **WHEN** 用户打开文档列表页，列表中有 10 个文档
- **THEN** 前端仅发起 1 次批量标签请求（而非 10 次独立请求）

### Requirement: QueryClient 缓存优化
系统 SHALL 为 QueryClient 配置默认 `staleTime: 30_000`（30秒），避免数据立即过期导致的重复请求。

#### Scenario: 窗口聚焦时标签数据未过期
- **WHEN** 用户切换浏览器标签页后切回，且距上次请求不到 30 秒
- **THEN** 使用缓存数据，不重新发起请求
