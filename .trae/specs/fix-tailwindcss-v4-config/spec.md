# 修复 Tailwind CSS v4 配置 Spec

## Why
Tailwind CSS 从 v3 升级到 v4 后，配置方式发生了重大变化。v3 使用 JavaScript/TypeScript 配置文件和 PostCSS 插件，而 v4 使用基于 CSS 的配置方式。当前项目的 tailwind.config.ts 和 postcss.config.mjs 不再兼容 v4。

## What Changes
- 删除 tailwind.config.ts（v4 不再需要）
- 删除 postcss.config.mjs（v4 不再需要）
- 更新 globals.css 使用 v4 的 @import 语法
- 将主题配置从 JS 迁移到 CSS 使用 @theme 指令
- 更新 package.json 移除 postcss 相关依赖（v4 内置了）

## Impact
- 影响文件：
  - packages/shadcn-shared-ui/tailwind.config.ts（删除）
  - packages/shadcn-shared-ui/postcss.config.mjs（删除）
  - packages/shadcn-shared-ui/src/globals.css（重写）
  - packages/shadcn-shared-ui/package.json（更新依赖）

## ADDED Requirements

### Requirement: Tailwind CSS v4 配置迁移
系统必须将 Tailwind CSS 配置从 v3 格式迁移到 v4 格式。

#### Scenario: 配置迁移完成
- **WHEN** 运行 `pnpm run typecheck`
- **THEN** 无 Tailwind CSS 相关错误

#### Scenario: 样式正常工作
- **WHEN** 构建项目
- **THEN** 所有样式正确应用

## MODIFIED Requirements

### Requirement: 保持功能不变
**原则**：只更新配置格式，不修改任何样式值或功能代码。
