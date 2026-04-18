# Tasks

- [x] Task 1: 编辑器超链接功能
  - [x] SubTask 1.1: 在 DocEditor.tsx 的 schema 中注册 link inlineContent（确认 defaultInlineContentSpecs 已包含 link）
  - [x] SubTask 1.2: 验证 CreateLinkButton 和 LinkToolbar 正常工作（Ctrl+K 创建链接、悬浮编辑/删除）
  - [x] SubTask 1.3: 端到端测试：选中文字 → Ctrl+K → 输入 URL → 链接创建成功

- [x] Task 2: 编辑器表格功能
  - [x] SubTask 2.1: 在 DocEditor.tsx 的 schema blockSpecs 中注册 table 块（从 defaultBlockSpecs 中已有 table）
  - [x] SubTask 2.2: 在斜杠菜单中添加"表格"选项
  - [x] SubTask 2.3: 端到端测试：通过斜杠菜单插入 3x3 表格 → 可在单元格中输入文字

- [x] Task 3: 图片拖拽/粘贴上传
  - [x] SubTask 3.1: 确认编辑器的 fileDropExtension 和 pasteExtension 已正确处理图片上传
  - [x] SubTask 3.2: 确认 uploadFile 回调在 DocEditor.tsx 中正确配置
  - [x] SubTask 3.3: 端到端测试：拖拽图片到编辑器 → 图片上传并显示

- [x] Task 4: 文字颜色功能
  - [x] SubTask 4.1: 确认 ColorStyleButton 在格式工具栏中正常工作
  - [x] SubTask 4.2: 端到端测试：选中文字 → 点击颜色按钮 → 选择颜色 → 文字颜色改变

- [x] Task 5: 侧边栏折叠
  - [x] SubTask 5.1: 确认 SidebarProvider 已支持折叠功能（ShadCN Sidebar 自带折叠能力）
  - [x] SubTask 5.2: 端到端测试：点击折叠按钮 → 侧边栏折叠为图标模式

- [x] Task 6: 编辑器空状态引导
  - [x] SubTask 6.1: 确认编辑器 placeholder 配置正确（"输入 / 插入块，输入 @ 引用文档"）
  - [x] SubTask 6.2: 端到端测试：新建文档 → 编辑器区域显示引导文字

- [x] Task 7: 文档分享 - 后端
  - [x] SubTask 7.1: 创建 ShareEntity 实体（shareId, pageId, permission, password, expiresAt, createdBy, createdAt）
  - [x] SubTask 7.2: 创建 ShareModule、ShareService、ShareController
  - [x] SubTask 7.3: 实现 API：POST /api/page/:pageId/share, GET /api/page/:pageId/shares, DELETE /api/share/:shareId, GET /api/share/:shareId
  - [x] SubTask 7.4: 实现访客模式：GET /api/share/:shareId 返回文档内容（需密码则验证）

- [x] Task 8: 文档分享 - 前端
  - [x] SubTask 8.1: 重构 SharePopover 组件，集成分享链接生成、权限设置、有效期和密码保护
  - [x] SubTask 8.2: 添加分享管理功能（查看/撤销分享链接）
  - [x] SubTask 8.3: 创建访客文档查看页面（/share/:shareId 路由）
  - [x] SubTask 8.4: 端到端测试：创建分享链接 → 复制链接 → 访客访问 → 权限生效

# Task Dependencies
- [Task 7] depends on [Task 1-6] (先完成编辑器功能，再开发分享)
- [Task 8] depends on [Task 7]
