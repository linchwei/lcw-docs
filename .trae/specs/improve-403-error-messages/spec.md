# 改进 403 权限错误提示信息 Spec

## Why
非所有者用户尝试越权操作时，接口仅返回 403 状态码和模糊的错误消息（如 "no access"、"no permission"），前端也没有对 403 做专门处理，导致用户无法理解为什么被拒绝以及应该怎么做。

## What Changes
- 后端所有 `ForbiddenException` 的消息改为具体的中文描述，包含用户当前角色和所需角色信息
- 后端 403 响应增加 `code` 字段标识错误类型，方便前端做差异化处理
- 前端 `request.ts` 拦截器增加 403 错误处理，使用 toast 展示具体错误信息
- 前端各页面 API 调用的 `onError` 统一展示后端返回的具体错误消息

## Impact
- Affected code:
  - `apps/server/src/modules/collaborator/collaborator.service.ts` — 3 处模糊的 ForbiddenException
  - `apps/server/src/modules/page/page.service.ts` — 1 处模糊的 ForbiddenException
  - `apps/server/src/fundamentals/common/filters/all-exceptions.filter.ts` — 响应格式增加 code 字段
  - `apps/web/src/utils/request.ts` — 增加 403 错误处理
  - `apps/web/src/components/CollaboratorPanel/index.tsx` — 确保 onError 展示具体消息

## ADDED Requirements

### Requirement: 403 错误响应包含具体信息
后端在抛出 `ForbiddenException` 时 SHALL 提供具体的中文错误消息，包含：
- 用户当前角色（如：查看者、编辑者）
- 被拒绝的操作描述
- 所需权限说明

#### Scenario: 查看者尝试添加协作者
- **WHEN** 角色为 viewer 的用户调用添加协作者接口
- **THEN** 返回 403，message 为 "您是查看者，无法管理协作者，仅文档所有者可执行此操作"

#### Scenario: 查看者尝试修改协作者角色
- **WHEN** 角色为 viewer 的用户调用更新协作者接口
- **THEN** 返回 403，message 为 "您是查看者，无法修改协作者权限，仅文档所有者可执行此操作"

#### Scenario: 非协作者查看协作者列表
- **WHEN** 既非所有者也非协作者的用户查看协作者列表
- **THEN** 返回 403，message 为 "您无权查看此文档的协作者信息"

#### Scenario: 非所有者删除协作者
- **WHEN** 非所有者且非自身的用户尝试删除协作者
- **THEN** 返回 403，message 为 "您无权移除此协作者，仅文档所有者或协作者本人可执行此操作"

#### Scenario: 非协作者访问文档
- **WHEN** 无任何权限的用户访问文档
- **THEN** 返回 403，message 为 "您没有访问此文档的权限，请向文档所有者申请访问"

### Requirement: 403 响应增加错误码
后端 403 响应 SHALL 包含 `code` 字段，用于标识具体的权限错误类型，方便前端做差异化处理。

#### Scenario: 返回错误码
- **WHEN** 后端抛出 ForbiddenException
- **THEN** 响应体包含 `code` 字段，值为以下之一：`FORBIDDEN_NO_ACCESS`、`FORBIDDEN_NOT_OWNER`、`FORBIDDEN_ROLE_INSUFFICIENT`、`FORBIDDEN_SELF_OPERATION`

### Requirement: 前端统一处理 403 错误
前端 `request.ts` 拦截器 SHALL 对 403 状态码做专门处理，使用 toast 展示后端返回的具体错误消息。

#### Scenario: 403 错误展示
- **WHEN** API 返回 403 状态码
- **THEN** 前端使用 toast 展示后端返回的 message 字段内容

#### Scenario: 403 错误无 message
- **WHEN** API 返回 403 但 message 为空或缺失
- **THEN** 前端展示默认提示 "您没有执行此操作的权限"
