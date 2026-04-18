# 增强编辑器 Spec

## Why
当前编辑器虽然核心能力强大（基于 TipTap/ProseMirror，支持 11 种内置块、协作编辑、AI 集成），但实际使用体验过于简单：AI 块仅是静态占位符、AI 聊天面板不支持流式输出、文件上传功能未配置、缺少常用块类型（引用块、分割线、提示框）。需要增强编辑器使其更加智能好用。

## What Changes
- 增强 AI 块：从静态占位符升级为支持流式输出、加载状态、操作按钮的智能块
- 启用 AI 流式输出：将 BasicAIChatPanel 从 blocking 模式改为 SSE streaming 模式，实现逐字渲染
- 配置文件上传：后端新增上传端点，前端配置 `uploadFile`/`resolveFileUrl`，激活图片/视频/音频/文件块
- 新增引用块（Blockquote）：支持 Markdown `>` 输入规则和斜杠菜单插入
- 新增分割线（Divider）：支持 `---` 输入规则和斜杠菜单插入
- 新增提示框（Callout）：支持多种类型（info/warning/error/success），斜杠菜单插入
- 优化 Mention 组件：将 title/icon 缓存到 props，避免额外查询
- AI API 安全：将硬编码的 API Key 移至后端代理

## Impact
- Affected specs: 编辑器核心能力、AI 集成、文件上传
- Affected code:
  - `apps/web/src/blocks/ai/ai.tsx` - AI 块渲染
  - `apps/web/src/components/BasicAIChat/BasicAIChatPanel.tsx` - AI 聊天面板
  - `apps/web/src/components/BasicAIChat/index.tsx` - AI 聊天容器
  - `apps/web/src/pages/Doc/DocEditor.tsx` - 编辑器配置
  - `apps/web/src/blocks/mention/mention.tsx` - Mention 内联内容
  - `apps/web/src/blocks/mention/MentionContent.tsx` - Mention 渲染
  - `apps/server/src/` - 后端上传端点和 AI 代理端点
  - `apps/web/src/services/` - 前端上传和 AI API 函数

## ADDED Requirements

### Requirement: AI 流式输出块
系统 SHALL 提供增强的 AI 块，支持流式输出、加载状态和操作按钮。

#### Scenario: 用户通过斜杠菜单插入 AI 块
- **WHEN** 用户在斜杠菜单中选择 "AI" 项
- **THEN** 在光标位置插入一个 AI 块，显示输入框和提示文字

#### Scenario: AI 正在生成内容
- **WHEN** 用户输入提示并发送
- **THEN** AI 块显示加载动画，随后以流式方式逐字显示生成的内容

#### Scenario: AI 生成完成
- **WHEN** AI 完成内容生成
- **THEN** AI 块显示操作按钮（接受/重新生成/丢弃），用户点击"接受"后将内容转为普通块

#### Scenario: AI 生成失败
- **WHEN** AI 请求出错
- **THEN** AI 块显示错误提示和重试按钮

### Requirement: AI 聊天面板流式输出
系统 SHALL 将 BasicAIChatPanel 从 blocking 模式升级为 SSE streaming 模式。

#### Scenario: 用户在 AI 聊天面板发送消息
- **WHEN** 用户输入提示并按 Enter
- **THEN** 面板以流式方式逐字显示 AI 响应，用户可实时看到生成过程

#### Scenario: 用户取消 AI 生成
- **WHEN** AI 正在生成内容时用户点击取消按钮
- **THEN** 立即中止请求，保留已生成的内容

### Requirement: 文件上传功能
系统 SHALL 支持图片、视频、音频和文件的上传与嵌入。

#### Scenario: 用户通过文件面板上传文件
- **WHEN** 用户在斜杠菜单中选择图片/视频/音频/文件，然后上传本地文件
- **THEN** 文件上传到服务器，在编辑器中显示对应的媒体块

#### Scenario: 用户拖放文件到编辑器
- **WHEN** 用户将文件拖放到编辑器区域
- **THEN** 根据文件类型自动创建对应的媒体块并上传文件

#### Scenario: 用户粘贴图片到编辑器
- **WHEN** 用户从剪贴板粘贴图片
- **THEN** 自动创建图片块并上传图片

#### Scenario: 用户通过 URL 嵌入媒体
- **WHEN** 用户在文件面板中选择"嵌入"标签页并输入 URL
- **THEN** 根据类型创建对应的媒体块并显示内容

### Requirement: 引用块（Blockquote）
系统 SHALL 提供引用块类型，支持 Markdown 输入规则。

#### Scenario: 用户通过输入规则创建引用块
- **WHEN** 用户在新行输入 `>` 后跟空格
- **THEN** 当前段落转为引用块

#### Scenario: 用户通过斜杠菜单插入引用块
- **WHEN** 用户在斜杠菜单中选择"引用"
- **THEN** 在光标位置插入引用块

### Requirement: 分割线（Divider）
系统 SHALL 提供分割线块类型，支持 Markdown 输入规则。

