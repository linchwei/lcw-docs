# Tasks

- [x] Task 1: 修复 `~~strike~~` 与 `~subscript~` 的 InputRule 冲突
  - [x] SubTask 1.1: 修改 `apps/web/src/extensions/HighlightSupSubMarks.ts` 中 SubscriptMarkImpl 的 InputRule 正则，添加 `(?<!~)` 负向后瞻，确保起始 `~` 前面不是另一个 `~`
  - [x] SubTask 1.2: 同步修改 SubscriptMarkImpl 的 PasteRule 正则，添加 `(?<!~)` 负向后瞻
  - [x] SubTask 1.3: 在浏览器中测试 `~~删除线~~` 正确转换为删除线 ✅
  - [x] SubTask 1.4: 在浏览器中测试 `H~2~O` 正确转换为下标 ✅
  - [x] SubTask 1.5: 在浏览器中测试同一文档中删除线和下标共存不冲突 ✅

- [x] Task 2: 修复 H4-H6 标题快捷键不生效的根本原因
  - [x] SubTask 2.1: 发现根本原因 —— Core 包构建产物过期，H4-H6 的 InputRules 和键盘快捷键未包含在构建产物中
  - [x] SubTask 2.2: 重新构建 Core 包 (`npm run build`)，使 H4-H6 定义生效
  - [x] SubTask 2.3: 移除 CustomInputRules 中重复的 H4-H6 InputRules（Core 已包含，无需重复）
  - [x] SubTask 2.4: 在浏览器中测试 `#### `、`##### `、`###### ` 正确转换为 H4-H6 标题 ✅
  - [x] SubTask 2.5: 在浏览器中测试 `Cmd+Alt+4/5/6` 正确切换为 H4-H6 标题 ✅

- [x] Task 3: 修复 LinkInputRule transaction 派发问题
  - [x] SubTask 3.1: 修改 `apps/web/src/extensions/LinkInputRule.ts`，将 `state.tr` + `chain().command()` 改为使用 `chain().deleteRange().insertContentAt().run()` 方式
  - [x] SubTask 3.2: 在浏览器中测试 `[Google](https://google.com)` 正确转换为链接 ✅

- [x] Task 4: 全面回归测试所有 Markdown 快捷键
  - [x] SubTask 4.1: 测试块级快捷键：`#`~`######`、`-`、`1.`、`[ ]`、`>`、`---`、``` ``` ``` ✅
  - [x] SubTask 4.2: 测试行内标记快捷键：`**bold**`、`*italic*`、`~~strike~~`、`` `code` ``、`==highlight==`、`^sup^`、`~sub~`、`[text](url)` ✅
  - [x] SubTask 4.3: 测试键盘快捷键：Cmd+Alt+1~6 切换标题级别 ✅

# Task Dependencies
- [Task 1, Task 2, Task 3] 可并行执行
- [Task 4] depends on [Task 1, Task 2, Task 3]
