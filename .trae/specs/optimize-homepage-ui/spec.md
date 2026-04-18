# 优化首页 UI Spec

## Why
当前首页（文档列表页）UI 非常简陋，只有一个简单的列表视图，缺乏现代文档协作工具的视觉体验。参考飞书文档和 Notion 的设计风格，需要优化首页 UI，提升用户体验和视觉质感。

## What Changes
- 重新设计文档列表页（DocList），采用卡片式布局替代简单列表
- 优化侧边栏（Aside）样式，参考 Notion 的侧边栏设计
- 优化文档详情页（Doc）顶部导航栏样式
- 添加空状态页面（无文档时的引导界面）
- 添加搜索功能入口的视觉优化
- 统一使用 Lucide 图标，移除 emoji 作为 UI 图标
- 添加过渡动画和交互反馈

## Impact
- Affected code:
  - `apps/web/src/pages/DocList/index.tsx` - 文档列表页重构
  - `apps/web/src/components/LayoutAside/Aside.tsx` - 侧边栏样式优化
  - `apps/web/src/pages/Doc/index.tsx` - 文档详情页导航栏优化
  - 新增 `apps/web/src/pages/DocList/DocList.module.css` - 列表页样式
  - 新增 `apps/web/src/components/EmptyState/index.tsx` - 空状态组件

## ADDED Requirements
### Requirement: 文档列表页卡片布局
The system SHALL display documents in a card grid layout instead of a simple list.

#### Scenario: 文档列表展示
- **WHEN** 用户访问文档列表页
- **THEN** 文档以卡片网格形式展示，每个卡片包含 emoji、标题、更新时间
- **AND** 卡片有 hover 效果和过渡动画
- **AND** 空状态时显示引导创建文档的界面

### Requirement: 侧边栏优化
The system SHALL provide a polished sidebar with better visual hierarchy.

#### Scenario: 侧边栏交互
- **WHEN** 用户查看侧边栏
- **THEN** 侧边栏有清晰的视觉层次：Logo 区域、搜索、导航、文档列表、用户信息
- **AND** 当前激活的文档有高亮状态
- **AND** 文档列表项有 hover 效果

### Requirement: 文档详情页导航栏优化
The system SHALL provide a clean document header with breadcrumb and actions.

#### Scenario: 文档导航栏
- **WHEN** 用户打开文档
- **THEN** 顶部导航栏显示面包屑、文档标题、协作用户、分享按钮
- **AND** 导航栏有毛玻璃效果

## MODIFIED Requirements
### Requirement: 文档列表页
原有的简单列表布局改为卡片网格布局，添加空状态引导。
