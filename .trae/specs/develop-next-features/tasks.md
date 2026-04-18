# Tasks

- [x] Task 1: 补全编辑器 Markdown 输入规则
  - [x] SubTask 1.1: 在 `CustomInputRules.ts` 中添加 `#` + Space → H1 标题输入规则
  - [x] SubTask 1.2: 添加 `##` + Space → H2 标题输入规则
  - [x] SubTask 1.3: 添加 `###` + Space → H3 标题输入规则
  - [x] SubTask 1.4: 添加 `-` + Space → 无序列表输入规则
  - [x] SubTask 1.5: 添加 `1.` + Space → 有序列表输入规则
  - [x] SubTask 1.6: 添加 `[]` + Space → 任务列表输入规则
  - [x] SubTask 1.7: 添加 ` ``` ` + Space → 代码块输入规则

- [x] Task 2: 修复分享页 WebSocket 鉴权
  - [x] SubTask 2.1: 修改 `doc-yjs.gateway.ts` 的 upgrade 处理器，支持 `/share-` 前缀路径的 WebSocket 连接
  - [x] SubTask 2.2: 在 ws.Server 的 connection 事件中添加分享链接鉴权逻辑：验证 shareId 有效性、过期时间、密码
  - [x] SubTask 2.3: 修改 `ShareDocEditor.tsx` 的 WebSocket 连接参数，使用 shareId + password 替代 JWT Token
  - [x] SubTask 2.4: 在分享页根据 permission 字段控制编辑器是否可编辑

- [x] Task 3: 添加文档导出 UI
  - [x] SubTask 3.1: 在文档编辑页 header 添加导出按钮（下拉菜单：Markdown / HTML）
  - [x] SubTask 3.2: 使用 `@lcw-doc/core` 的 `blocksToMarkdown` 和 `createExternalHTMLExporter` 实现导出逻辑
  - [x] SubTask 3.3: 实现文件下载（创建 Blob 并触发浏览器下载）

- [x] Task 4: 接入暗色模式
  - [x] SubTask 4.1: 在 `SettingsDialog.tsx` 中接入 ThemeToggle 组件，替换静态文本
  - [x] SubTask 4.2: 修改 `DocEditor.tsx` 的 `theme` 属性，跟随当前主题而非硬编码 `"light"`
  - [x] SubTask 4.3: 修改 `ShareDocEditor.tsx` 的 `theme` 属性，跟随当前主题
  - [x] SubTask 4.4: 实现主题偏好持久化（localStorage）

- [x] Task 5: 修复键盘快捷键面板
  - [x] SubTask 5.1: 更新 `KeyboardShortcutsDialog` 中的输入规则列表，确保与实际已实现的规则一致

- [x] Task 6: 使用 MCP 进行端到端测试
  - [x] SubTask 6.1: 测试输入规则（输入 `# ` 转换为标题，输入 `- ` 转换为列表等）
  - [x] SubTask 6.2: 测试分享页访客 WebSocket 连接
  - [x] SubTask 6.3: 测试文档导出（Markdown 和 HTML）
  - [x] SubTask 6.4: 测试暗色模式切换

# Task Dependencies
- [Task 1] 和 [Task 2] 和 [Task 3] 和 [Task 4] 可并行执行
- [Task 5] 依赖 [Task 1]
- [Task 6] 依赖所有其他任务
