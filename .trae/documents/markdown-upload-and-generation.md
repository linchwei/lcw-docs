# Markdown 文档上传与生成 — 实施计划

## 技术方案概述

基于现有代码库能力，实现 Markdown 文件上传与文档生成功能：

- **Markdown 解析**：直接使用 `@lcw-doc/core` 导出的 `markdownToBlocks` 函数（无需编辑器实例）
- **页面创建**：调用现有 `srv.createPage({ emoji, title })` API
- **内容写入**：创建页面后导航到编辑器，通过 `editor.replaceBlocks` 写入解析后的 blocks
- **文件上传**：使用现有 `srv.uploadFile` 上传图片到内置图床
- **UI 组件**：参考现有 `@radix-ui/react-dialog` 模式创建上传对话框

## 核心交互流程

```
用户点击"上传 Markdown"按钮 / 拖拽 .md 文件
    ↓
打开 MarkdownUploadDialog 对话框
    ↓
文件校验（格式 .md、大小 ≤ 5MB）
    ↓
FileReader 读取文件内容为文本
    ↓
markdownToBlocks() 解析为 Block[]（本地解析，不依赖后端）
    ↓
预览解析结果 + 高亮失败段落
    ↓
用户点击"确认生成"
    ↓
createPage() 创建新页面 → navigate 到编辑器
    ↓
editor.replaceBlocks(editor.document, blocks) 写入内容
    ↓
成功反馈 / 错误提示
```

## 实施步骤

### 步骤 1：创建 MarkdownUploadDialog 组件

**文件**：`apps/web/src/components/MarkdownUploadDialog/index.tsx`

功能：
1. 使用 `@radix-ui/react-dialog` 创建模态对话框
2. 拖拽上传区域（支持 drag & drop）
3. 点击上传按钮（隐藏 `<input type="file" accept=".md">`）
4. 文件校验逻辑：
   - 格式校验：仅接受 `.md` 扩展名
   - 大小校验：限制 5MB
   - 校验失败显示对应错误提示
5. 上传进度条（FileReader 的 `onprogress` 事件）
6. 解析状态展示（loading / 成功 / 失败）

**组件状态**：
```typescript
type UploadStep = 'select' | 'reading' | 'parsing' | 'preview' | 'generating' | 'success' | 'error'
```

### 步骤 2：实现 Markdown 解析与预览

**文件**：`apps/web/src/components/MarkdownUploadDialog/index.tsx`（内部逻辑）

解析流程：
1. `FileReader.readAsText(file)` 读取 .md 文件
2. 从 Markdown 内容提取标题（第一个 `#` 标题行）作为文档标题
3. 调用 `markdownToBlocks(markdown, schema.blockSchema, schema.inlineContentSchema, schema.styleSchema, pmSchema)` 解析
4. 需要创建一个临时的 LcwDocSchema 实例来获取 schema（与 DocEditor 中相同的配置）
5. 解析失败的段落用红色边框高亮，显示原始 Markdown 文本

**预览区域**：
- 使用简化版的 Block 预览（不需要完整的编辑器）
- 可解析的 Block 正常渲染
- 失败的段落显示原始 Markdown 文本 + 红色高亮边框 + "解析失败" 标签

### 步骤 3：实现图片转存逻辑

**文件**：`apps/web/src/components/MarkdownUploadDialog/index.tsx`（内部逻辑）

Markdown 中的图片引用处理：
1. 解析 Markdown 时识别 `![alt](url)` 格式的图片
2. 对于网络图片（`http://` 或 `https://` 开头）：
   - 下载图片到本地 Blob
   - 调用 `srv.uploadFile(blob)` 上传到内置图床
   - 替换 Block 中的 URL 为上传后的 URL
3. 对于本地路径图片（相对路径）：
   - 标记为"无法转存"，保留原始路径
   - 在预览中高亮提示

### 步骤 4：实现文档生成逻辑

**文件**：`apps/web/src/components/MarkdownUploadDialog/index.tsx`（内部逻辑）

