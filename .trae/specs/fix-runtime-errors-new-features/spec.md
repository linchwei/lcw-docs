# 修复运行时错误 Spec

## Why
后端 CollaboratorEntity 的 pageId 字段同时定义了 `@Column({ type: 'varchar', length: 21 })` 和 `@ManyToOne('PageEntity')`，导致 TypeORM 报错 "Column pageId does not support length property"。前端 NotificationBell 导入了不存在的 ScrollArea 组件，导致 Vite 运行时报错。

## What Changes
- 修复 CollaboratorEntity：移除 `@ManyToOne('PageEntity') page` 关系，保留 `@Column pageId` 并将 length 从 21 修正为 80（与其他 Entity 一致）
- 修复 NotificationBell：移除 ScrollArea 导入，使用普通 div + overflow-y-auto 替代
- 检查 NotificationEntity 的双重 ManyToOne 关系是否兼容

## Impact
- Affected code: CollaboratorEntity、NotificationBell
- Affected specs: fix-runtime-errors-new-features

## ADDED Requirements
无

## MODIFIED Requirements
### Requirement: CollaboratorEntity 数据模型
CollaboratorEntity 的 pageId 字段 SHALL 仅通过 `@Column({ type: 'varchar', length: 80 })` 定义，不使用 `@ManyToOne` 关系。这与项目中其他 Entity（ShareEntity、CommentEntity、NotificationEntity、VersionEntity）的处理方式一致。

### Requirement: NotificationBell 组件
NotificationBell 组件 SHALL 使用标准 HTML div 元素（带 overflow-y-auto 样式）替代不存在的 ScrollArea 组件。

## REMOVED Requirements
无
