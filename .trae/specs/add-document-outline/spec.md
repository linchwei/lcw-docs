# 文档目录（TOC）功能 Spec

## Why

编辑器缺少文档目录/大纲功能，用户在编写长文档时无法快速导航到不同章节。需要根据文档中的标题（h1/h2/h3）自动生成目录，显示在编辑器右侧，支持点击跳转。

## What Changes

- 新增 `DocOutline` 组件，用于展示文档标题目录
- 新增 `useDocOutline` hook，从编辑器中提取标题并监听变化
- 修改 `Doc/index.tsx` 布局，在编辑器右侧添加目录面板
- 目录面板在无标题时隐藏，有标题时自动显示

## Impact

- Affected code: `apps/web/src/pages/Doc/index.tsx`（布局调整）
- Affected code: `apps/web/src/pages/Doc/`（新增组件和 hook）
- Affected specs: 无

## ADDED Requirements

### Requirement: 文档目录组件

系统 SHALL 提供文档目录（DocOutline）组件，自动从编辑器内容中提取所有标题块（heading），并按层级结构展示。

#### Scenario: 文档包含标题时显示目录

- **WHEN** 文档中存在一个或多个标题块（h1/h2/h3）
- **THEN** 系统应在编辑器右侧显示目录面板，列出所有标题

#### Scenario: 文档无标题时隐藏目录

- **WHEN** 文档中不存在任何标题块
- **THEN** 系统应隐藏目录面板

#### Scenario: 标题层级缩进

- **WHEN** 目录面板显示标题列表
- **THEN** h1 标题无缩进，h2 标题缩进一级，h3 标题缩进两级

### Requirement: 目录点击跳转

系统 SHALL 支持用户点击目录中的标题项，将光标定位到编辑器中对应的标题块。

#### Scenario: 点击目录项跳转到标题

- **WHEN** 用户点击目录中的某个标题项
- **THEN** 系统应将编辑器光标移动到对应标题块的起始位置，并滚动到可视区域

### Requirement: 目录实时更新

系统 SHALL 在编辑器内容变化时实时更新目录。

#### Scenario: 新增标题后目录更新

- **WHEN** 用户在编辑器中新增一个标题块
- **THEN** 目录面板应立即显示新标题

#### Scenario: 删除标题后目录更新

- **WHEN** 用户删除编辑器中的一个标题块
- **THEN** 目录面板应立即移除该标题

#### Scenario: 修改标题文本后目录更新

- **WHEN** 用户修改某个标题块的文本内容
- **THEN** 目录面板应立即更新对应标题的显示文本

### Requirement: 当前标题高亮

系统 SHALL 在用户滚动或移动光标时，高亮显示目录中当前所在位置的标题项。

#### Scenario: 光标移动到标题下方段落

- **WHEN** 用户将光标移动到某个标题块下方的段落
- **THEN** 目录中该标题项应显示高亮样式

## 技术方案

### 数据提取

使用 `useEditorChange` hook 监听编辑器内容变化，通过 `editor.document` 获取所有区块，过滤 `type === 'heading'` 的块，提取 `id`、`props.level`、文本内容。

### 点击跳转

使用 `editor.setTextCursorPosition(blockId)` 将光标定位到目标块，编辑器会自动滚动到对应位置。

### 当前标题高亮

使用 `useEditorContentOrSelectionChange` hook 监听光标位置变化，通过 `editor.getTextCursorPosition()` 获取当前块 ID，与目录项匹配确定高亮项。

### 布局调整

将 `Doc/index.tsx` 中的 `w-[60%] mx-auto` 改为 flex 布局，左侧为编辑区域（保持 60% 宽度），右侧为目录面板（固定宽度，sticky 定位）。
