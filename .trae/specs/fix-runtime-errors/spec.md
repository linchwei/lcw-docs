# 修复运行时错误 Spec

## Why
v0.2.0 功能实现后，应用启动报错无法正常运行。核心原因是 `KeyboardShortcutsDialog` 组件导入了不存在的 `@lcw-doc/shadcn-shared-ui/components/ui/dialog` 模块，导致 Vite 构建失败，前端页面完全无法加载。

## What Changes
- 在 `@lcw-doc/shadcn-shared-ui` 包中创建 `dialog.tsx` 组件（基于 `@radix-ui/react-dialog`，参照 shadcn/ui 标准实现）
- 验证前端和后端服务均可正常启动
- 验证登录流程和文档编辑流程正常工作

## Impact
- Affected code: `packages/shadcn-shared-ui/src/components/ui/dialog.tsx`（新增）, `apps/web/src/components/KeyboardShortcutsDialog/index.tsx`（依赖修复）
- Affected systems: 前端 Vite 构建、应用启动

## ADDED Requirements

### Requirement: Dialog 组件
系统 SHALL 在 `@lcw-doc/shadcn-shared-ui` 包中提供 `dialog.tsx` 组件，导出 `Dialog`, `DialogPortal`, `DialogOverlay`, `DialogClose`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription` 组件。

#### Scenario: KeyboardShortcutsDialog 正常渲染
- **WHEN** 用户按下 `Ctrl+/` 快捷键
- **THEN** 快捷键帮助面板正常弹出，显示所有快捷键列表

#### Scenario: 应用正常启动
- **WHEN** 用户访问 `http://localhost:5173`
- **THEN** 页面正常加载，无 Vite 构建错误

### Requirement: 端到端验证
系统 SHALL 在所有代码变更后通过完整的端到端验证。

#### Scenario: 登录流程
- **WHEN** 用户使用正确凭据登录
- **THEN** 成功跳转到文档列表页

#### Scenario: 文档编辑
- **WHEN** 用户打开一个文档
- **THEN** 编辑器正常渲染，可以输入文字
