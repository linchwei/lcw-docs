# 美化侧边栏并修复 Tailwind CSS v4 兼容性问题 Spec

## Why
侧边栏 UI 仍然很粗糙：用户头像（Avatar）显示为 100x100px 而非预期的 40x40px，根本原因是 Tailwind CSS v4 的 JIT 引擎未正确扫描 `packages/shadcn-shared-ui` 中的类名，导致 `h-10`、`w-10` 等关键尺寸类未生成。此外，sidebar 组件使用了 v3 的 `theme(spacing.4)` 语法，在 v4 中已失效。需要修复这些底层问题，并进一步美化侧边栏样式。

## What Changes
- 修复 Tailwind CSS v4 内容扫描问题，确保 `packages/shadcn-shared-ui` 中的类名被正确生成
- 修复 sidebar 组件中 `theme(spacing.4)` 为 Tailwind v4 兼容语法
- 移除 `globals.css` 中重复的 `@import "tailwindcss"` 和 `@theme` 块，避免冲突
- 优化侧边栏用户区域：缩小 Avatar 尺寸、改善用户信息布局
- 优化侧边栏整体视觉：Logo 区域、搜索框、文档列表项、底部操作区

## Impact
- Affected code:
  - `apps/web/src/index.css` - 添加 `@source` 指令，确保扫描 shadcn-shared-ui
  - `packages/shadcn-shared-ui/src/globals.css` - 移除重复的 `@import "tailwindcss"` 和 `@theme`
  - `packages/shadcn-shared-ui/src/components/ui/sidebar.tsx` - 修复 `theme(spacing.4)` 语法
  - `apps/web/src/components/LayoutAside/Aside.tsx` - 美化侧边栏样式

## ADDED Requirements
### Requirement: Tailwind CSS v4 内容扫描修复
The system SHALL correctly generate all Tailwind utility classes used across the monorepo, including those in `packages/shadcn-shared-ui`.

#### Scenario: Avatar 尺寸正确
- **WHEN** 页面渲染 Avatar 组件
- **THEN** Avatar 的 `h-10 w-10` 类生效，显示为 40x40px
- **AND** 所有 shadcn 组件中的 Tailwind 类名都正确生成

### Requirement: 侧边栏用户区域优化
The system SHALL display a compact user area in the sidebar footer.

#### Scenario: 用户信息展示
- **WHEN** 用户查看侧边栏底部
- **THEN** Avatar 显示为 28x28px 的小尺寸
- **AND** 用户名和状态信息紧凑排列
- **AND** 整体视觉与 Notion/飞书风格一致

### Requirement: 侧边栏整体视觉美化
The system SHALL provide a polished sidebar with refined visual details.

#### Scenario: 侧边栏视觉
- **WHEN** 用户查看侧边栏
- **THEN** Logo 区域有适当的间距和视觉权重
- **AND** 搜索框有视觉引导效果
- **AND** 文档列表项有精致的 hover 和选中状态
- **AND** 底部操作区有分隔线和合理的间距

## MODIFIED Requirements
### Requirement: Tailwind CSS v4 配置
原有的 Tailwind v4 配置缺少 `@source` 指令，导致 monorepo 中其他包的类名不被扫描。需要添加 `@source` 指令指向 `packages/shadcn-shared-ui/src`。

### Requirement: Sidebar 组件兼容性
Sidebar 组件中使用的 `theme(spacing.4)` 是 Tailwind v3 语法，需替换为 v4 兼容的 `var(--spacing-4)` 或硬编码值 `1rem`。
