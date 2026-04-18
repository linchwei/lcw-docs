# 修复文档编辑器 Spec

## Why
文档编辑器无法正常工作，存在两个关键错误：1) TipTap 版本不匹配导致 `focusEvents$` RangeError，编辑器无法初始化；2) DocEditor 中 `useQuery` 缺少 `queryFn`，导致当前用户信息无法获取，协作光标功能失效。

## What Changes
- 修复 `@lcw-doc/react` 中 TipTap 版本不匹配问题（`@tiptap/core` 和 `@tiptap/react` 从 `^2.7.1` 升级到 `^2.26.2`）
- 在 `DocEditor.tsx` 中添加缺失的 `queryFn`
- 修复 `Doc/index.tsx` 中 Y.Doc/WebsocketProvider 的模块级单例问题，改为组件内创建
- 修复 `Doc/index.tsx` 中双重 disconnect 清理问题

## Impact
- Affected code:
  - `packages/react/package.json` - TipTap 版本升级
  - `apps/web/src/pages/Doc/DocEditor.tsx` - 添加 queryFn
  - `apps/web/src/pages/Doc/index.tsx` - 修复 Y.Doc/Provider 生命周期

## ADDED Requirements

### Requirement: 编辑器正常初始化
The system SHALL initialize the document editor without errors.

#### Scenario: 打开文档页面
- **WHEN** 用户打开一个文档页面
- **THEN** 编辑器正常渲染，无 RangeError 错误
- **AND** TipTap 插件不会重复注册

### Requirement: 当前用户信息正确获取
The system SHALL correctly fetch the current user information for collaboration features.

#### Scenario: 获取当前用户
- **WHEN** 编辑器组件挂载
- **THEN** useQuery 正确调用 queryFn 获取用户信息
- **AND** 协作光标显示正确的用户名

### Requirement: Yjs 连接生命周期正确管理
The system SHALL properly manage Y.Doc and WebsocketProvider lifecycle per document.

#### Scenario: 切换文档
- **WHEN** 用户从文档A导航到文档B
- **THEN** 旧的 Y.Doc 和 Provider 被正确清理
- **AND** 新的 Y.Doc 和 Provider 为新文档创建
- **AND** 不会出现双重 disconnect 问题

## MODIFIED Requirements
### Requirement: TipTap 依赖版本
`@lcw-doc/react` 中的 `@tiptap/core` 和 `@tiptap/react` 版本必须与 `@lcw-doc/core` 中的版本一致，当前为 `^2.26.2`。
