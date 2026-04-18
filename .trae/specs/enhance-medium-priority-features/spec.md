# 增强中优先级功能 Spec

## Why
高优先级功能（图片上传、协作者管理、通知系统）已实现。接下来需要增强 AI 功能、添加文档标签系统、文档封面和图标自定义、文档内链接与反向链接，提升产品差异化和用户体验。

## What Changes
- SelectionAIMenu 扩展：新增"润色"、"缩写"、"扩写"、"解释"操作
- 文档标签系统：新增 TagEntity、PageTagEntity，支持文档多标签分类
- 文档封面和图标自定义：PageEntity 新增 coverImage 字段，前端新增封面图区域
- 文档内链接与反向链接：新增 BacklinksPanel 组件，显示引用当前文档的其他文档

## Impact
- Affected code: `SelectionAIMenu/index.tsx`、新增 TagModule、PageEntity 新增字段、Doc 页面增强
- Affected specs: 无冲突

## ADDED Requirements

### Requirement: AI 选中文本操作扩展
系统 SHALL 在 SelectionAIMenu 中提供"润色"、"缩写"、"扩写"、"解释"四个额外操作。

#### Scenario: 用户选中文本后使用润色
- **WHEN** 用户选中文本并点击"润色"
- **THEN** AI 对文本进行润色优化，结果插入到选中文本下方

#### Scenario: 用户选中文本后使用缩写
- **WHEN** 用户选中文本并点击"缩写"
- **THEN** AI 对文本进行精简缩写，结果插入到选中文本下方

### Requirement: 文档标签系统
系统 SHALL 支持为文档添加多个标签，并按标签筛选文档。

#### Scenario: 创建标签
- **WHEN** 用户在侧边栏创建新标签
- **THEN** 标签创建成功，出现在侧边栏标签列表中

#### Scenario: 为文档添加标签
- **WHEN** 用户在文档编辑页为文档添加标签
- **THEN** 文档与标签关联，侧边栏按标签分组显示该文档

#### Scenario: 按标签筛选文档
- **WHEN** 用户在侧边栏点击某个标签
- **THEN** 显示该标签下的所有文档

### Requirement: 文档封面图
系统 SHALL 支持为文档设置封面图，显示在文档编辑区顶部。

#### Scenario: 设置封面图
- **WHEN** 用户点击文档顶部封面区域选择封面
- **THEN** 封面图显示在文档标题上方

#### Scenario: 移除封面图
- **WHEN** 用户点击封面图上的移除按钮
- **THEN** 封面图被移除，文档顶部恢复默认

### Requirement: 反向链接面板
系统 SHALL 显示哪些文档通过 @引用 链接到了当前文档。

#### Scenario: 查看反向链接
- **WHEN** 用户打开反向链接面板
- **THEN** 显示所有引用了当前文档的其他文档列表

## MODIFIED Requirements
无

## REMOVED Requirements
无
