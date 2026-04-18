# Markdown 快捷格式编辑器 — 实施计划

## 当前状态分析

### 已支持的 Markdown 快捷格式

| 快捷输入 | 转换结果 | 实现位置 |
|---------|---------|---------|
| `# ` / `## ` / `### ` | H1 / H2 / H3 | Core HeadingBlockContent + CustomInputRules（重复） |
| `- ` / `+ ` / `* ` | 无序列表 | Core BulletListItem + CustomInputRules（重复） |
| `1. ` | 有序列表 | Core NumberedListItem + CustomInputRules（重复） |
| `[ ] ` / `[x] ` | 未勾选/已勾选复选框 | Core CheckListItem + CustomInputRules（重复） |
| `` ``` `` | 代码块 | Core CodeBlockContent + CustomInputRules（重复） |
| `> ` | 引用块 | CustomInputRules |
| `---` / `***` / `___` | 分割线 | CustomInputRules |
| `**text**` | 粗体 | TipTap Bold Mark 内置 InputRule |
| `__text__` | 粗体 | TipTap Bold Mark 内置 InputRule |
| `*text*` | 斜体 | TipTap Italic Mark 内置 InputRule |
| `_text_` | 斜体 | TipTap Italic Mark 内置 InputRule |
| `~~text~~` | 删除线 | TipTap Strike Mark 内置 InputRule |
| `` `text` `` | 行内代码 | TipTap Code Mark 内置 InputRule |

### 需要新增的快捷格式

| 快捷输入 | 转换结果 | 难度 |
|---------|---------|------|
| `#### ` / `##### ` / `###### ` | H4 / H5 / H6 | 中（需修改 Core headingPropSchema） |
| `` ```lang `` | 带语言标识的代码块 | 低（Core 已支持，CustomInputRules 需对齐） |
| `[text](url)` | 超链接 | 中（需新增内联 InputRule） |
| `![alt](url)` | 图片 | 高（需新增内联 InputRule + 图片块创建） |
| `\| 表头 \| 表头 \|` | 表格 | 高（需新增块级 InputRule + 表格块创建） |
| `==text==` | 高亮/荧光标记 | 中（需新增自定义 StyleSpec + InputRule） |
| `^text^` | 上标 | 中（需新增自定义 StyleSpec + InputRule） |
| `~text~` | 下标 | 中（需新增自定义 StyleSpec + InputRule，注意与删除线冲突） |

### 需要修复的问题

1. **CustomInputRules 与 Core InputRule 重复**：标题、列表、代码块的 InputRule 在 Core 和 CustomInputRules 中都有定义，可能导致双重触发
2. **标题只支持 H1-H3**：`headingPropSchema` 的 `level` 只允许 `[1, 2, 3]`，需要扩展到 `[1, 2, 3, 4, 5, 6]`

## 实施步骤

### 步骤 1：清理 CustomInputRules 重复定义

**文件**：`apps/web/src/extensions/CustomInputRules.ts`

移除与 Core 包重复的 InputRule：
- 移除 `# ` / `## ` / `### `（Core HeadingBlockContent 已定义）
- 移除 `- ` / `* `（Core BulletListItem 已定义）
- 移除 `1. `（Core NumberedListItem 已定义）
- 移除 `[] `（Core CheckListItem 已定义）
- 移除 `` ``` ``（Core CodeBlockContent 已定义，且 Core 版本支持语言标识）

保留 CustomInputRules 中独有的：
- `> ` → blockquote（Core 未定义）
- `---` / `***` / `___` → divider（Core 未定义）

新增：
- `#### ` / `##### ` / `###### ` → H4 / H5 / H6（Core 只支持 H1-H3，需在此补充）

### 步骤 2：扩展标题级别到 H4-H6

**方案**：不修改 Core 包的 `headingPropSchema`（避免影响范围过大），在 CustomInputRules 中添加 H4-H6 的 InputRule，并将 `level` 值设为 4/5/6。Core 的 HeadingBlockContent 渲染时会根据 `level` 属性渲染为 `h4`/`h5`/`h6`（因为 `renderHTML` 使用 `h${node.attrs.level}`），但需要确认 `level` 的 values 约束不会阻止。

**验证**：`headingPropSchema` 中 `level: { default: 1, values: [1, 2, 3] as const }` 限制了 values。需要修改 Core 包扩展为 `[1, 2, 3, 4, 5, 6]`。

**文件**：`packages/core/src/blocks/HeadingBlockContent/HeadingBlockContent.ts`
- 修改 `headingPropSchema` 的 `level.values` 为 `[1, 2, 3, 4, 5, 6]`
- 修改 `addInputRules()` 扩展为 `[1, 2, 3, 4, 5, 6]`
- 修改 `addKeyboardShortcuts()` 添加 `Mod-Alt-4` / `Mod-Alt-5` / `Mod-Alt-6`
- 修改 `parseHTML()` 添加 `h4`/`h5`/`h6` 标签解析

