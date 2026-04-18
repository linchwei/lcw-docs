# 修复文档标题编辑 Spec

## Why
文档标题无法修改：`contentEditable` 的 div 同时使用了 `dangerouslySetInnerHTML`，导致 React 重新渲染时用旧数据覆盖用户输入，标题"弹回"原值。同时后端 `update` 方法存在多个 bug（`NotFoundException` 未 throw、payload 未过滤、返回值非数据库实际数据）。

## What Changes
- 移除标题 `contentEditable` div 上的 `dangerouslySetInnerHTML`，改用 `useRef` + 手动同步方案
- 修复 `handleTitleInput` 的 debounce 闭包问题，使用 `useCallback` + `useRef` 稳定引用
- 更新成功后刷新当前页面查询数据
- 后端 `update` 方法：使用 `throw` 替代 `return` 抛出 `NotFoundException`
- 后端 `update` 方法：过滤 payload 只更新合法字段（title、emoji）
- 后端 `update` 方法：更新后重新查询返回数据库实际数据
- 后端 `fetch` 方法：同样修复 `NotFoundException` 未 throw 的问题

## Impact
- Affected code: `apps/web/src/pages/Doc/index.tsx`（前端标题编辑）, `apps/server/src/modules/page/page.service.ts`（后端更新逻辑）, `apps/server/src/modules/page/page.controller.ts`（添加 DTO 验证）

## ADDED Requirements

### Requirement: 文档标题可编辑
系统 SHALL 支持用户在文档页面直接编辑标题，编辑后标题不会因 React 重新渲染而被覆盖。

#### Scenario: 编辑文档标题
- **WHEN** 用户在标题区域输入新标题
- **THEN** 标题实时更新，debounce 后自动保存到后端，保存期间标题不会被覆盖

#### Scenario: 标题保存成功
- **WHEN** 标题保存到后端成功
- **THEN** 前端刷新页面查询数据，显示"已保存"状态

#### Scenario: 标题保存失败
- **WHEN** 标题保存到后端失败
- **THEN** 标题保持用户输入的值，显示错误状态

## MODIFIED Requirements

### Requirement: 页面更新 API
后端 PUT /api/page 接口 SHALL 只接受合法字段（title、emoji），使用 DTO 验证，更新后返回数据库实际数据，找不到页面时正确抛出 404 异常。
