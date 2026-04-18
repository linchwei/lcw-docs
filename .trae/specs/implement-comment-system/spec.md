# F-0302 评论系统 Spec

## Why
文档协作需要评论功能，方便团队成员对内容进行讨论、反馈和审阅。评论应锚定到具体文本位置，支持回复和解决状态。

## What Changes
- 新增 CommentEntity 数据模型（评论实体）
- 新增 CommentModule/Service/Controller 后端模块
- 新增评论相关 API 端点（创建/获取/回复/解决评论）
- 前端新增评论按钮和评论面板组件
- 编辑器集成评论高亮和锚点功能

## Impact
- Affected code: `apps/server/src/entities/`（新增 CommentEntity）, `apps/server/src/modules/comment/`（新增模块）, `apps/web/src/components/`（新增评论组件）, `apps/web/src/pages/Doc/`（集成评论功能）
- Database: 新增 comment 表
- Breaking changes: 无

## ADDED Requirements

### Requirement: 评论数据模型
系统 SHALL 支持评论的创建、存储、查询和删除。

#### Scenario: 创建评论
- **WHEN** 用户选中文本并添加评论
- **THEN** 评论被保存，包含内容、锚定位置、创建者信息

#### Scenario: 获取评论列表
- **WHEN** 用户打开评论面板
- **THEN** 显示该文档的所有评论，按时间排序

### Requirement: 评论锚定
系统 SHALL 支持将评论锚定到文档中的具体文本位置。

#### Scenario: 高亮锚定文本
- **WHEN** 评论创建时
- **THEN** 被评论的文本显示高亮背景色

#### Scenario: 点击评论定位
- **WHEN** 用户点击评论面板中的某条评论
- **THEN** 编辑器滚动到对应位置并高亮显示

### Requirement: 评论回复
系统 SHALL 支持对评论进行回复。

#### Scenario: 回复评论
- **WHEN** 用户在评论下输入回复
- **THEN** 回复被保存并显示在评论下方

### Requirement: 评论解决
系统 SHALL 支持将评论标记为已解决。

#### Scenario: 解决评论
- **WHEN** 用户点击"解决"按钮
- **THEN** 评论状态变为已解决，锚定文本高亮消失

## MODIFIED Requirements
无

## REMOVED Requirements
无
