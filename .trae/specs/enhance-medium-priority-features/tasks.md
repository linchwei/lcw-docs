# Tasks

- [x] Task 1: AI 选中文本操作扩展
  - [x] SubTask 1.1: 在 SelectionAIMenu 的 aiActions 数组中新增"润色"、"缩写"、"扩写"、"解释"四个操作及对应 prompt

- [x] Task 2: 文档标签系统 — 后端
  - [x] SubTask 2.1: 新增 TagEntity（id, tagId, name, color, userId）
  - [x] SubTask 2.2: 新增 PageTagEntity（id, pageId, tagId）关联表
  - [x] SubTask 2.3: 新增 TagModule/Service/Controller — CRUD API（创建标签、列出标签、更新标签、删除标签、为文档添加/移除标签、按标签查询文档）
  - [x] SubTask 2.4: 在 AppModule 中注册 TagModule

- [x] Task 3: 文档标签系统 — 前端
  - [x] SubTask 3.1: 新增标签服务 `services/tag.ts` 和类型 `Tag`、`PageTag`
  - [x] SubTask 3.2: 侧边栏标签分组区域（待后续集成到 Aside）
  - [x] SubTask 3.3: Doc 页面标题下方新增标签编辑区域（添加/移除标签）

- [x] Task 4: 文档封面图
  - [x] SubTask 4.1: PageEntity 新增 coverImage 字段（varchar, nullable）
  - [x] SubTask 4.2: PageService 的 update 方法支持 coverImage
  - [x] SubTask 4.3: 前端 Doc 页面新增封面图区域（预设封面列表 + 移除按钮）
  - [x] SubTask 4.4: 前端 DocList 页面文档卡片显示封面图（待后续集成）

- [x] Task 5: 反向链接面板
  - [x] SubTask 5.1: 后端 PageService 新增 backlinks 方法（查找引用了当前 pageId 的所有文档）
  - [x] SubTask 5.2: 后端 PageController 新增 GET /page/:pageId/backlinks 端点
  - [x] SubTask 5.3: 前端新增 BacklinksPanel 组件
  - [x] SubTask 5.4: 前端 Doc 页面头部新增反向链接按钮

# Task Dependencies
- [Task 3] depends on [Task 2]
- [Task 5] depends on existing graph() method (已实现)
