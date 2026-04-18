# 协同文档新功能增强计划（第二轮）

## 已实现功能总览

| 类别 | 已实现功能 |
|------|-----------|
| 文档编辑 | BlockNote 编辑器、Markdown 快捷输入、Slash 菜单、@引用文档 |
| 协作 | Yjs 实时协作、WebSocket 同步、PostgreSQL 持久化、多用户光标 |
| AI | 全局 AI 对话、选中文本 AI 菜单（续写/改写/翻译/总结）、行内 AI 面板 |
| 文档管理 | 创建/删除/收藏、回收站、最近编辑、全文搜索、文档图谱、文件夹分组 |
| 导出 | Markdown/HTML/Word/PDF/纯文本 |
| 评论 | 创建/回复/解决/删除评论、评论面板侧栏 |
| 分享 | 分享链接、密码保护、过期时间、权限控制 |
| 版本 | 版本快照创建/查看/删除、版本历史面板 |
| 其他 | 文档大纲、模板库、Markdown 上传、字数统计、深色模式、快捷键 |

## 新增功能建议（按优先级排序）

### 🔴 高优先级 — 协作闭环与编辑体验

#### 1. 文档内图片上传与粘贴
**为什么需要**：当前编辑器无法直接插入图片，这是文档编辑器的基础能力。用户粘贴截图或拖拽图片时应该自动上传并插入。
- 后端：UploadModule 已有基础上传能力，需新增图片上传 API（返回 URL）
- 前端：BlockNote 编辑器自定义 Image 块，支持粘贴/拖拽上传、图片预览、尺寸调整
- 涉及：DocEditor 增强、UploadModule 增强、新增 ImageBlock 组件

#### 2. 协作者管理与权限系统
**为什么需要**：当前通过分享链接协作，无法管理协作者列表、无法精细化权限控制。需要正式的协作者邀请和管理机制。
- 后端：新增 CollaboratorEntity（userId, pageId, role: owner/editor/viewer），协作者 CRUD API
- 前端：协作者列表面板、邀请协作者（通过用户名/邮箱）、角色权限管理
- 权限逻辑：所有者可管理协作者和删除文档，编辑者可编辑内容，查看者只读
- 涉及：新增 CollaboratorModule；SharePopover 增强；Doc 页面权限校验

#### 3. 文档内 @提及通知
**为什么需要**：协作场景中需要 @某人让其关注特定内容，这是团队协作的核心功能。
- 后端：新增 NotificationEntity（type: mention/comment/share, fromUser, toUser, pageId, content, read），通知 CRUD API
- 前端：Header 新增通知铃铛（未读计数）、通知列表下拉面板、点击跳转到对应文档/评论
- 触发时机：评论时 @用户、分享文档给用户、被添加为协作者
- 涉及：新增 NotificationModule；CommentPanel 增强；Header 增强

### 🟡 中优先级 — 效率与差异化

#### 4. AI 功能增强
**为什么需要**：当前 AI 功能较基础，可以更深度集成到编辑流程，提升差异化竞争力。
- **SelectionAIMenu 扩展**：新增"润色"、"缩写"、"扩写"、"解释"、"修正语法"操作
- **AI 生成文档大纲**：根据文档内容自动生成结构化大纲
- **AI 自动摘要**：为文档生成摘要，显示在文档列表中
- **对话历史持久化**：GlobalAIChat 的对话记录保存到后端
- 涉及：SelectionAIMenu 增强、GlobalAIChat 增强、新增 AI 对话历史 API

#### 5. 文档标签系统
**为什么需要**：比文件夹更灵活的文档分类方式，一个文档可以有多个标签，支持跨文件夹筛选。
- 后端：新增 TagEntity（id, tagId, name, color, userId）、PageTagEntity（pageId, tagId）
- 前端：侧边栏标签分组、文档头部添加/移除标签、按标签筛选文档
- 涉及：新增 TagModule；Aside 增强；Doc 页面增强

#### 6. 文档封面和图标自定义
**为什么需要**：让文档更有辨识度和个性化，类似 Notion 的封面图和图标。
- 后端：PageEntity 新增 coverImage、icon 字段
- 前端：文档顶部封面图区域（预设封面 + 自定义上传）、图标选择器（emoji + 自定义上传）
- 涉及：PageEntity 修改；Doc 页面增强；新增 CoverPicker、IconPicker 组件

#### 7. 文档内链接与反向链接
**为什么需要**：当前 @引用只能创建图谱关系，文档内无法直接链接跳转到其他文档的具体位置。
- 前端：增强 @引用功能，支持搜索文档并插入可点击链接
- 点击链接直接跳转到目标文档
- 反向链接面板：显示哪些文档引用了当前文档
- 涉及：DocEditor 增强；新增 BacklinksPanel 组件

### 🟢 低优先级 — 锦上添花

#### 8. 文档嵌入块（iframe/视频/代码沙盒）
**为什么需要**：支持嵌入外部内容，丰富文档表达力。
- 前端：新增 EmbedBlock 自定义块，支持 YouTube/Bilibili 视频、Figma、代码沙盒等
- 涉及：BlockNote 自定义块；新增 EmbedDialog 组件

#### 9. 数据导入增强（Word/HTML）
**为什么需要**：用户从其他平台迁移时，需要支持更多格式导入。
- 后端：集成 mammoth.js 解析 .docx 文件，支持 HTML 导入
- 前端：MarkdownUploadDialog 增强为通用导入对话框
- 涉及：UploadModule 增强；MarkdownUploadDialog 重构

#### 10. 移动端适配优化
**为什么需要**：当前移动端体验一般，侧边栏和编辑器需要更好的响应式设计。
- 前端：触摸手势优化、移动端底部工具栏、响应式布局重构
- 涉及：Doc 页面、Aside 组件响应式重构

#### 11. PWA 支持
**为什么需要**：离线访问、安装到桌面、推送通知。
- 配置：vite-plugin-pwa、Service Worker、manifest.json
- 涉及：vite.config.ts 配置

#### 12. 文档模板市场
**为什么需要**：当前模板是硬编码的，用户无法自定义模板或分享模板。
- 后端：TemplateEntity（name, content, category, isPublic, createdBy）
- 前端：模板市场页面、用户自定义模板、模板收藏
- 涉及：新增 TemplateModule；TemplateDialog 增强

## 推荐实施顺序

1. **文档内图片上传与粘贴** — 文档编辑器的基础能力，缺失影响核心体验
2. **协作者管理与权限系统** — 完善协作闭环，从"分享链接"升级为"正式协作"
3. **文档内 @提及通知** — 团队协作的关键功能
4. **AI 功能增强** — 差异化竞争力，投入产出比高
5. **文档标签系统** — 文档组织的灵活性
6. **文档封面和图标自定义** — 提升视觉体验和辨识度
7. **文档内链接与反向链接** — 知识管理能力
8. 其余按需实施
