# 对齐 Notion 设计风格优化协同文档 UI Spec

## Why
当前协同文档的 UI 与 Notion 的设计风格存在差距，包括色彩体系偏冷、排版层级不够清晰、文档编辑区宽度/间距与 Notion 不一致、侧边栏视觉风格偏重等问题。需要参考 Notion 的设计系统（Warm minimalism, serif headings, soft surfaces）对 UI 进行全面优化。

## What Changes
- 调整全局色彩体系，对齐 Notion 的暖色调中性色板（warm grays: #f6f5f4, #dfdcd9 等）
- 优化排版系统：引入衬线字体用于标题，调整字号/行高层级
- 优化文档编辑页面布局：调整内容区宽度、标题样式、面包屑导航
- 优化文档列表页面：对齐 Notion 的文档列表风格
- 优化侧边栏：更轻量、更 Notion 风格的视觉处理
- 优化弹窗组件（搜索/设置/关于）的视觉风格

## Impact
- Affected code: `apps/web/src/index.css`（全局色彩变量）
- Affected code: `apps/web/src/pages/Doc/index.tsx`（文档编辑页面）
- Affected code: `apps/web/src/pages/DocList/index.tsx` + `DocList.module.css`（文档列表）
- Affected code: `apps/web/src/components/LayoutAside/Aside.tsx`（侧边栏）
- Affected code: `apps/web/src/components/LayoutAside/SearchDialog.tsx`（搜索弹窗）
- Affected code: `apps/web/src/components/LayoutAside/SettingsDialog.tsx`（设置弹窗）
- Affected code: `apps/web/src/components/LayoutAside/AboutDialog.tsx`（关于弹窗）
- Affected code: `apps/web/src/components/EmptyState/index.tsx` + `EmptyState.module.css`（空状态）

## ADDED Requirements

### Requirement: Notion 风格色彩体系
系统 SHALL 采用 Notion 风格的暖色调中性色板，替代当前冷色调色板。

#### Scenario: 暖色背景
- **WHEN** 用户查看应用任何页面
- **THEN** 背景色使用暖白色（#ffffff 主背景, #f7f6f3 内容背景, #f1f1ef 悬停/选中背景）
- **THEN** 文字色使用暖黑色（#37352f 主文字, #787774 次要文字, #9b9a97 辅助文字）
- **THEN** 边框色使用暖灰色（#e9e9e7 常规边框, #dfdfde 悬停边框）
- **THEN** 侧边栏背景使用 #f7f6f3，而非纯白

#### Scenario: 强调色
- **WHEN** 需要使用强调色（链接、选中态等）
- **THEN** 使用 Notion Blue (#097fe8) 作为主要强调色

### Requirement: Notion 风格排版系统
系统 SHALL 采用 Notion 风格的排版层级。

#### Scenario: 文档标题
- **WHEN** 用户查看文档编辑页面
- **THEN** 文档标题使用大号衬线字体（font-size: 40px, font-weight: 700, line-height: 1.2）
- **THEN** 标题字体使用系统衬线字体栈（"Noto Serif SC", Georgia, serif）

#### Scenario: 面包屑导航
- **WHEN** 用户查看文档编辑页面
- **THEN** 面包屑导航文字使用 14px，颜色 #9b9a97
- **THEN** 面包屑分隔符使用 / 而非 > 图标

### Requirement: 文档编辑页面布局优化
系统 SHALL 优化文档编辑页面布局对齐 Notion 风格。

#### Scenario: 内容区宽度
- **WHEN** 用户查看文档编辑页面
- **THEN** 内容区最大宽度为 900px，水平居中
- **THEN** 内容区左右 padding 为 96px（桌面端）

#### Scenario: 标题区域
- **WHEN** 用户查看文档编辑页面
- **THEN** 标题区域上方有 96px 的 padding
- **THEN** emoji 图标可点击（hover 时显示浅灰背景）
- **THEN** 标题 placeholder 为 "无标题"，颜色 #c7c7c5

#### Scenario: 顶部导航栏
- **WHEN** 用户查看文档编辑页面
- **THEN** 顶部导航栏高度 44px，背景透明/半透明
- **THEN** 面包屑使用 Notion 风格（Home图标 > 文档标题）
- **THEN** 右侧操作按钮简洁、低对比度

### Requirement: 文档列表页面优化
系统 SHALL 优化文档列表页面对齐 Notion 风格。

#### Scenario: 文档卡片
- **WHEN** 用户查看文档列表页面
- **THEN** 文档卡片使用暖白色背景，圆角 8px
- **THEN** 卡片 hover 时有微妙的上浮效果和阴影
- **THEN** 卡片间距 16px
- **THEN** 卡片内 emoji 尺寸 36px，标题 14px font-weight: 500

### Requirement: 侧边栏视觉优化
系统 SHALL 优化侧边栏视觉对齐 Notion 风格。

#### Scenario: 侧边栏整体
- **WHEN** 用户查看侧边栏
- **THEN** 侧边栏背景使用 #f7f6f3（暖灰白）
- **THEN** 文档列表项 hover 背景使用 #ebebea
- **THEN** 选中文档项背景使用 #e9e9e7
- **THEN** 侧边栏文字颜色使用 #37352f（主）/ #9b9a97（辅助）

#### Scenario: 侧边栏头部
- **WHEN** 用户查看侧边栏头部
- **THEN** Logo 区域使用当前工作区名称风格（类似 Notion）
- **THEN** 搜索框更简洁，使用 #ebebea 背景

### Requirement: 弹窗组件视觉优化
系统 SHALL 优化弹窗组件视觉对齐 Notion 风格。

#### Scenario: 搜索弹窗
- **WHEN** 用户打开搜索弹窗
- **THEN** 弹窗使用圆角 12px，阴影柔和
- **THEN** 搜索结果项 hover 背景使用 #ebebea
- **THEN** 整体色调与 Notion 一致（暖白背景 #ffffff）

#### Scenario: 设置/关于弹窗
- **WHEN** 用户打开设置或关于弹窗
- **THEN** 弹窗使用暖白色调，文字颜色 #37352f
- **THEN** 分隔线使用 #e9e9e7

## MODIFIED Requirements

### Requirement: 全局色彩变量
CSS 变量 SHALL 从冷色调（240 hue）调整为 Notion 暖色调（30-40 hue）。

### Requirement: 文档标题样式
文档标题 SHALL 从当前 sans-serif 粗体改为衬线字体大标题，对齐 Notion 的标题排版风格。

### Requirement: 文档内容区宽度
文档内容区 SHALL 从当前 60% 宽度改为 max-width: 900px 居中布局，对齐 Notion 的内容区宽度。
