# Checklist

## v3 配置文件删除检查点

- [x] tailwind.config.ts 已删除
- [x] postcss.config.mjs 已删除

## package.json 更新检查点

- [x] postcss 依赖已移除
- [x] autoprefixer 依赖已移除
- [x] tailwindcss-animate 依赖已移除（或使用 v4 方式）
- [x] pnpm install 成功

## globals.css 重写检查点

- [x] 使用 @import "tailwindcss" 导入
- [x] 使用 @theme 配置主题
- [x] 所有自定义颜色已迁移
- [x] 所有自定义动画已迁移
- [x] @apply 指令正确使用

## shadcn 包修复检查点

- [x] postcss.config.js 已删除
- [x] tailwind.config.js 已删除
- [x] package.json 已更新
- [x] style.css 已重写为 v4 语法
- [x] tailwindStyles.css 已删除

## 最终验证检查点

- [x] `pnpm run typecheck` 通过
- [x] 构建成功
