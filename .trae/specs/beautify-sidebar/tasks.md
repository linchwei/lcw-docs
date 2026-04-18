# Tasks

## Task 1: 修复 Tailwind CSS v4 内容扫描问题

- [x] Task 1.1: 在 `apps/web/src/index.css` 中添加 `@source` 指令，指向 `../../packages/shadcn-shared-ui/src`，确保 shadcn 组件中的 Tailwind 类名被正确扫描和生成
- [x] Task 1.2: 移除 `packages/shadcn-shared-ui/src/globals.css` 中重复的 `@import "tailwindcss"` 和 `@theme` 块（因为 index.css 已经导入了）
- [x] Task 1.3: 验证 `h-10`、`w-10` 等 Tailwind 类名正确生成

## Task 2: 修复 Sidebar 组件 Tailwind v4 兼容性

- [x] Task 2.1: 将 `packages/shadcn-shared-ui/src/components/ui/sidebar.tsx` 中的 `theme(spacing.4)` 替换为 `1rem`（3处）
- [x] Task 2.2: 验证 sidebar 的 inset 变体和 SidebarInset 组件布局正确

## Task 3: 美化侧边栏用户区域

- [x] Task 3.1: 缩小 Avatar 尺寸为 28x28px（添加 `h-7 w-7` 覆盖默认的 `h-10 w-10`）
- [x] Task 3.2: 优化用户信息布局，使文字与头像垂直居中对齐
- [x] Task 3.3: 优化"庆祝一下"状态文字样式

## Task 4: 美化侧边栏整体视觉

- [x] Task 4.1: 优化 Logo 区域：调整间距、添加品牌感
- [x] Task 4.2: 优化搜索框：添加背景色、圆角、hover 效果
- [x] Task 4.3: 优化文档列表项：改善 hover 背景色、选中状态、emoji 尺寸
- [x] Task 4.4: 优化底部操作区：添加分隔线、调整间距和图标大小

## Task 5: 使用 MCP 测试验证

- [x] Task 5.1: 验证 Avatar 尺寸为 28x28px
- [x] Task 5.2: 验证侧边栏整体视觉效果
- [x] Task 5.3: 验证 Tailwind 类名正确生成（h-10、w-10 等）
- [x] Task 5.4: 验证搜索框 hover 效果
- [x] Task 5.5: 验证文档列表项交互效果

# Task Dependencies

- Task 1 必须最先完成（修复底层 Tailwind 问题）
- Task 2 依赖 Task 1（确保 Tailwind 正确工作后再修复 sidebar）
- Task 3 和 Task 4 可以并行
- Task 5 必须在所有开发任务完成后执行
