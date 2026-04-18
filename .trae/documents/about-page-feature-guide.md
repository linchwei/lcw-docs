# 计划：重构"关于"对话框为项目功能介绍页

## 目标
将当前极简的 AboutDialog（仅显示 logo + 版本号）重构为一个完整的项目功能介绍页，展示协同文档的所有功能和使用方法，入口保持侧边栏左下角的"关于"按钮。

## 现状分析
- 当前 AboutDialog 使用原生 `@radix-ui/react-dialog`，内容极简（logo、名称、版本、一行描述、版权）
- 项目其他对话框（KeyboardShortcutsDialog、ExportPanel、TemplateDialog）均使用 shadcn-shared-ui 的 Dialog 组件，风格统一
- 项目有 18+ 个功能模块需要介绍

## 实现方案

### 重构 AboutDialog 组件
- 将 `@radix-ui/react-dialog` 替换为 shadcn-shared-ui 的 Dialog 组件，与其他对话框保持一致
- 使用 Tabs 组件将内容分为多个标签页，方便用户浏览
- 对话框尺寸增大为 `sm:max-w-2xl`，最大高度 `max-h-[80vh]`，内容可滚动

### 内容结构（4 个标签页）

**Tab 1：关于**
- Logo + 应用名称 + 版本号
- 一句话简介
- 核心特性亮点（3-4 个图标+文字卡片）
- 版权信息

**Tab 2：功能介绍**
按分类展示所有功能，每个功能包含：图标、名称、简短描述
- 📝 文档编辑 — 富文本块编辑器，支持标题、列表、表格、代码块等
- 👥 实时协作 — 多人同时编辑，光标实时同步
- 🤖 AI 助手 — 全局 AI 对话、行内 AI、选区 AI 操作
- 💬 评论系统 — 添加评论、回复、标记已解决
- 🔗 分享文档 — 生成分享链接，支持密码保护和过期时间
- 📤 多格式导出 — Markdown、HTML、Word、PDF、纯文本
- 📥 Markdown 导入 — 拖拽上传 .md 文件，自动解析
- 📋 模板库 — 11 个预设模板，4 大分类，一键创建
- 📑 文档大纲 — 自动生成目录，快速跳转
- 🔍 全局搜索 — ⌘K 快速搜索文档
- 📊 文档图谱 — 可视化文档关系网络
- 📊 状态栏 — 实时字数、词数、段落、阅读时长统计

**Tab 3：快捷键**
- 复用 KeyboardShortcutsDialog 中的 shortcuts 数据
- 按分类展示快捷键列表
- 格式与 KeyboardShortcutsDialog 一致

**Tab 4：Markdown 语法**
- 展示编辑器支持的 Markdown 快捷语法
- 包含标题、格式、块级元素、扩展语法等
- 格式：语法 → 效果说明

### 需要修改的文件
1. `apps/web/src/components/LayoutAside/AboutDialog.tsx` — 完全重写

### 不需要修改的文件
- `Aside.tsx` — 入口按钮和 onOpenChange 逻辑不变
- `KeyboardShortcutsDialog/index.tsx` — 保留独立组件，AboutDialog 中复用其数据结构

### 技术细节
- 使用 shadcn-shared-ui 的 `Dialog` 组件（已确认无 Tabs 组件）
- Tab 切换使用自定义按钮，样式参考 TemplateDialog 的分类按钮（`px-3 py-1.5 rounded-md text-sm font-medium`，选中态 `bg-foreground text-background`）
- 图标使用 lucide-react
- 样式与项目现有风格保持一致（颜色 #37352f, #9b9a97, #787774 等）
- 不添加任何代码注释
- 快捷键数据从 KeyboardShortcutsDialog 中提取为独立常量，两处复用

### 实现步骤
1. 将 KeyboardShortcutsDialog 中的 shortcuts 数据提取为共享常量（放在 AboutDialog 内部即可，因为只有两处使用）
2. 重写 AboutDialog.tsx：
   - 替换 @radix-ui/react-dialog 为 shadcn Dialog
   - 添加 useState 管理 activeTab
   - 实现 4 个 Tab 按钮和对应内容区
   - Tab 1（关于）：Logo + 名称 + 版本 + 简介 + 核心特性卡片 + 版权
   - Tab 2（功能介绍）：分类展示 12 个功能
   - Tab 3（快捷键）：复用 shortcuts 数据，按分类展示
   - Tab 4（Markdown 语法）：展示编辑器支持的 Markdown 快捷语法
3. 浏览器测试验证
