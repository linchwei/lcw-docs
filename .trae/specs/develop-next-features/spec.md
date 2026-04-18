# 开发下一批功能 Spec

## Why
根据 PRD 和当前代码实际状态分析，v0.2.0 大部分功能已完成，但仍有多个高优先级功能缺失或部分实现。需要补全编辑器输入规则、修复分享页 WebSocket 鉴权、添加文档导出 UI、接入暗色模式，让产品达到更完整的状态。

## What Changes
- 补全编辑器 Markdown 输入规则：`#`/`##`/`###` 标题、`-` 无序列表、`1.` 有序列表、`[]` 任务列表、` ``` ` 代码块
- 修复分享页 WebSocket 鉴权：支持访客通过 shareId + password 连接 WebSocket
- 添加文档导出 UI：在编辑页添加导出按钮，支持 Markdown 和 HTML 导出
- 接入暗色模式：将 ThemeToggle 组件接入设置面板，编辑器主题跟随系统/手动切换

## Impact
- Affected code:
  - `apps/web/src/extensions/CustomInputRules.ts`（输入规则补全）
  - `apps/server/src/modules/doc-yjs/doc-yjs.gateway.ts`（分享 WS 鉴权）
  - `apps/web/src/pages/Share/ShareDocEditor.tsx`（分享页 WS 连接）
  - `apps/web/src/pages/Doc/index.tsx`（导出按钮）
  - `apps/web/src/components/LayoutAside/SettingsDialog.tsx`（暗色模式切换）
  - `apps/web/src/pages/Doc/DocEditor.tsx`（编辑器主题）
  - `apps/web/src/components/ThemeToggle/index.tsx`（主题切换组件接入）

## ADDED Requirements

### Requirement: 编辑器 Markdown 输入规则补全
系统 SHALL 支持以下 Markdown 风格的快捷输入规则：
- `#` + Space → H1 标题
- `##` + Space → H2 标题
- `###` + Space → H3 标题
- `-` + Space → 无序列表
- `1.` + Space → 有序列表
- `[]` + Space → 任务列表
- ` ``` ` + Space → 代码块

#### Scenario: 标题输入规则
- **WHEN** 用户在空行输入 `# ` 并按下空格
- **THEN** 当前行转换为 H1 标题块

#### Scenario: 列表输入规则
- **WHEN** 用户在空行输入 `- ` 并按下空格
- **THEN** 当前行转换为无序列表项

### Requirement: 分享页 WebSocket 鉴权
系统 SHALL 支持访客通过分享链接建立 WebSocket 连接，使用 shareId 和可选的 password 进行鉴权，而非 JWT Token。

#### Scenario: 访客查看分享文档
- **WHEN** 访客通过分享链接打开文档
- **THEN** WebSocket 连接使用 shareId 鉴权，文档内容实时同步

#### Scenario: 密码保护的分享文档
- **WHEN** 访客打开密码保护的分享文档并输入正确密码
- **THEN** WebSocket 连接使用 shareId + password 鉴权成功

### Requirement: 文档导出
系统 SHALL 支持将文档导出为 Markdown 和 HTML 格式。

#### Scenario: 导出 Markdown
- **WHEN** 用户点击导出按钮并选择 Markdown 格式
- **THEN** 系统生成 .md 文件并下载

#### Scenario: 导出 HTML
- **WHEN** 用户点击导出按钮并选择 HTML 格式
- **THEN** 系统生成带样式的 .html 文件并下载

### Requirement: 暗色模式
系统 SHALL 支持暗色模式切换，包括编辑器、侧边栏、所有弹窗和组件。

#### Scenario: 手动切换暗色模式
- **WHEN** 用户在设置面板切换主题
- **THEN** 全局 UI 和编辑器切换为暗色/亮色主题

#### Scenario: 跟随系统主题
- **WHEN** 用户选择"跟随系统"主题
- **THEN** 应用主题跟随操作系统暗色/亮色设置

## MODIFIED Requirements

### Requirement: 键盘快捷键面板
快捷键面板中显示的输入规则必须与实际已实现的输入规则一致，移除未实现的快捷键提示。

## REMOVED Requirements
（无）
