# Tasks

- [x] Task 1: 调整全局色彩变量对齐 Notion 暖色调
  - [x] Task 1.1: 修改 `index.css` 中 `:root` 变量，将冷色调（240 hue）替换为 Notion 暖色调（#37352f, #f7f6f3, #e9e9e7 等）
  - [x] Task 1.2: 更新 `--sidebar-background` 为 #f7f6f3，`--sidebar-border` 为 #e9e9e7
  - [x] Task 1.3: 更新 `--muted-foreground` 为 #9b9a97，`--accent` 为 #f1f1ef
  - [x] Task 1.4: 更新 dark mode 变量保持暖色调一致性

- [x] Task 2: 优化文档编辑页面布局和排版
  - [x] Task 2.1: 修改 `Doc/index.tsx` 内容区从 `w-[60%]` 改为 `max-w-[900px] mx-auto`，左右 padding 96px
  - [x] Task 2.2: 修改文档标题样式：使用衬线字体（"Noto Serif SC", Georgia, serif），font-size 40px，font-weight 700
  - [x] Task 2.3: 修改标题 placeholder 为 "无标题"，颜色 #c7c7c5
  - [x] Task 2.4: 优化顶部导航栏：高度 44px，面包屑使用 / 分隔符，文字颜色 #9b9a97
  - [x] Task 2.5: 优化 emoji 图标区域：hover 时显示浅灰背景圆角

- [x] Task 3: 优化文档列表页面
  - [x] Task 3.1: 修改 `DocList.module.css` 卡片背景为暖白色，圆角 8px
  - [x] Task 3.2: 调整卡片间距为 16px，emoji 尺寸 36px，标题 14px font-weight 500
  - [x] Task 3.3: 优化空状态组件 `EmptyState` 的色调和排版

- [x] Task 4: 优化侧边栏视觉
  - [x] Task 4.1: 修改 `Aside.tsx` 侧边栏头部样式：使用暖灰色背景
  - [x] Task 4.2: 调整文档列表项 hover/选中背景色为 #ebebea / #e9e9e7
  - [x] Task 4.3: 优化搜索按钮样式，背景使用 #ebebea

- [x] Task 5: 优化弹窗组件视觉
  - [x] Task 5.1: 修改 `SearchDialog.tsx` 的 hover 背景色为 #ebebea，圆角 12px
  - [x] Task 5.2: 修改 `SettingsDialog.tsx` 的分隔线和文字颜色对齐 Notion 色调
  - [x] Task 5.3: 修改 `AboutDialog.tsx` 的文字颜色对齐 Notion 色调

- [x] Task 6: 验证所有 UI 优化
  - [x] Task 6.1: 验证全局色彩已切换为暖色调
  - [x] Task 6.2: 验证文档编辑页面排版对齐 Notion 风格
  - [x] Task 6.3: 验证文档列表页面视觉对齐 Notion 风格
  - [x] Task 6.4: 验证侧边栏视觉对齐 Notion 风格
  - [x] Task 6.5: 验证弹窗组件视觉对齐 Notion 风格

# Task Dependencies
- Task 1 必须最先完成（全局色彩变量是基础）
- Task 2、3、4、5 可以并行开发（各自修改不同文件）
- Task 6 依赖所有开发任务完成
