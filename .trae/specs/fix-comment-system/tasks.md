# Tasks

- [x] Task 1: 修复后端评论服务 — 树形结构、权限、级联删除
  - [x] SubTask 1.1: 修改 `findByPageId` 方法，将扁平评论列表组装为树形结构（顶级评论 + replies 嵌套）
  - [x] SubTask 1.2: 修改 `create` 方法权限校验，协作者也能评论（移除 `user: { id: params.userId }` 条件，仅校验页面存在且未删除）
  - [x] SubTask 1.3: 修改 `findByPageId` 权限校验，协作者也能查看评论
  - [x] SubTask 1.4: 修改 `reply` 方法权限校验，协作者也能回复
  - [x] SubTask 1.5: 修改 `resolve` 方法权限校验，协作者也能解决评论
  - [x] SubTask 1.6: 修改 `delete` 方法，删除父评论时级联删除所有子回复
  - [x] SubTask 1.7: 修改 `delete` 方法权限校验，用户可删除自己创建的评论或页面所有者可删除任何评论

- [x] Task 2: 修复前端评论面板布局
  - [x] SubTask 2.1: 重构 `Doc/index.tsx` 布局，将 CommentPanel 从编辑器居中容器中移出，作为独立右侧面板
  - [x] SubTask 2.2: 为 CommentPanel 传入 `onClose` 回调
  - [x] SubTask 2.3: 为 CommentButton 传入 `commentCount`（从评论查询数据中获取）
  - [x] SubTask 2.4: 确保编辑器内容区域在评论面板打开时自动收缩

- [x] Task 3: 修复前端评论展示逻辑
  - [x] SubTask 3.1: 修改 `CommentPanel` 中评论列表渲染逻辑，仅遍历顶级评论（`parentId` 为空），回复通过 `comment.replies` 嵌套展示
  - [x] SubTask 3.2: 确保回复评论的回复功能正常工作

# Task Dependencies
- [Task 2] depends on [Task 1]（需要后端返回正确的树形结构）
- [Task 3] depends on [Task 1]（需要后端返回正确的树形结构）
