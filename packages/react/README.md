# @lcw-doc/react

LcwDoc 编辑器的 React 集成包，提供 React 组件、Hooks 和 UI 控制器。

## 目录

- [架构概述](#架构概述)
- [主要组件](#主要组件)
- [Hooks](#hooks)
- [UI 组件系统](#ui-组件系统)
- [与 Core 包的集成](#与-core-包的集成)
- [Schema 渲染](#schema-渲染)

## 架构概述

React 包是 Core 包的 React 绑定层，负责：

1. 将 Core 编辑器实例与 React 组件树连接
2. 提供声明式的 UI 组件
3. 管理 UI 状态（工具栏、菜单等）
4. 处理用户交互

```
┌─────────────────────────────────────────────────────────────┐
│                    React 组件层                              │
│  ┌──────────────┬──────────────┬──────────────┐              │
│  │  LcwDocView  │  工具栏组件   │   菜单组件    │              │
│  └──────────────┴──────────────┴──────────────┘              │
├─────────────────────────────────────────────────────────────┤
│                    Hooks 层                                  │
│  ┌──────────────┬──────────────┬──────────────┐              │
│  │useLcwDocEditor│ useSelected │  useActive   │              │
│  └──────────────┴──────────────┴──────────────┘              │
├─────────────────────────────────────────────────────────────┤
│                    Core 绑定层                               │
│  ┌──────────────┬──────────────┬──────────────┐              │
│  │EditorContent │ElementRenderer│  Context    │              │
│  └──────────────┴──────────────┴──────────────┘              │
├─────────────────────────────────────────────────────────────┤
│                    @lcw-doc/core                             │
│                    LcwDocEditor 实例                         │
└─────────────────────────────────────────────────────────────┘
```

## 主要组件

### LcwDocView

编辑器的主视图组件，提供完整的编辑器 UI。

```tsx
import { LcwDocView } from '@lcw-doc/react';
import { useLcwDocEditor } from '@lcw-doc/react';

function MyEditor() {
  const editor = useLcwDocEditor({
    initialContent: [
      { type: 'paragraph', content: 'Hello World' }
    ]
  });

  return (
    <LcwDocView 
      editor={editor}
      theme="light"
      editable={true}
      formattingToolbar={true}
      linkToolbar={true}
      slashMenu={true}
      emojiPicker={true}
      sideMenu={true}
      filePanel={true}
      tableHandles={true}
    />
  );
}
```

**属性：**

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `editor` | `LcwDocEditor` | 必填 | 编辑器实例 |
| `theme` | `'light' \| 'dark'` | - | 主题 |
| `editable` | `boolean` | `true` | 是否可编辑 |
| `formattingToolbar` | `boolean` | `true` | 显示格式化工具栏 |
| `linkToolbar` | `boolean` | `true` | 显示链接工具栏 |
| `slashMenu` | `boolean` | `true` | 显示斜杠菜单 |
| `emojiPicker` | `boolean` | `true` | 显示表情选择器 |
| `sideMenu` | `boolean` | `true` | 显示侧边菜单 |
| `filePanel` | `boolean` | `true` | 显示文件面板 |
| `tableHandles` | `boolean` | `true` | 显示表格手柄 |

详见 [src/editor/LcwDocView.tsx](src/editor/LcwDocView.tsx)

### EditorContent

编辑器内容渲染组件，处理 ProseMirror 视图的挂载。

```tsx
import { EditorContent } from '@lcw-doc/react';

<EditorContent editor={editor}>
  {/* 子组件 */}
</EditorContent>
```

详见 [src/editor/EditorContent.tsx](src/editor/EditorContent.tsx)

### ElementRenderer

用于在编辑器外部渲染 React 元素的组件（如菜单、工具栏等）。

详见 [src/editor/ElementRenderer.tsx](src/editor/ElementRenderer.tsx)

## Hooks

### useLcwDocEditor

创建编辑器实例的 Hook。

```tsx
import { useLcwDocEditor } from '@lcw-doc/react';

const editor = useLcwDocEditor({
  // 初始内容
  initialContent: [],
  // 是否可编辑
  editable: true,
  // 占位符
  placeholders: {
    default: '输入内容...'
  },
  // 上传配置
  uploadFile: async (file) => {
    // 上传文件并返回 URL
    return 'https://example.com/file.png';
  }
});
```

详见 [src/hooks/useLcwDocEditor.ts](src/hooks/useLcwDocEditor.ts)

### useCreateLcwDoc

另一种创建编辑器的方式，支持更多配置选项。

详见 [src/hooks/useCreateLcwDoc.tsx](src/hooks/useCreateLcwDoc.tsx)

### useSelectedBlocks

获取当前选中的块。

```tsx
import { useSelectedBlocks } from '@lcw-doc/react';

const selectedBlocks = useSelectedBlocks(editor);
```

详见 [src/hooks/useSelectedBlocks.ts](src/hooks/useSelectedBlocks.ts)

### useActiveStyles

获取当前选区的活动样式。

```tsx
import { useActiveStyles } from '@lcw-doc/react';

const activeStyles = useActiveStyles(editor);
// { bold: true, italic: false, ... }
```

详见 [src/hooks/useActiveStyles.ts](src/hooks/useActiveStyles.ts)

### 其他 Hooks

| Hook | 路径 | 说明 |
|------|------|------|
| `useEditorChange` | [src/hooks/useEditorChange.ts](src/hooks/useEditorChange.ts) | 监听编辑器内容变化 |
| `useEditorSelectionChange` | [src/hooks/useEditorSelectionChange.ts](src/hooks/useEditorSelectionChange.ts) | 监听选区变化 |
| `useEditorContentOrSelectionChange` | [src/hooks/useEditorContentOrSelectionChange.ts](src/hooks/useEditorContentOrSelectionChange.ts) | 监听内容或选区变化 |
| `useEditorForceUpdate` | [src/hooks/useEditorForceUpdate.tsx](src/hooks/useEditorForceUpdate.tsx) | 强制更新编辑器 |
| `usePrefersColorScheme` | [src/hooks/usePrefersColorScheme.ts](src/hooks/usePrefersColorScheme.ts) | 获取系统颜色主题 |
| `useUploadLoading` | [src/hooks/useUploadLoading.ts](src/hooks/useUploadLoading.ts) | 上传状态管理 |
| `useOnUploadStart` | [src/hooks/useOnUploadStart.ts](src/hooks/useOnUploadStart.ts) | 上传开始监听 |
| `useOnUploadEnd` | [src/hooks/useOnUploadEnd.ts](src/hooks/useOnUploadEnd.ts) | 上传结束监听 |
| `useUIElementPositioning` | [src/hooks/useUIElementPositioning.ts](src/hooks/useUIElementPositioning.ts) | UI 元素定位 |
| `useUIPluginState` | [src/hooks/useUIPluginState.ts](src/hooks/useUIPluginState.ts) | UI 插件状态 |

## UI 组件系统

### FormattingToolbar（格式化工具栏）

提供文本格式化功能的工具栏。

```tsx
import { FormattingToolbar } from '@lcw-doc/react';

<FormattingToolbar editor={editor}>
  <BasicTextStyleButton editor={editor} basicTextStyle="bold" />
  <BasicTextStyleButton editor={editor} basicTextStyle="italic" />
  <CreateLinkButton editor={editor} />
</FormattingToolbar>
```

**组件位置：** [src/components/FormattingToolbar](src/components/FormattingToolbar)

**内置按钮：**

| 按钮 | 路径 | 说明 |
|------|------|------|
| BasicTextStyleButton | [DefaultButtons/BasicTextStyleButton.tsx](src/components/FormattingToolbar/DefaultButtons/BasicTextStyleButton.tsx) | 基础文本样式（粗体、斜体等）|
| ColorStyleButton | [DefaultButtons/ColorStyleButton.tsx](src/components/FormattingToolbar/DefaultButtons/ColorStyleButton.tsx) | 颜色样式 |
| CreateLinkButton | [DefaultButtons/CreateLinkButton.tsx](src/components/FormattingToolbar/DefaultButtons/CreateLinkButton.tsx) | 创建链接 |
| TextAlignButton | [DefaultButtons/TextAlignButton.tsx](src/components/FormattingToolbar/DefaultButtons/TextAlignButton.tsx) | 文本对齐 |
| BlockTypeSelect | [DefaultSelects/BlockTypeSelect.tsx](src/components/FormattingToolbar/DefaultSelects/BlockTypeSelect.tsx) | 块类型选择 |

### LinkToolbar（链接工具栏）

链接编辑工具栏。

**组件位置：** [src/components/LinkToolbar](src/components/LinkToolbar)

### SideMenu（侧边菜单）

块级操作的侧边菜单。

```tsx
import { SideMenu, SideMenuButton } from '@lcw-doc/react';

<SideMenu editor={editor}>
  <SideMenuButton editor={editor} />
</SideMenu>
```

**组件位置：** [src/components/SideMenu](src/components/SideMenu)

### SuggestionMenu（建议菜单）

斜杠命令菜单和表情选择器。

```tsx
import { SuggestionMenu } from '@lcw-doc/react';

<SuggestionMenu editor={editor} />
```

**组件位置：** [src/components/SuggestionMenu](src/components/SuggestionMenu)

**子组件：**

| 组件 | 路径 | 说明 |
|------|------|------|
| SuggestionMenu | [SuggestionMenu.tsx](src/components/SuggestionMenu/SuggestionMenu.tsx) | 建议菜单 |
| GridSuggestionMenu | [GridSuggestionMenu](src/components/SuggestionMenu/GridSuggestionMenu) | 网格建议菜单（表情选择器）|

### FilePanel（文件面板）

文件上传和嵌入面板。

**组件位置：** [src/components/FilePanel](src/components/FilePanel)

### TableHandles（表格手柄）

表格操作手柄。

**组件位置：** [src/components/TableHandles](src/components/TableHandles)

### ColorPicker（颜色选择器）

颜色选择组件。

**组件位置：** [src/components/ColorPicker](src/components/ColorPicker)

## 与 Core 包的集成

### Context 系统

React 包使用 Context 传递编辑器实例：

```tsx
import { LcwDocContext, useLcwDocEditor } from '@lcw-doc/react';

// 在 LcwDocView 中提供 Context
<LcwDocContext.Provider value={editor}>
  {children}
</LcwDocContext.Provider>

// 在子组件中使用
const editor = useLcwDocEditor();
```

详见 [src/editor/LcwDocContext.ts](src/editor/LcwDocContext.ts)

### ComponentsContext

用于自定义 UI 组件的 Context：

```tsx
import { ComponentsContext } from '@lcw-doc/react';

// 提供自定义组件
<ComponentsContext.Provider value={{
  FormattingToolbar: MyFormattingToolbar,
  LinkToolbar: MyLinkToolbar,
  // ...
}}>
  <LcwDocView editor={editor} />
</ComponentsContext.Provider>
```

详见 [src/editor/ComponentsContext.tsx](src/editor/ComponentsContext.tsx)

## Schema 渲染

React 包负责将 Core 包的 Schema 渲染为 React 组件。

### Block 渲染

```tsx
import { createReactBlockSpec } from '@lcw-doc/react';

const CustomBlock = createReactBlockSpec({
  type: 'customBlock',
  propSchema: {
    title: { default: '' }
  },
  content: 'inline',
  
  render: ({ block, editor, contentRef }) => (
    <div className="custom-block">
      <h3>{block.props.title}</h3>
      <div ref={contentRef} />
    </div>
  )
});
```

详见 [src/schema/ReactBlockSpec.tsx](src/schema/ReactBlockSpec.tsx)

### InlineContent 渲染

详见 [src/schema/ReactInlineContentSpec.tsx](src/schema/ReactInlineContentSpec.tsx)

### Style 渲染

详见 [src/schema/ReactStyleSpec.tsx](src/schema/ReactStyleSpec.tsx)

## 块内容组件

React 包提供了内置块类型的渲染组件：

| 块类型 | 组件路径 |
|--------|----------|
| Image | [src/blocks/ImageBlockContent](src/blocks/ImageBlockContent) |
| Video | [src/blocks/VideoBlockContent](src/blocks/VideoBlockContent) |
| Audio | [src/blocks/AudioBlockContent](src/blocks/AudioBlockContent) |
| File | [src/blocks/FileBlockContent](src/blocks/FileBlockContent) |

## 相关链接

- [Core 包文档](../core/README.md)
- [Shadcn 包文档](../shadcn/README.md)
