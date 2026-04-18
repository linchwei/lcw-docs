# 字数统计与多格式导出 — 实施计划

## 当前状态

已完成：
- `apps/web/src/utils/wordCount.ts` — 字数统计工具函数 ✅
- `apps/web/src/hooks/useWordCount.ts` — 字数统计 Hook ✅（需修复 bug）

待实施：
- StatusBar 状态栏组件
- StatusBar 集成到 Doc 页面
- 安装导出依赖
- 导出工具函数
- 导出面板组件
- 改造 Doc 页面导出入口

---

## 步骤 1：修复 useWordCount.ts 中的 API 调用错误

**问题**：当前代码使用 `editor.onUpdate(onChange)`，但 `LcwDocEditor` 没有 `onUpdate` 方法。

**修复**：
- 将 `editor.onUpdate(onChange)` 替换为 `editor.onChange(onChange)`
- 将 `editor._tiptapEditor.on('transaction', ...)` 替换为 `editor.onSelectionChange(onChange)` 实现选中文字的统计
- `onChange` 回调签名需匹配 `(editor: LcwDocEditor) => void`，不需要接收参数

**修改文件**：`apps/web/src/hooks/useWordCount.ts`

```typescript
// 修改前
const unsubUpdate = editor.onUpdate(onChange)
const unsubTransaction = editor._tiptapEditor.on('transaction', () => {
    const { empty } = editor._tiptapEditor.state.selection
    if (!empty) {
        clearTimeout(timerRef.current)
        timerRef.current = setTimeout(updateWordCount, 100)
    }
})
return () => {
    clearTimeout(timerRef.current)
    unsubUpdate()
    unsubTransaction()
}

// 修改后
const unsubChange = editor.onChange(() => {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(updateWordCount, 300)
})
const unsubSelection = editor.onSelectionChange(() => {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(updateWordCount, 100)
})
return () => {
    clearTimeout(timerRef.current)
    unsubChange()
    unsubSelection()
}
```

---

## 步骤 2：创建 StatusBar 状态栏组件

**文件**：`apps/web/src/components/StatusBar/index.tsx`

**UI 规范**：
- 位于页面底部，`sticky bottom-0` 或 `fixed bottom-0`
- 高度 28px，背景 `bg-white/80 dark:bg-zinc-900/80`，毛玻璃 `backdrop-blur-md`
- 上边框 `border-t border-zinc-100 dark:border-zinc-800`
- 字号 `text-xs`，颜色 `text-muted-foreground`
- 右对齐显示统计信息

**显示格式**：
- 默认：`字数 1,234 | 词数 567 | 段落 23 | 约 3 分钟阅读`
- 选中时：`已选 56 字` 替换显示（高亮色 `text-foreground`）

**Props**：
```typescript
interface StatusBarProps {
    editor: LcwDocEditor<any, any, any> | null
}
```

**组件结构**：
```tsx
function StatusBar({ editor }: StatusBarProps) {
    const { charsWithoutSpaces, words, paragraphs, readingTimeText, hasSelection, selectionChars } = useWordCount(editor)

    return (
        <div className="sticky bottom-0 z-10 flex items-center justify-end h-7 px-4 border-t border-zinc-100 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {hasSelection ? (
                    <span className="text-foreground font-medium">已选 {formatNumber(selectionChars)} 字</span>
                ) : (
                    <>
                        <span>字数 {formatNumber(charsWithoutSpaces)}</span>
                        <span className="text-zinc-300 dark:text-zinc-700">|</span>
                        <span>词数 {formatNumber(words)}</span>
                        <span className="text-zinc-300 dark:text-zinc-700">|</span>
                        <span>段落 {formatNumber(paragraphs)}</span>
                        <span className="text-zinc-300 dark:text-zinc-700">|</span>
                        <span>{readingTimeText}</span>
                    </>
                )}
            </div>
        </div>
    )
}
```

---

## 步骤 3：集成 StatusBar 到 Doc 页面

**修改文件**：`apps/web/src/pages/Doc/index.tsx`

**修改点**：
1. 导入 StatusBar 组件
2. 在 `SidebarInset` 的最底部（内容区域之后）添加 `<StatusBar editor={editorInstance} />`

**布局变更**：
```
SidebarInset
  ├── header (sticky top)
  ├── 内容区域 (flex-1, overflow-auto)
  └── StatusBar (sticky bottom)  ← 新增
```

需要调整内容区域使其可以滚动，StatusBar 固定在底部。具体做法：
- 将内容区域包裹在 `flex-1 overflow-auto` 的容器中
- StatusBar 放在容器外，作为 `SidebarInset` 的直接子元素
- `SidebarInset` 使用 `flex flex-col h-screen` 布局

---

## 步骤 4：安装导出相关依赖

**安装命令**：
```bash
cd apps/web
pnpm add docx file-saver html2pdf.js
pnpm add -D @types/file-saver
```

