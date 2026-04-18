# 字数统计与多格式导出功能实施计划

## 一、功能概述

### 功能 1：字数统计与阅读时长
在文档底部状态栏实时显示当前文档的字数统计和预估阅读时长，选中文字时显示选中部分的字数。

### 功能 2：文档多格式导出
支持将文档导出为 Markdown、Word (.docx)、PDF、HTML、纯文本五种格式，全部在浏览器端完成。

---

## 二、实施步骤

### 步骤 1：创建字数统计工具函数

**文件**: `apps/web/src/utils/wordCount.ts`

创建纯工具函数，不依赖 React，负责文本统计计算：

```typescript
interface WordCountResult {
  charsWithSpaces: number      // 总字符数（含空格）
  charsWithoutSpaces: number   // 总字符数（不含空格）
  words: number                // 总词数（中文字符按1个词计，英文按空格分割）
  paragraphs: number           // 总段落数（非空段落）
  sentences: number            // 总句子数（按句号/问号/感叹号分割）
  readingTime: number          // 阅读时长（分钟）
  readingTimeText: string      // 格式化阅读时长文本
}

function calculateWordCount(text: string): WordCountResult
function calculateSelectionWordCount(text: string): { charsWithSpaces: number; charsWithoutSpaces: number; words: number }
```

**计算规则**：
- 词数统计：中文每个字符算1个词，英文按空格分割统计词数
- 阅读时长：中文 400 字/分钟 + 英文 200 词/分钟，取两者最大值
- 段落数：按换行符分割，排除空段落
- 句子数：按 `。！？.!?` 分割统计

---

### 步骤 2：创建字数统计 Hook

**文件**: `apps/web/src/hooks/useWordCount.ts`

```typescript
interface WordCountState {
  charsWithSpaces: number
  charsWithoutSpaces: number
  words: number
  paragraphs: number
  sentences: number
  readingTimeText: string
  selectionText: string | null    // 选中文字的统计文本
  selectionChars: number          // 选中字符数
}
```

- 使用 `useEditorContentOrSelectionChange` 监听编辑器内容/选区变化
- 通过 `editor._tiptapEditor.state.doc.textContent` 获取全文纯文本
- 通过 `editor._tiptapEditor.state.doc.textBetween(from, to)` 获取选中文字
- 使用 `debounce`（已有工具函数）防抖，避免频繁计算
- 返回 `WordCountState` 对象

---

### 步骤 3：创建状态栏组件

**文件**: `apps/web/src/components/StatusBar/index.tsx`

UI 设计：
- 位于页面底部，`sticky bottom-0`
- 高度约 28px，背景色低调（`bg-zinc-50 dark:bg-zinc-900`）
- 左侧显示：字数 | 词数 | 段落 | 约 X 分钟阅读
- 选中文字时，左侧临时变为：已选 X 字
- 字号 `text-xs`，颜色 `text-muted-foreground`
- 使用 Tailwind CSS 样式

组件接口：
```typescript
interface StatusBarProps {
  editor: LcwDocEditor | null
}
```

---

### 步骤 4：集成状态栏到文档页面

**文件**: `apps/web/src/pages/Doc/index.tsx`

在 `<SidebarInset>` 内底部添加 `<StatusBar>` 组件：
- 将 `editorInstance` 传递给 StatusBar
- 确保状态栏在内容区域下方，sticky 定位

---

### 步骤 5：安装导出相关依赖

在 `apps/web/` 目录安装：
- `docx` — 生成 Word (.docx) 文件
- `file-saver` — 保存文件到本地
- `html2pdf.js` — 将 HTML 转换为 PDF

```bash
cd apps/web && npm install docx file-saver html2pdf.js
npm install -D @types/file-saver
```

---

### 步骤 6：创建导出工具函数

**文件**: `apps/web/src/utils/exportDocument.ts`

统一的导出入口，封装各格式的导出逻辑：

```typescript
type ExportFormat = 'markdown' | 'html' | 'docx' | 'pdf' | 'txt'

async function exportDocument(
  editor: LcwDocEditor,
  format: ExportFormat,
  fileName: string
): Promise<void>
```

各格式实现：

#### Markdown 导出（已有）
- 使用 `blocksToMarkdown(editor.document, editor.pmSchema, editor, {})`
- 保存为 `.md` 文件

#### HTML 导出（已有）
- 使用 `createExternalHTMLExporter(editor.pmSchema, editor).exportBlocks(blocks, {})`
- 包装为完整 HTML 文档（添加 `<html><head><style>...</style></head><body>...</body></html>`）
- 添加基本排版样式
- 保存为 `.html` 文件

