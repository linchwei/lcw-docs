# Tasks

## Task 1: 删除 v3 配置文件
- [x] Task 1.1: 删除 tailwind.config.ts
- [x] Task 1.2: 删除 postcss.config.mjs

## Task 2: 更新 package.json
- [x] Task 2.1: 移除 postcss 和 autoprefixer 依赖（v4 内置）
- [x] Task 2.2: 移除 tailwindcss-animate（v4 可能不再需要或使用方式不同）
- [x] Task 2.3: 运行 pnpm install 更新依赖

## Task 3: 重写 globals.css
- [x] Task 3.1: 使用 @import "tailwindcss" 替代 @tailwind 指令
- [x] Task 3.2: 使用 @theme 指令配置主题颜色和动画
- [x] Task 3.3: 迁移所有自定义颜色变量
- [x] Task 3.4: 迁移所有自定义动画

## Task 4: 修复 shadcn 包的 Tailwind CSS v4 配置
- [x] Task 4.1: 删除 shadcn 包的 postcss.config.js
- [x] Task 4.2: 删除 shadcn 包的 tailwind.config.js
- [x] Task 4.3: 更新 shadcn 包的 package.json 移除 v3 依赖
- [x] Task 4.4: 重写 shadcn 包的 style.css 使用 v4 语法
- [x] Task 4.5: 删除 tailwindStyles.css 文件

## Task 5: 验证
- [x] Task 5.1: 运行类型检查确保无错误
- [x] Task 5.2: 检查构建是否成功

# Task Dependencies
- Task 1 和 Task 2 可以并行执行
- Task 3 依赖 Task 1 和 Task 2 完成
- Task 4 可以独立执行
- Task 5 依赖 Task 3 和 Task 4 完成
