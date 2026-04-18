# Tasks

- [x] Task 1: 迁移 shadcn 组件类名到 Tailwind v4 前缀格式
  - [x] Task 1.1: 将所有 `bn-xxx` 类名替换为 `bn:xxx`（普通工具类）
  - [x] Task 1.2: 将所有 `variant:bn-xxx` 替换为 `bn:variant:xxx`（带变体的工具类）
  - [x] Task 1.3: 处理特殊变体格式（`[&>span]:bn-xxx` → `bn:[&>span]:xxx` 等）

- [x] Task 2: 更新 tailwind-merge 前缀配置
  - [x] Task 2.1: 将 `packages/shadcn/src/lib/utils.ts` 中 `prefix: 'bn-'` 改为 `prefix: 'bn:'`

- [x] Task 3: 配置 editor-styles.css 的 Tailwind 实例
  - [x] Task 3.1: 使用 `@import "tailwindcss" prefix(bn)` 配置前缀 Tailwind 实例
  - [x] Task 3.2: 添加 `@source` 指令扫描 shadcn 和 react 包目录
  - [x] Task 3.3: 添加 `@theme` 块定义编辑器所需的颜色令牌
  - [x] Task 3.4: 安装并加载 `tw-animate-css` 替代已废弃的 `tailwindcss-animate`

- [x] Task 4: 清理主 CSS 入口
  - [x] Task 4.1: 从 `apps/web/src/index.css` 移除冗余的 `@source` 指令

- [x] Task 5: 验证编辑器工具栏样式和功能
  - [x] Task 5.1: 重新加载页面，确认 `bn\:xxx` 工具类 CSS 规则已生成
  - [x] Task 5.2: 选中文本，确认格式化工具栏样式正确显示
  - [x] Task 5.3: 测试加粗、斜体等快捷键可用
  - [x] Task 5.4: 确认侧边菜单、建议菜单样式正确

# Task Dependencies
- Task 2 依赖 Task 1（类名格式必须先更新，tailwind-merge 才能正确工作）
- Task 3 依赖 Task 1（@source 扫描需要匹配新的类名格式）
- Task 4 可与 Task 3 并行
- Task 5 依赖 Task 1-4 全部完成