#### 纯文本导出
- 使用 `editor._tiptapEditor.state.doc.textContent` 获取纯文本
- 保存为 `.txt` 文件

#### Word (.docx) 导出
- 使用 `docx` 库
- 遍历 `editor.document`（Block[]），将每种块类型转换为 docx 库的段落/表格对象
- 标题 → `docx.TextRun` + `docx.Paragraph`（设置 heading level）
- 段落 → `docx.Paragraph`（处理行内样式：粗体、斜体、删除线、链接等）
- 列表 → `docx.Paragraph`（设置 bullet/numbering）
- 代码块 → `docx.Paragraph`（设置等宽字体和背景色）
- 表格 → `docx.Table`
- 分割线 → `docx.Paragraph`（设置 border bottom）
- 生成 `docx.Document` 并通过 `Packer.toBlob()` 导出

#### PDF 导出
- 先生成完整 HTML（带内联样式）
- 使用 `html2pdf.js` 将 HTML 转换为 PDF
- 配置：页眉显示文档标题，页脚显示页码
- 处理大文档提示

---

### 步骤 7：创建导出面板组件

**文件**: `apps/web/src/components/ExportPanel/index.tsx`

UI 设计：
- 使用 `Dialog` 组件（来自 `@lcw-doc/shadcn-shared-ui`）
- 标题："导出文档"
- 格式列表，每项包含：图标 + 格式名称 + 简介文字
- 点击格式项触发导出
- 导出中显示 loading 状态
- 导出完成后 toast 提示

格式列表：
| 格式 | 图标 | 说明 |
|------|------|------|
| Markdown (.md) | FileText | 原始 Markdown 源码 |
| Word (.docx) | FileDown | 支持 Word/WPS 打开 |
| PDF (.pdf) | FileImage | 高保真排版 |
| HTML (.html) | Globe | 可在浏览器打开 |
| 纯文本 (.txt) | File | 仅保留文本内容 |

---

### 步骤 8：改造现有导出入口

**文件**: `apps/web/src/pages/Doc/index.tsx`

- 移除现有的 `DropdownMenu` 导出按钮
- 替换为打开 `ExportPanel` 对话框的按钮
- 将 `editorInstance` 和 `page?.title` 传递给 ExportPanel
- 保留 Download 图标按钮，点击后打开 ExportPanel

---

## 三、文件变更清单

| 操作 | 文件路径 | 说明 |
|------|---------|------|
| 新建 | `apps/web/src/utils/wordCount.ts` | 字数统计工具函数 |
| 新建 | `apps/web/src/hooks/useWordCount.ts` | 字数统计 React Hook |
| 新建 | `apps/web/src/components/StatusBar/index.tsx` | 底部状态栏组件 |
| 新建 | `apps/web/src/utils/exportDocument.ts` | 文档导出工具函数 |
| 新建 | `apps/web/src/components/ExportPanel/index.tsx` | 导出面板组件 |
| 修改 | `apps/web/src/pages/Doc/index.tsx` | 集成状态栏 + 改造导出入口 |
| 修改 | `apps/web/package.json` | 添加 docx, file-saver, html2pdf.js 依赖 |

---

## 四、技术要点

### 字数统计性能优化
- 使用 `debounce`（300ms）防止频繁计算
- 仅在内容或选区变化时重新计算
- 文本获取使用 `doc.textContent` 而非遍历 Block[]，性能更优

### Word 导出的行内样式处理
需要遍历 Block 的 `content`（InlineContent[]），识别以下样式标记：
- `styled` + `text` → 粗体/斜体/下划线/删除线/代码/链接/上标/下标/高亮
- 根据 `styles` 对象中的样式类型应用对应的 docx 格式

### PDF 导出注意事项
- html2pdf.js 底层使用 html2canvas + jsPDF
- 需要确保 HTML 内容有足够的宽度（避免截断）
- 中文需要确保字体渲染正常
- 大文档需要提示用户等待

### 错误处理
- 导出失败时 try-catch 捕获，显示 toast 错误提示
- 大文档（>10000 字）导出前显示确认提示
- 编辑器未就绪时禁用导出按钮

---

## 五、实施顺序

1. **步骤 1-4**：字数统计功能（可独立完成，不依赖导出功能）
2. **步骤 5-8**：多格式导出功能（依赖步骤 5 安装依赖）

两个功能可以并行开发，但建议先完成字数统计（更简单），再实现导出功能。
