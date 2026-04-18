# 修复评论系统 Spec

## Why
评论功能已实现但无法正常使用：后端返回扁平列表而前端期望树形结构、评论面板布局与编辑器重叠、权限校验过严（仅页面所有者可评论）、删除评论不级联删除子回复。

## What Changes
- 修复后端 `findByPageId` 返回树形结构（将扁平评论列表组装为嵌套的 `replies` 结构）
- 修复后端权限校验：协作者也能评论（不仅限页面所有者）
- 修复后端删除评论时级联删除子回复
- 修复前端 `CommentPanel` 布局：从编辑器居中容器中移出，作为独立侧边栏
- 修复前端 `CommentButton` 传入 `commentCount` 和 `CommentPanel` 传入 `onClose`
- 修复前端 `CommentPanel` 中回复评论的展示逻辑（仅顶级评论显示，回复嵌套在其下）

## Impact
- Affected code: `apps/server/src/modules/comment/comment.service.ts`（树形组装、权限、级联删除）, `apps/web/src/pages/Doc/index.tsx`（布局重构）, `apps/web/src/components/CommentPanel/index.tsx`（回复展示逻辑）
- Affected specs: `implement-comment-system`
- Breaking changes: 无

## ADDED Requirements

### Requirement: 评论树形结构
系统 SHALL 在获取评论列表时返回树形结构，将 `parentId` 不为空的评论嵌套到其父评论的 `replies` 字段中。

#### Scenario: 获取带回复的评论列表
- **WHEN** 用户打开评论面板
- **THEN** 返回顶级评论列表，每条评论的 `replies` 字段包含其所有子回复

#### Scenario: 仅返回顶级评论
- **WHEN** 后端组装评论树
- **THEN** 顶级列表仅包含 `parentId` 为空的评论，回复嵌套在对应父评论的 `replies` 中

### Requirement: 协作者评论权限
系统 SHALL 允许文档协作者（非所有者）创建评论、回复评论、解决评论和删除自己创建的评论。

#### Scenario: 协作者创建评论
- **WHEN** 协作者对文档添加评论
- **THEN** 评论创建成功（不再要求必须是页面所有者）

#### Scenario: 协作者获取评论
- **WHEN** 协作者打开评论面板
- **THEN** 能正常获取该文档的评论列表

### Requirement: 级联删除评论回复
系统 SHALL 在删除父评论时同时删除其所有子回复。

#### Scenario: 删除带回复的评论
- **WHEN** 用户删除一条有回复的评论
- **THEN** 该评论及其所有子回复均被删除

## MODIFIED Requirements

### Requirement: 评论面板布局
评论面板 SHALL 作为编辑器右侧独立侧边栏显示，不与编辑器内容重叠。

#### Scenario: 打开评论面板
- **WHEN** 用户点击评论按钮
- **THEN** 评论面板从右侧滑出，编辑器内容区域自动收缩，两者不重叠

#### Scenario: 关闭评论面板
- **WHEN** 用户点击关闭按钮
- **THEN** 评论面板关闭，编辑器内容区域恢复原宽度

### Requirement: 评论按钮状态
评论按钮 SHALL 显示当前文档的评论数量。

#### Scenario: 有评论时显示数量
- **WHEN** 文档有未解决评论
- **THEN** 评论按钮上显示评论数量徽标

## REMOVED Requirements
无
