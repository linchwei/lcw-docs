# Tasks

- [x] Task 1: 创建评论后端实体和模块（谨慎开发，不影响现有功能）
  - [x] SubTask 1.1: 创建 CommentEntity 实体（id, pageId, content, anchorText, anchorPos, parentId, createdBy, createdAt, resolvedAt）
  - [x] SubTask 1.2: 创建 CommentModule、CommentService、CommentController
  - [x] SubTask 1.3: 实现 API：POST /api/page/:pageId/comment（创建评论）、GET /api/page/:pageId/comments（获取评论列表）、POST /api/comment/:commentId/reply（回复评论）、PUT /api/comment/:commentId/resolve（解决评论）、DELETE /api/comment/:commentId（删除评论）
  - [x] SubTask 1.4: 在 AppModule 中注册 CommentModule

- [x] Task 2: 创建前端评论组件（独立组件，不影响现有编辑器）
  - [x] SubTask 2.1: 创建 CommentButton 组件（工具栏按钮，点击打开评论面板）
  - [x] SubTask 2.2: 创建 CommentPanel 组件（侧边面板，显示评论列表）
  - [x] SubTask 2.3: 创建 CommentItem 组件（单条评论，包含回复和解决功能）
  - [x] SubTask 2.4: 创建评论相关 API 服务（services/comment.ts）

- [x] Task 3: 在编辑器中集成评论功能（谨慎修改，确保编辑器稳定）
  - [x] SubTask 3.1: 在 DocEditor 中添加评论高亮装饰（使用 ProseMirror Decoration）
  - [x] SubTask 3.2: 在 Doc 页面集成 CommentButton 和 CommentPanel
  - [x] SubTask 3.3: 实现选中文本后添加评论的功能
  - [x] SubTask 3.4: 实现点击评论定位到锚定位置的功能

- [x] Task 4: 端到端测试
  - [x] SubTask 4.1: 测试创建评论流程
  - [x] SubTask 4.2: 测试回复评论功能
  - [x] SubTask 4.3: 测试解决评论功能
  - [x] SubTask 4.4: 验证编辑器原有功能不受影响

# Task Dependencies
- [Task 2] depends on [Task 1]
- [Task 3] depends on [Task 2]
- [Task 4] depends on [Task 3]
