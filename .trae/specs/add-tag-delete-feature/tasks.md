# Tasks

- [x] Task 1: 在 DocList 标签选择器中添加删除按钮
  - [x] SubTask 1.1: 在标签列表项右侧添加删除图标按钮（Trash2）
  - [x] SubTask 1.2: 添加 handleDeleteTag 方法，调用 srv.deleteTag 并刷新缓存
  - [x] SubTask 1.3: 添加确认对话框（使用 window.confirm）

- [x] Task 2: 在 PageTags 组件标签选择器中添加删除按钮
  - [x] SubTask 2.1: 在可用标签列表项右侧添加删除图标按钮
  - [x] SubTask 2.2: 添加 deleteMutation 调用 srv.deleteTag
  - [x] SubTask 2.3: 删除后刷新 tags 和 batchPageTags 缓存

# Task Dependencies
- [Task 2] depends on [Task 1]（复用相同的删除逻辑模式）