生成流程：
1. 调用 `srv.createPage({ emoji: '📝', title: extractedTitle || '未命名文档' })`
2. 获取返回的 `pageId`
3. `navigate(`/doc/${pageId}`)` 导航到编辑器页面
4. 等待编辑器初始化完成（通过 `useEditorContext` 获取 editor）
5. 调用 `editor.replaceBlocks(editor.document, parsedBlocks)` 写入内容
6. 关闭对话框，显示成功提示

**关键问题**：导航到新页面后需要等待编辑器就绪才能写入内容。
- 方案：将待写入的 blocks 存储到 `sessionStorage`，在 Doc 页面的 `handleEditorReady` 回调中检查并写入

### 步骤 5：集成到 DocList 页面

**文件**：`apps/web/src/pages/DocList/index.tsx`

修改：
1. 在 toolbar 右侧添加"上传 Markdown"按钮（与"新建文档"按钮并列）
2. 在 DocList 的 `.content` 区域添加拖拽监听（dragover / drop 事件）
3. 拖拽 .md 文件时显示拖拽覆盖层
4. 拖拽释放后打开 MarkdownUploadDialog

### 步骤 6：集成到 Doc 编辑器页面

**文件**：`apps/web/src/pages/Doc/index.tsx`

修改：
1. 在 `handleEditorReady` 回调中添加逻辑：检查 `sessionStorage` 中是否有待写入的 blocks
2. 如果有，调用 `editor.replaceBlocks(editor.document, blocks)` 写入
3. 写入完成后清除 `sessionStorage`

### 步骤 7：样式实现

**文件**：`apps/web/src/components/MarkdownUploadDialog/MarkdownUploadDialog.module.css`

样式要点：
1. 对话框：居中、圆角、阴影，与现有 AboutDialog 风格一致
2. 拖拽区域：虚线边框、hover/active 状态变化
3. 进度条：蓝色渐变、动画
4. 预览区域：浅灰背景、滚动、失败段落红色高亮
5. 按钮：主按钮蓝色、次按钮灰色，与现有按钮风格一致

## 文件清单

| 操作 | 文件路径 | 说明 |
|------|---------|------|
| 新建 | `apps/web/src/components/MarkdownUploadDialog/index.tsx` | 主组件 |
| 新建 | `apps/web/src/components/MarkdownUploadDialog/MarkdownUploadDialog.module.css` | 样式 |
| 修改 | `apps/web/src/pages/DocList/index.tsx` | 添加上传按钮 + 拖拽支持 |
| 修改 | `apps/web/src/pages/Doc/index.tsx` | 添加待写入 blocks 逻辑 |
| 修改 | `apps/web/src/pages/DocList/DocList.module.css` | 拖拽覆盖层样式 |

## 技术约束实现

| 约束 | 实现方式 |
|------|---------|
| 不依赖后端数据库 | `markdownToBlocks` 纯前端解析 |
| 支持标题/列表/代码块/链接/图片/表格/引用块 | remark + remarkGfm 解析引擎已支持 |
| 图片转存到内置图床 | 下载 → `srv.uploadFile` → 替换 URL |
| 保留原文结构 | `replaceBlocks` 直接写入，不做改写 |
| 上传进度条 | FileReader `onprogress` 事件 |
| 解析失败高亮 | try-catch 包裹每个 Block 解析，失败段落标红 |
| 文件格式校验 | 检查 `.md` 扩展名 |
| 文件大小限制 | `file.size > 5 * 1024 * 1024` 校验 |

## 错误处理

| 场景 | 提示信息 | 处理方式 |
|------|---------|---------|
| 非 .md 文件 | "仅支持 .md 格式文件" | 拒绝上传，停留在选择步骤 |
| 文件 > 5MB | "文件大小超过限制（最大 5 MB）" | 拒绝上传，停留在选择步骤 |
| 文件读取失败 | "文件读取失败，请重试" | 回到选择步骤 |
| Markdown 解析部分失败 | 保留可解析部分，高亮失败段落 | 允许用户确认生成（仅写入成功部分） |
| 页面创建失败 | "文档创建失败：{错误原因}" | 停留在预览步骤 |
| 编辑器写入失败 | "内容写入失败，请手动粘贴" | 提示用户手动操作 |
