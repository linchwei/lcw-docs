# 修复 Markdown 快捷输入 Spec

## Why
用户报告使用 `#` 无法转换为标题。经过全面测试发现以下问题：
1. `~~strike~~`（删除线）被错误地转换为下标（subscript），因为下标的 InputRule 正则 `~text~` 会优先匹配 `~~text~~` 中的 `~text~` 部分
2. LinkInputRule 的 transaction 派发存在问题
3. H4-H6 标题的 InputRules 和键盘快捷键（Cmd+Alt+4/5/6）不生效，根本原因是 Core 包构建产物过期

## What Changes
- 修复 `~~strike~~` 与 `~subscript~` 的 InputRule 冲突：下标正则需要排除前面紧跟 `~` 的情况
- 修复 LinkInputRule 中 transaction 未正确派发的问题
- 重新构建 Core 包使 H4-H6 的 InputRules 和键盘快捷键生效
- 移除 CustomInputRules 中重复的 H4-H6 InputRules（Core 已包含）

## Impact
- Affected specs: 编辑器 Markdown 快捷输入
- Affected code:
  - `apps/web/src/extensions/HighlightSupSubMarks.ts` - 修复下标正则冲突
  - `apps/web/src/extensions/LinkInputRule.ts` - 修复 transaction 派发
  - `apps/web/src/extensions/CustomInputRules.ts` - 移除重复的 H4-H6 InputRules
  - `packages/core/build/` - 重新构建包含 H4-H6 定义

## ADDED Requirements

### Requirement: 删除线与下标 InputRule 冲突修复
系统 SHALL 确保输入 `~~text~~` 时正确转换为删除线（strike），而非下标（subscript）。

#### Scenario: 用户输入删除线快捷键
- **WHEN** 用户在编辑器中输入 `~~删除线文字~~`
- **THEN** 文字被正确转换为删除线样式（`<s>` 标签），而非下标样式（`<sub>` 标签）

#### Scenario: 用户输入下标快捷键
- **WHEN** 用户在编辑器中输入 `H~2~O`
- **THEN** `2` 被正确转换为下标样式（`<sub>` 标签）

#### Scenario: 删除线与下标共存
- **WHEN** 同一文档中同时使用 `~~删除线~~` 和 `~下标~`
- **THEN** 两种样式各自正确应用，互不干扰

### Requirement: H4-H6 标题快捷键正常工作
系统 SHALL 确保 H4-H6 标题的 InputRules 和键盘快捷键正常工作。Core 包构建产物必须包含 H4-H6 的定义。

#### Scenario: 用户输入 H4-H6 标题快捷键
- **WHEN** 用户输入 `#### `、`##### `、`###### ` 加空格
- **THEN** 正确转换为对应级别的标题

#### Scenario: 用户使用键盘快捷键切换 H4-H6
- **WHEN** 用户按下 Cmd+Alt+4/5/6
- **THEN** 当前块正确切换为对应级别的标题

### Requirement: LinkInputRule transaction 正确派发
系统 SHALL 确保 LinkInputRule 的 handler 正确应用文本删除和链接插入操作。

#### Scenario: 用户输入链接快捷键
- **WHEN** 用户输入 `[Google](https://google.com)`
- **THEN** 文字被正确转换为可点击的链接

## MODIFIED Requirements

### Requirement: 下标 InputRule 正则表达式
下标 Mark 的 InputRule 正则需要添加负向后瞻，排除前面紧跟 `~` 的情况（即 `~~text~~` 不应被下标匹配）。

原正则：
```typescript
find: /(~(?!\s+~)((?:[^~]+))~(?!\s+~))$/
```

新正则：
```typescript
find: /(?<!~)(~(?!\s+~)((?:[^~]+))~(?!\s+~))$/
```

添加 `(?<!~)` 负向后瞻，确保起始 `~` 前面不是另一个 `~`。

### Requirement: LinkInputRule handler 修复
LinkInputRule 的 handler 需要使用 `chain()` 正确派发 transaction，而非创建独立的 `state.tr`。

原实现：
```typescript
const tr = state.tr
tr.deleteRange(linkStart, linkEnd)
const textNode = state.schema.text(text, [state.schema.marks.link.create({ href: url })])
tr.insert(linkStart, textNode)
chain().command(({ tr: cmdTr }) => { return true }).run()
```

新实现：
```typescript
chain()
    .deleteRange({ from: linkStart, to: linkEnd })
    .insertContentAt(linkStart, state.schema.text(text, [state.schema.marks.link.create({ href: url })]))
    .run()
```

### Requirement: CustomInputRules 移除重复 H4-H6 定义
CustomInputRules 中的 H4-H6 InputRules 已被 Core 包的 HeadingBlockContent 包含，无需重复定义。移除 CustomInputRules 中的 `[4, 5, 6].map(level => ...)` 代码块。

## REMOVED Requirements
（无）