#### Scenario: 用户通过输入规则创建分割线
- **WHEN** 用户在新行输入 `---` 后按 Enter
- **THEN** 插入一条水平分割线

#### Scenario: 用户通过斜杠菜单插入分割线
- **WHEN** 用户在斜杠菜单中选择"分割线"
- **THEN** 在光标位置插入分割线

### Requirement: 提示框（Callout）
系统 SHALL 提供提示框块类型，支持多种类型（info/warning/error/success）。

#### Scenario: 用户通过斜杠菜单插入提示框
- **WHEN** 用户在斜杠菜单中选择"提示框"
- **THEN** 在光标位置插入默认 info 类型的提示框

#### Scenario: 用户切换提示框类型
- **WHEN** 用户点击提示框的类型图标
- **THEN** 弹出类型选择菜单，可选择 info/warning/error/success

### Requirement: AI API 后端代理
系统 SHALL 通过后端代理转发 AI API 请求，避免前端暴露 API Key。

#### Scenario: 前端请求 AI 服务
- **WHEN** 前端发送 AI 聊天请求
- **THEN** 请求发送到后端代理端点，后端将 API Key 注入后转发到 Dify API

### Requirement: Mention 属性缓存
系统 SHALL 将 Mention 的 title 和 icon 缓存到 props 中，避免每次渲染时额外查询。

#### Scenario: 插入 Mention
- **WHEN** 用户通过 @ 菜单选择页面
- **THEN** Mention 的 props 中包含 id、title、icon，渲染时无需额外 API 请求

### Requirement: React 19 contentRef 兼容性修复
系统 SHALL 修复 `createReactBlockSpec` 和 `createReactInlineContentSpec` 中 `contentRef` 提取方式，使其兼容 React 19。

#### Scenario: 在 React 19 环境下使用自定义块
- **WHEN** 使用 `createReactBlockSpec` 创建 `content: 'inline'` 的自定义块
- **THEN** `contentRef` 正确传递给自定义渲染函数，ProseMirror 能将内联内容渲染到 contentRef 绑定的 DOM 元素中

#### Scenario: 在 React 19 环境下使用自定义内联内容
- **WHEN** 使用 `createReactInlineContentSpec` 创建 `content: 'styled'` 的自定义内联内容
- **THEN** `contentRef` 正确传递给自定义渲染函数，ProseMirror 能将内联内容渲染到 contentRef 绑定的 DOM 元素中

### Requirement: 格式化工具栏引用选项
系统 SHALL 在格式化工具栏的 BlockTypeSelect 中添加"引用"选项。

#### Scenario: 用户通过格式化工具栏切换为引用块
- **WHEN** 用户选中段落文本，在格式化工具栏中选择"引用"
- **THEN** 选中的段落转为引用块

## MODIFIED Requirements

### Requirement: 编辑器核心包 contentRef 机制
编辑器核心包中 `createReactBlockSpec` 和 `createReactInlineContentSpec` 的 `addNodeView` 方法需改用 `useReactNodeView()` 获取 `nodeViewContentRef`，而非从 JSX 元素提取 `.ref`。

原实现：
```typescript
const ref = (NodeViewContent({}) as any).ref
```

新实现：
```typescript
const { nodeViewContentRef } = useReactNodeView()
```

**关键类型修复**：`useReactNodeView()` 返回 `Partial<ReactNodeViewContextProps>`，因此 `nodeViewContentRef` 可能为 `undefined`。需使用非空断言 `!` 或空值合并 `?? (() => {})` 确保类型安全：

```typescript
const { nodeViewContentRef: ref } = useReactNodeView()
<BlockContent contentRef={ref!} />
```

### Requirement: BlockTypeSelect 图标导入修复
`BlockTypeSelect.tsx` 中引用的 `RiDoubleQuotes` 在 `react-icons/ri` 中不存在，需改为 `RiDoubleQuotesR`。

原导入：
```typescript
import { RiDoubleQuotes, ... } from 'react-icons/ri'
```

新导入：
```typescript
import { RiDoubleQuotesR, ... } from 'react-icons/ri'
```

### Requirement: 编辑器 Schema
编辑器 Schema 需扩展以包含新的块类型。

原 Schema：
```typescript
const schema = LcwDocSchema.create({
    inlineContentSpecs: { ...defaultInlineContentSpecs, mention: Mention },
    blockSpecs: { ...defaultBlockSpecs, ai: AI },
})
```

新 Schema：
```typescript
const schema = LcwDocSchema.create({
    inlineContentSpecs: { ...defaultInlineContentSpecs, mention: Mention },
    blockSpecs: { ...defaultBlockSpecs, ai: AI, blockquote: Blockquote, divider: Divider, callout: Callout },
})
```

### Requirement: 斜杠菜单项
斜杠菜单需新增引用块、分割线、提示框的插入项。

原菜单项：`[insertAI(editor), ...getDefaultReactSlashMenuItems(editor)]`
新菜单项：`[insertAI(editor), insertBlockquote(editor), insertDivider(editor), insertCallout(editor), ...getDefaultReactSlashMenuItems(editor)]`