**依赖说明**：
| 包名 | 用途 | 大小 |
|------|------|------|
| `docx` | 生成 Word (.docx) 文件 | ~200KB |
| `file-saver` | 跨浏览器文件下载 | ~3KB |
| `html2pdf.js` | HTML 转 PDF（html2canvas + jsPDF） | ~500KB |

---

## 步骤 5：创建导出工具函数

**文件**：`apps/web/src/utils/exportDocument.ts`

**功能**：统一导出入口，支持 5 种格式

**核心 API**：
```typescript
type ExportFormat = 'markdown' | 'html' | 'docx' | 'pdf' | 'txt'

async function exportDocument(
    editor: LcwDocEditor<any, any, any>,
    format: ExportFormat,
    fileName: string
): Promise<void>
```

**各格式实现**：

### Markdown 导出
```typescript
const content = await editor.blocksToMarkdownLossy()
downloadFile(content, `${fileName}.md`, 'text/markdown')
```

### HTML 导出
```typescript
const content = await editor.blocksToHTMLLossy()
const fullHTML = wrapHTMLDocument(content, fileName)
downloadFile(fullHTML, `${fileName}.html`, 'text/html')
```

### 纯文本导出
```typescript
const text = editor._tiptapEditor.state.doc.textContent
downloadFile(text, `${fileName}.txt`, 'text/plain')
```

### Word 导出（使用 docx 库）
```typescript
const blocks = editor.document
const doc = new Document({
    sections: [{ children: convertBlocksToDocxChildren(blocks, editor) }]
})
const blob = await Packer.toBlob(doc)
saveAs(blob, `${fileName}.docx`)
```

`convertBlocksToDocxChildren` 需要遍历 `Block[]`，根据 block type 创建对应的 docx 元素：
- 段落 → `docx.Paragraph`
- 标题 → `docx.Paragraph` + heading style
- 列表 → `docx.Paragraph` + bullet/numbering
- 代码块 → `docx.Paragraph` + monospace font
- 引用 → `docx.Paragraph` + border left
- 表格 → `docx.Table`
- 行内样式：粗体/斜体/删除线/链接 → `docx.TextRun` + style props

### PDF 导出（使用 html2pdf.js）
```typescript
const htmlContent = await editor.blocksToHTMLLossy()
const container = document.createElement('div')
container.innerHTML = wrapHTMLForPDF(htmlContent, fileName)
container.style.position = 'absolute'
container.style.left = '-9999px'
document.body.appendChild(container)

await html2pdf()
    .set({
        margin: [15, 15, 15, 15],
        filename: `${fileName}.pdf`,
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    })
    .from(container)
    .save()

document.body.removeChild(container)
```

**辅助函数**：
- `downloadFile(content, filename, mimeType)` — Blob + saveAs 下载
- `wrapHTMLDocument(html, title)` — 包装为完整 HTML 文档（含样式）
- `wrapHTMLForPDF(html, title)` — 包装为 PDF 专用 HTML（含页眉标题、分页样式）
- `convertBlocksToDocxChildren(blocks, editor)` — Block[] 转 docx 元素数组

**错误处理**：
- 大文档提示：当 `textContent.length > 50000` 时，先显示 toast 提示"文档内容较多，导出可能需要几秒钟"
- 导出失败：catch 错误后 toast 提示"导出失败，请稍后重试"

---

## 步骤 6：创建 ExportPanel 导出面板组件

**文件**：`apps/web/src/components/ExportPanel/index.tsx`

**UI 规范**：
- 使用 `Dialog` 组件（从 `@lcw-doc/shadcn-shared-ui` 导入）
- 标题："导出文档"
- 格式列表，每项包含：图标 + 格式名 + 简介 + 点击导出

**格式列表数据**：
```typescript
const exportFormats = [
    { key: 'markdown', label: 'Markdown', ext: '.md', icon: FileText, desc: '原始 Markdown 源码，保留所有语法标记' },
    { key: 'html', label: 'HTML', ext: '.html', icon: Code, desc: '单文件 HTML，可直接在浏览器打开，自带样式' },
    { key: 'docx', label: 'Word', ext: '.docx', icon: File, desc: 'Word 格式，支持 Word/WPS 打开，保留标题层级、列表、表格' },
    { key: 'pdf', label: 'PDF', ext: '.pdf', icon: FileDown, desc: '高保真排版，适合打印和分享' },
    { key: 'txt', label: '纯文本', ext: '.txt', icon: AlignLeft, desc: '仅保留文本内容，去除所有格式' },
]
```

