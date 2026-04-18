# Tasks

- [x] Task 1: 创建 ConfirmDialog 组件
  - [x] SubTask 1.1: 创建 components/ConfirmDialog/index.tsx，基于 Dialog 组件
  - [x] SubTask 1.2: 支持 open/onOpenChange/title/description/confirmText/cancelText/onConfirm/variant 属性

- [x] Task 2: 替换 DocList 中的 window.confirm
  - [x] SubTask 2.1: 添加 deleteTagDialogOpen 状态和 pendingDeleteTag 状态
  - [x] SubTask 2.2: 将 handleDeleteTag 中的 window.confirm 替换为打开 ConfirmDialog
  - [x] SubTask 2.3: 添加 ConfirmDialog 组件到 JSX

- [x] Task 3: 替换 PageTags 中的 window.confirm
  - [x] SubTask 3.1: 添加 deleteTagDialogOpen 状态和 pendingDeleteTag 状态
  - [x] SubTask 3.2: 将 deleteTagMutation 中的 window.confirm 替换为打开 ConfirmDialog
  - [x] SubTask 3.3: 添加 ConfirmDialog 组件到 JSX

# Task Dependencies
- [Task 2, Task 3] depends on [Task 1]
