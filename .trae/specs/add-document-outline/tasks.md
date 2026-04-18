# Tasks

- [x] Task 1: 创建 useDocOutline hook
  - [x] Task 1.1: 创建 `apps/web/src/pages/Doc/useDocOutline.ts`，从编辑器提取标题列表
  - [x] Task 1.2: 使用 `useEditorChange` 监听内容变化，实时更新标题列表
  - [x] Task 1.3: 使用 `useEditorSelectionChange` 监听光标位置，确定当前高亮标题

- [x] Task 2: 创建 DocOutline 组件
  - [x] Task 2.1: 创建 `apps/web/src/pages/Doc/DocOutline.tsx`，渲染标题目录列表
  - [x] Task 2.2: 实现层级缩进样式（h1 无缩进，h2 一级，h3 两级）
  - [x] Task 2.3: 实现点击跳转功能（调用 `editor.setTextCursorPosition`）
  - [x] Task 2.4: 实现当前标题高亮样式
  - [x] Task 2.5: 无标题时返回 null（隐藏目录）

- [x] Task 3: 修改 Doc 页面布局
  - [x] Task 3.1: 将 `Doc/index.tsx` 的编辑区域改为 flex 布局
  - [x] Task 3.2: 将 editor 实例从 DocEditor 传递给 DocOutline
  - [x] Task 3.3: 在编辑器右侧添加 DocOutline 组件

- [x] Task 4: 验证文档目录功能
  - [x] Task 4.1: 创建包含多级标题的文档，确认目录正确显示
  - [x] Task 4.2: 点击目录项确认跳转功能正常
  - [x] Task 4.3: 修改/新增/删除标题确认目录实时更新
  - [x] Task 4.4: 确认当前标题高亮功能正常

# Task Dependencies
- Task 2 依赖 Task 1（DocOutline 组件使用 useDocOutline hook）
- Task 3 依赖 Task 2（布局调整需要 DocOutline 组件）
- Task 4 依赖 Task 3（验证需要完整布局）
