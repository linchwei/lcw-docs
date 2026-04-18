# 替换 window.confirm 为 Dialog 确认框 Spec

## Why
标签删除功能当前使用 `window.confirm` 原生浏览器对话框，UI 风格与项目整体设计不一致，体验粗糙。应替换为项目已有的 shadcn Dialog 组件，保持 UI 一致性。

## What Changes
- 创建可复用的 `ConfirmDialog` 组件，基于项目已有的 `Dialog` 组件
- 替换 DocList 中的 `window.confirm` 为 `ConfirmDialog`
- 替换 PageTags 中的 `window.confirm` 为 `ConfirmDialog`

## Impact
- Affected code: 新增 `components/ConfirmDialog/index.tsx`，修改 `pages/DocList/index.tsx`、`components/PageTags/index.tsx`

## ADDED Requirements

### Requirement: ConfirmDialog 组件
系统 SHALL 提供可复用的确认对话框组件，支持自定义标题、描述、确认按钮文字和样式。

#### Scenario: 显示确认对话框
- **WHEN** 组件的 `open` 属性为 true
- **THEN** 显示模态确认对话框，包含标题、描述、取消按钮和确认按钮

#### Scenario: 用户点击确认
- **WHEN** 用户点击确认按钮
- **THEN** 调用 `onConfirm` 回调并关闭对话框

### Requirement: 替换 window.confirm
系统 SHALL 在标签删除场景中使用 ConfirmDialog 替代 window.confirm。