### 步骤 3：新增 ==高亮== StyleSpec

**文件**：`apps/web/src/extensions/HighlightMark.ts`（新建）

创建 TipTap Mark 扩展，支持 `==text==` → 高亮标记：
- 使用 `markInputRule` 匹配 `==text==` 模式
- 渲染为 `<mark>` 标签（黄色背景）
- 注册到编辑器的 styleSpecs

**文件**：`apps/web/src/pages/Doc/DocEditor.tsx`
- 在 schema 创建时添加 highlight styleSpec

### 步骤 4：新增 ^上标^ 和 ~下标~ StyleSpec

**文件**：`apps/web/src/extensions/SupSubMark.ts`（新建）

创建两个 TipTap Mark 扩展：
- `^text^` → 上标（`<sup>` 标签）
- `~text~` → 下标（`<sub>` 标签，注意与 `~~删除线~~` 区分）

**区分策略**：`~text~`（单个波浪号）为下标，`~~text~~`（双波浪号）为删除线。InputRule 正则需精确匹配。

**文件**：`apps/web/src/pages/Doc/DocEditor.tsx`
- 在 schema 创建时添加 superscript / subscript styleSpec

### 步骤 5：新增 [text](url) 链接快捷输入

**文件**：`apps/web/src/extensions/CustomInputRules.ts`

添加内联 InputRule，匹配 `[text](url)` 模式：
- 正则：`/(?<=[^\[]|^)\[(?<text>[^\]]+)\]\((?<url>[^\)]+)\)$/`
- 匹配后创建 link 内联内容
- 这需要使用 ProseMirror 事务直接操作文档

### 步骤 6：新增表格快捷输入

**文件**：`apps/web/src/extensions/CustomInputRules.ts`

添加块级 InputRule，匹配 `| 表头 | 表头 |` 模式：
- 正则：`/^\|(.+\|)+\s*$/`（匹配至少含一个 `|` 的行）
- 匹配后创建 table 块
- 解析管道符分隔的内容为表格行列

### 步骤 7：新增 ![alt](url) 图片快捷输入

**文件**：`apps/web/src/extensions/CustomInputRules.ts`

添加内联/块级 InputRule，匹配 `![alt](url)` 模式：
- 正则：`/^!\[([^\]]*)\]\(([^)]+)\)$/`
- 匹配后创建 image 块
- 如果是网络图片，尝试下载并转存到图床

### 步骤 8：更新快捷键帮助对话框

**文件**：`apps/web/src/components/KeyboardShortcutsDialog/index.tsx`

添加新的快捷格式到帮助列表：
- `#### ` → 四级标题
- `##### ` → 五级标题
- `###### ` → 六级标题
- `**text**` / `__text__` → 粗体
- `*text*` / `_text_` → 斜体
- `~~text~~` → 删除线
- `` `text` `` → 行内代码
- `==text==` → 高亮
- `^text^` → 上标
- `~text~` → 下标
- `[text](url)` → 链接
- `![alt](url)` → 图片
- `| 表头 | 表头 |` → 表格

### 步骤 9：验证与测试

- 在编辑器中逐个测试所有快捷格式
- 确认无 InputRule 冲突
- 运行 typecheck

## 文件清单

| 操作 | 文件路径 | 说明 |
|------|---------|------|
| 修改 | `apps/web/src/extensions/CustomInputRules.ts` | 清理重复 + 新增快捷格式 |
| 修改 | `packages/core/src/blocks/HeadingBlockContent/HeadingBlockContent.ts` | 扩展 H4-H6 |
| 新建 | `apps/web/src/extensions/HighlightMark.ts` | ==高亮== Mark |
| 新建 | `apps/web/src/extensions/SupSubMark.ts` | ^上标^ ~下标~ Mark |
| 修改 | `apps/web/src/pages/Doc/DocEditor.tsx` | 注册新 StyleSpec |
| 修改 | `apps/web/src/components/KeyboardShortcutsDialog/index.tsx` | 更新帮助列表 |

## 优先级排序

1. **P0（核心）**：清理重复 InputRule + 扩展 H4-H6
2. **P0（核心）**：==高亮== / ^上标^ / ~下标~ 自定义 StyleSpec
3. **P1（重要）**：[text](url) 链接快捷输入
4. **P1（重要）**：表格快捷输入
5. **P2（增强）**：![alt](url) 图片快捷输入
6. **P2（增强）**：更新快捷键帮助对话框
