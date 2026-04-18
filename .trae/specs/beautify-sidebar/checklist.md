# Checklist

## Tailwind CSS v4 修复检查点
- [x] `@source` 指令已添加到 index.css
- [x] globals.css 中重复的 `@import "tailwindcss"` 已移除
- [x] globals.css 中重复的 `@theme` 块已移除
- [x] `h-10`、`w-10` 等 Tailwind 类名正确生成

## Sidebar 组件兼容性检查点
- [x] `theme(spacing.4)` 已替换为 v4 兼容语法
- [x] `w-[--sidebar-width]` 已替换为 `w-[var(--sidebar-width)]`（6处）
- [x] SidebarInset 布局正确（主内容不再被侧边栏盖住）

## 侧边栏用户区域检查点
- [x] Avatar 尺寸为 28x28px
- [x] 用户信息与头像垂直居中对齐
- [x] 状态文字样式精致

## 侧边栏整体视觉检查点
- [x] Logo 区域间距合理
- [x] 搜索框有背景色和 hover 效果
- [x] 文档列表项 hover 和选中状态精致
- [x] 底部操作区有分隔线和合理间距

## MCP 测试检查点
- [x] Avatar 尺寸正确（28x28px）
- [x] 侧边栏整体视觉美观
- [x] Tailwind 类名正确生成
- [x] 搜索框 hover 效果正常
- [x] 文档列表项交互效果正常
- [x] 主内容区域不被侧边栏盖住（main.left=256px）
