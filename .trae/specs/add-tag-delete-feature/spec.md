# 添加标签删除功能 Spec

## Why
后端已有 `DELETE /api/tag/:tagId` 接口，前端也有 `deleteTag` service 方法，但 UI 上没有删除标签的入口。用户创建标签后无法删除，只能从页面上移除标签关联（removePageTag），但标签本身仍存在于系统中。

## What Changes
- 在 DocList 页面的标签选择器中，为每个标签添加删除按钮
- 删除标签前显示确认对话框
- 删除标签时同时清除该标签与所有页面的关联
- 在 PageTags 组件中也添加标签管理入口（编辑/删除）

## Impact
- Affected code: `apps/web/src/pages/DocList/index.tsx`, `apps/web/src/components/PageTags/index.tsx`
- Affected services: `apps/web/src/services/tag.ts`（已有 deleteTag，无需修改）

## ADDED Requirements

### Requirement: 标签删除功能
系统 SHALL 在标签选择器中为每个标签提供删除操作，删除前需用户确认。

#### Scenario: 从标签选择器中删除标签
- **WHEN** 用户在页面菜单的标签子菜单中点击标签旁的删除按钮
- **THEN** 弹出确认对话框，确认后删除标签并刷新页面列表

#### Scenario: 删除标签后数据一致性
- **WHEN** 用户删除一个标签
- **THEN** 该标签从所有页面移除，标签列表和页面标签缓存同时刷新

### Requirement: PageTags 组件标签管理
系统 SHALL 在 PageTags 组件的标签选择器中为每个标签添加删除和编辑入口。

#### Scenario: 从 PageTags 组件删除标签
- **WHEN** 用户在 PageTags 标签选择器中点击标签旁的删除图标
- **THEN** 弹出确认对话框，确认后删除标签
