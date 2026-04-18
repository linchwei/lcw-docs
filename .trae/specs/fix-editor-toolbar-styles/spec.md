# 修复编辑器格式化工具栏样式 Spec

## Why
编辑器的格式化工具栏（加粗、斜体、下划线等按钮）虽然 DOM 存在，但样式完全缺失。**根本原因是 Tailwind v4 的 `prefix()` 功能使用冒号分隔符（`bn:flex`），而不是 v3 的连字符分隔符（`bn-flex`）**。LcwDoc/BlockNote 组件使用 v3 风格的 `bn-xxx` 类名，与 v4 的 `prefix(bn)` 不兼容，导致所有 `bn-*` 前缀的 Tailwind 工具类无法生成 CSS 规则。

### 详细技术分析
- Tailwind v3: `prefix: 'bn-'` → 生成 `.bn-flex { display: flex }`，HTML 中使用 `bn-flex`
- Tailwind v4: `@import "tailwindcss" prefix(bn)` → 生成 `.bn\:flex { display: flex }`，HTML 中应使用 `bn:flex`
- 当前组件使用 `bn-flex`（v3 格式），但 Tailwind v4 期望 `bn:flex`（v4 格式）
- 变体前缀也需要调整：`hover:bn-bg-muted` → `bn:hover:bg-muted`（前缀必须在最前面）

## What Changes
- 将 `packages/shadcn/src/` 下所有组件中的 `bn-xxx` 类名改为 `bn:xxx` 格式（v4 冒号分隔符）
- 将所有变体前缀从 `variant:bn-xxx` 改为 `bn:variant:xxx` 格式（前缀在最前面）
- 更新 `packages/shadcn/src/lib/utils.ts` 中 `tailwind-merge` 的 prefix 配置从 `'bn-'` 改为 `'bn:'`
- 更新 `apps/web/src/editor-styles.css` 配置，添加 `@theme` 块和正确的 `@source` 指令
- 安装 `tailwindcss-animate` 并在 `editor-styles.css` 中通过 `@plugin` 加载，以支持动画工具类
- 使用 `@import "tailwindcss/utilities" prefix(bn)` 避免重复生成 base 层样式

## Impact
- Affected code: `packages/shadcn/src/` 下所有 `.tsx` 组件文件（28 个文件，621 处替换）
- Affected code: `packages/shadcn/src/lib/utils.ts`（tailwind-merge 配置）
- Affected code: `apps/web/src/editor-styles.css`（Tailwind 实例配置）
- Affected code: `apps/web/src/index.css`（移除冗余 @source）
- Affected code: `packages/shadcn/src/style.css`（可能需要调整）

## ADDED Requirements

### Requirement: 编辑器 bn: 前缀工具类生成
系统 SHALL 在 `apps/web/src/editor-styles.css` 的 Tailwind 实例中通过 `@import "tailwindcss/utilities" prefix(bn)` 和 `@source` 指令正确扫描组件源文件，生成所有 `bn:` 前缀的 Tailwind 工具类 CSS 规则。

#### Scenario: 格式化工具栏样式
- **WHEN** 用户在编辑器中选中文本
- **THEN** 格式化工具栏浮出，所有按钮有正确的背景色、边框、图标

#### Scenario: 侧边菜单样式
- **WHEN** 用户悬停在区块左侧
- **THEN** 侧边菜单按钮正确显示

#### Scenario: 建议菜单样式
- **WHEN** 用户输入 "/" 触发斜杠菜单
- **THEN** 建议菜单正确显示，包含背景、边框、阴影、项目高亮

### Requirement: 组件类名迁移到 v4 前缀格式
所有 `packages/shadcn/src/` 下的组件 SHALL 使用 Tailwind v4 的冒号分隔符前缀格式：
- 普通工具类：`bn-flex` → `bn:flex`
- 带变体的工具类：`hover:bn-bg-muted` → `bn:hover:bg-muted`
- 带数据属性的变体：`data-[state=open]:bn-animate-in` → `bn:data-[state=open]:animate-in`

### Requirement: tailwind-merge 前缀配置更新
`packages/shadcn/src/lib/utils.ts` 中的 `extendTailwindMerge` 配置 SHALL 使用 `prefix: 'bn:'` 而非 `prefix: 'bn-'`。

### Requirement: 动画工具类支持
系统 SHALL 安装 `tailwindcss-animate` 并在 `editor-styles.css` 中通过 `@plugin` 加载，以支持 `animate-in`、`animate-out`、`fade-in-0` 等动画工具类。

## MODIFIED Requirements

### Requirement: 主 CSS 入口不冗余扫描
`apps/web/src/index.css` SHALL NOT 包含对 `packages/shadcn/src` 的 `@source` 扫描，因为该目录的类名由编辑器专用的带前缀 Tailwind 实例处理。