**组件结构**：
```tsx
function ExportPanel({ open, onOpenChange, editor, fileName }: ExportPanelProps) {
    const [exporting, setExporting] = useState<string | null>(null)
    const { toast } = useToast()

    const handleExport = async (format: ExportFormat) => {
        setExporting(format)
        try {
            if (isLargeDocument(editor)) {
                toast({ title: '文档内容较多，导出可能需要几秒钟' })
            }
            await exportDocument(editor, format, fileName)
            toast({ title: '导出成功', variant: 'success' })
            onOpenChange(false)
        } catch {
            toast({ title: '导出失败，请稍后重试', variant: 'destructive' })
        } finally {
            setExporting(null)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>导出文档</DialogTitle>
                </DialogHeader>
                <div className="grid gap-3 py-4">
                    {exportFormats.map(fmt => (
                        <button
                            key={fmt.key}
                            onClick={() => handleExport(fmt.key)}
                            disabled={exporting !== null}
                            className="flex items-center gap-3 p-3 rounded-lg border border-zinc-200 hover:bg-accent transition-colors text-left disabled:opacity-50"
                        >
                            <fmt.icon size={20} className="text-muted-foreground shrink-0" />
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium">{fmt.label} <span className="text-muted-foreground font-normal">{fmt.ext}</span></div>
                                <div className="text-xs text-muted-foreground">{fmt.desc}</div>
                            </div>
                            {exporting === fmt.key && <Loader2 size={16} className="animate-spin" />}
                        </button>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    )
}
```

---

## 步骤 7：改造 Doc 页面导出入口

**修改文件**：`apps/web/src/pages/Doc/index.tsx`

**修改点**：
1. 删除旧的 `handleExport` 函数
2. 删除旧的 `DropdownMenu` 导出下拉菜单
3. 添加 `exportOpen` state 控制导出面板
4. 将导出按钮改为打开 ExportPanel
5. 导入 ExportPanel 组件
6. 移除不再需要的 `blocksToMarkdown`、`createExternalHTMLExporter` 导入

**修改后的导出按钮**：
```tsx
<button
    onClick={() => setExportOpen(true)}
    className="inline-flex items-center justify-center rounded-md h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
>
    <Download size={16} />
</button>
```

**添加 ExportPanel**：
```tsx
<ExportPanel
    open={exportOpen}
    onOpenChange={setExportOpen}
    editor={editorInstance}
    fileName={page?.title || 'document'}
/>
```

---

## 步骤 8：浏览器测试验证

### 字数统计测试
1. 打开文档，确认底部状态栏显示统计信息
2. 输入中文内容，验证字数统计正确
3. 输入英文内容，验证词数统计正确
4. 混合中英文内容，验证统计正确
5. 选中部分文字，验证"已选 X 字"显示
6. 取消选中，验证恢复为总统计
7. 清空文档，验证显示初始状态

### 阅读时长测试
1. 输入约 400 字中文，验证显示"约 1 分钟"
2. 输入少量文字，验证显示"不足1分钟"

### 导出功能测试
1. 点击导出按钮，验证弹出导出面板
2. 逐个测试 5 种格式导出
3. 验证导出文件内容正确
4. 测试大文档导出提示
5. 测试导出失败处理

---

## 文件变更清单

| 操作 | 文件路径 | 说明 |
|------|---------|------|
| 修改 | `apps/web/src/hooks/useWordCount.ts` | 修复 API 调用错误 |
| 新建 | `apps/web/src/components/StatusBar/index.tsx` | 状态栏组件 |
| 修改 | `apps/web/src/pages/Doc/index.tsx` | 集成 StatusBar + ExportPanel |
| 新建 | `apps/web/src/utils/exportDocument.ts` | 导出工具函数 |
| 新建 | `apps/web/src/components/ExportPanel/index.tsx` | 导出面板组件 |
| 修改 | `apps/web/package.json` | 添加 docx, file-saver, html2pdf.js 依赖 |

---

## 技术要点

### Word 导出 — Block[] 到 docx 元素的转换

核心挑战是将编辑器的 `Block[]` 结构转换为 `docx` 库的 `Paragraph`/`Table` 结构。

关键映射：
- `Block.type === "paragraph"` → `new Paragraph({ children: [...TextRun] })`
- `Block.type === "heading"` → `new Paragraph({ heading: HeadingLevel.HEADING_N })`
- `Block.type === "bulletListItem"` → `new Paragraph({ bullet: { level } })`
- `Block.type === "numberedListItem"` → `new Paragraph({ numbering: { reference, level } })`
- `Block.type === "codeBlock"` → `new Paragraph({ children: [new TextRun({ font: "Courier New", text })] })`
- `Block.type === "quote"` → `new Paragraph({ border: { left: ... }, indent: ... })`
- `Block.type === "table"` → `new Table({ rows: [...] })`

行内样式映射：
- `bold` → `TextRun({ bold: true })`
- `italic` → `TextRun({ italics: true })`
- `strike` → `TextRun({ strike: true })`
- `link` → `ExternalHyperlink({ link, children: [TextRun] })`
- `code` → `TextRun({ font: "Courier New", shading: ... })`

### PDF 导出注意事项

- html2pdf.js 依赖 html2canvas 截图，对复杂布局可能有偏差
- 中文字体需要确保 CSS 中指定了系统字体（如 `"PingFang SC", "Microsoft YaHei"`）
- 代码块需要确保等宽字体渲染
- 大文档导出可能较慢，需要提前提示用户

### 性能优化

- 字数统计使用 300ms 防抖，避免频繁计算
- 选中文字变化使用 100ms 防抖，响应更及时
- 导出操作使用 `async/await`，不阻塞 UI
- 大文档导出前检测并提示
