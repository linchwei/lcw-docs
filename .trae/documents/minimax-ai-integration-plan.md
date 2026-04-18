# MiniMax AI 集成计划 — 修复两个关键问题

## 当前状态：代码已完成，需修复两个问题

---

## 问题分析与修复方案

### 问题 1：AI 生成的文档流式不太流畅

**根因分析**：
- 当前 SSE 解析在 [BasicAIChatPanel.tsx:90-113](file:///Users/lin/Desktop/levy/project/lcw-docs/apps/web/src/components/BasicAIChat/BasicAIChatPanel.tsx#L90-L113) 中直接按 `\n` 分割 chunk
- SSE 数据可能跨 chunk 分割：一个 `data: {...}` 行可能被拆分到两个 chunk 中
- 导致 JSON 解析失败，内容丢失或延迟显示
- 没有缓冲区机制来处理不完整的行

**修复方案**：
- 实现 SSE 缓冲区：将收到的 chunk 追加到缓冲区字符串
- 只处理以 `\n` 结尾的完整行
- 保留不完整的行在缓冲区中等待下一个 chunk
- 这样每个 `data: {...}` 行都能被完整解析，流式输出更流畅

**修改文件**：
1. `apps/web/src/components/BasicAIChat/BasicAIChatPanel.tsx` — SSE 解析添加缓冲区
2. `apps/web/src/components/SelectionAIMenu/index.tsx` — SSE 解析添加缓冲区
3. `apps/web/src/blocks/ai/ai.tsx` — SSE 解析添加缓冲区（同时修复仍使用旧 Dify 格式 `data.answer` 的问题）

---

### 问题 2：AI 插入编辑器是 Markdown 文档，应该格式化成编辑器的格式

**根因分析**：
- AI 返回 Markdown 格式文本（如 `# 标题`、`**粗体**`、`- 列表项`）
- [BasicAIChatPanel.tsx:125-133](file:///Users/lin/Desktop/levy/project/lcw-docs/apps/web/src/components/BasicAIChat/BasicAIChatPanel.tsx#L125-L133) 先尝试 `JSON.parse(accumulated)`（必然失败），然后退化为将整段文本包装为单个 `paragraph` 块
- 项目已有 `editor.tryParseMarkdownToBlocks(markdown)` 方法（[LcwDocEditor.ts:1054-1062](file:///Users/lin/Desktop/levy/project/lcw-docs/packages/core/src/editor/LcwDocEditor.ts#L1054-L1062)），能将 Markdown 正确解析为标题、列表、粗体等多种块类型
- 当前代码**完全没有使用**这个方法

**修复方案**：
- 在 `BasicAIChatPanel.tsx` 中，将 `JSON.parse` 逻辑替换为 `editor.tryParseMarkdownToBlocks(accumulated)`
- 在 `SelectionAIMenu/index.tsx` 中，同样使用 `tryParseMarkdownToBlocks` 解析后插入
- 在 `ai.tsx` 的 `handleAccept` 中，同样使用 `tryParseMarkdownToBlocks` 解析
- 注意：`tryParseMarkdownToBlocks` 是异步方法，需要 `await`

**修改文件**：
1. `apps/web/src/components/BasicAIChat/BasicAIChatPanel.tsx` — 用 `tryParseMarkdownToBlocks` 替换 `JSON.parse`
2. `apps/web/src/components/SelectionAIMenu/index.tsx` — 用 `tryParseMarkdownToBlocks` 解析后插入
3. `apps/web/src/blocks/ai/ai.tsx` — handleAccept 用 `tryParseMarkdownToBlocks` 解析

---

## 实施步骤

### Step 1: 修复 SSE 流式缓冲区（问题 1）
- 在 `BasicAIChatPanel.tsx` 中实现 SSE 缓冲区机制
- 在 `SelectionAIMenu/index.tsx` 中实现同样的缓冲区
- 在 `ai.tsx` 中实现缓冲区并修复 Dify 格式 → MiniMax 格式

### Step 2: 修复 Markdown → 编辑器格式转换（问题 2）
- 在 `BasicAIChatPanel.tsx` 中用 `editor.tryParseMarkdownToBlocks()` 替换 `JSON.parse`
- 在 `SelectionAIMenu/index.tsx` 中用 `tryParseMarkdownToBlocks` 解析后插入
- 在 `ai.tsx` 的 `handleAccept` 中用 `tryParseMarkdownToBlocks` 解析

### Step 3: API Key 持久化
- 创建 `apps/server/.env` 文件，添加 `MINIMAX_API_KEY`
- 在 `.gitignore` 中添加 `.env` 规则

### Step 4: 启动服务并验证
- 启动后端和前端
- 测试 AI 聊天：流式输出流畅 + Markdown 格式化
- 测试 SelectionAI 菜单
- 测试 AI Block 的接受操作

### Step 5: 代码自检
- 运行 lint/typecheck
- 检查控制台无报错
