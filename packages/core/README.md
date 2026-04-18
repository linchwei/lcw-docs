# @lcw-doc/core

LcwDoc 编辑器的核心包，基于 ProseMirror 和 Tiptap 构建的块级富文本编辑器引擎。

## 目录

- [架构概述](#架构概述)
- [核心概念](#核心概念)
- [API 文档](#api-文档)
- [扩展系统](#扩展系统)
- [核心模块](#核心模块)
- [测试](#测试)

## 架构概述

LcwDoc Core 是一个基于 ProseMirror 的块级编辑器引擎，采用分层架构设计：

```
┌─────────────────────────────────────────────────────────────┐
│                     应用层 (React/Vue)                        │
├─────────────────────────────────────────────────────────────┤
│                    LcwDocEditor 类                           │
│  ┌──────────────┬──────────────┬──────────────┐              │
│  │   Block API  │  Inline API  │  Style API   │              │
│  └──────────────┴──────────────┴──────────────┘              │
├─────────────────────────────────────────────────────────────┤
│                    ProseMirror 层                            │
│  ┌──────────────┬──────────────┬──────────────┐              │
│  │    Schema    │  Transaction │   Plugins    │              │
│  └──────────────┴──────────────┴──────────────┘              │
├─────────────────────────────────────────────────────────────┤
│                    Tiptap 层                                 │
│  ┌──────────────┬──────────────┬──────────────┐              │
│  │  Extensions  │   Commands   │   Keymaps    │              │
│  └──────────────┴──────────────┴──────────────┘              │
└─────────────────────────────────────────────────────────────┘
```

### 技术栈

- **ProseMirror**: 底层文档模型和编辑引擎
- **Tiptap**: 基于 ProseMirror 的扩展框架
- **Yjs**: 协同编辑支持（可选）

## 核心概念

### Block（块）

块是编辑器中的基本内容单元，每个块代表一个独立的可编辑区域。

```typescript
// 块的基本结构
interface Block {
  id: string;           // 唯一标识符
  type: string;         // 块类型（paragraph、heading、listItem 等）
  props: Record<string, any>;  // 块属性
  content: InlineContent[] | TableContent;  // 块内容
  children: Block[];    // 嵌套子块
}
```

**内置块类型：**

| 块类型 | 文件路径 | 说明 |
|--------|----------|------|
| Paragraph | [src/blocks/ParagraphBlockContent](src/blocks/ParagraphBlockContent) | 段落块 |
| Heading | [src/blocks/HeadingBlockContent](src/blocks/HeadingBlockContent) | 标题块（H1-H6）|
| Bullet List | [src/blocks/ListItemBlockContent/BulletListItemBlockContent](src/blocks/ListItemBlockContent/BulletListItemBlockContent) | 无序列表 |
| Numbered List | [src/blocks/ListItemBlockContent/NumberedListItemBlockContent](src/blocks/ListItemBlockContent/NumberedListItemBlockContent) | 有序列表 |
| Check List | [src/blocks/ListItemBlockContent/CheckListItemBlockContent](src/blocks/ListItemBlockContent/CheckListItemBlockContent) | 待办列表 |
| Image | [src/blocks/ImageBlockContent](src/blocks/ImageBlockContent) | 图片块 |
| Video | [src/blocks/VideoBlockContent](src/blocks/VideoBlockContent) | 视频块 |
| Audio | [src/blocks/AudioBlockContent](src/blocks/AudioBlockContent) | 音频块 |
| File | [src/blocks/FileBlockContent](src/blocks/FileBlockContent) | 文件块 |
| Table | [src/blocks/TableBlockContent](src/blocks/TableBlockContent) | 表格块 |
| Code | [src/blocks/CodeBlockContent](src/blocks/CodeBlockContent) | 代码块 |

### InlineContent（行内内容）

行内内容表示块内的文本和样式标记。

```typescript
// 行内内容类型
interface InlineContent {
  type: 'text' | 'link' | 'mention';
  text: string;
  styles?: Style[];
}
```

### Style（样式）

样式用于标记行内内容的格式。

```typescript
// 样式类型
interface Style {
  type: string;         // 样式类型（bold、italic、color 等）
  props?: Record<string, any>;  // 样式属性
}
```

**内置样式：**

| 样式 | 文件路径 | 说明 |
|------|----------|------|
| Bold | Tiptap 内置 | 粗体 |
| Italic | Tiptap 内置 | 斜体 |
| Underline | Tiptap 内置 | 下划线 |
| Strikethrough | Tiptap 内置 | 删除线 |
| Text Color | [src/extensions/TextColor](src/extensions/TextColor) | 文字颜色 |
| Background Color | [src/extensions/BackgroundColor](src/extensions/BackgroundColor) | 背景颜色 |
| Text Alignment | [src/extensions/TextAlignment](src/extensions/TextAlignment) | 文本对齐 |

## API 文档

### LcwDocEditor 类

编辑器的核心类，提供完整的编辑功能。

```typescript
import { LcwDocEditor } from '@lcw-doc/core';

const editor = new LcwDocEditor({
  // 初始内容
  initialContent: [
    {
      type: 'paragraph',
      content: 'Hello World'
    }
  ],
  // 是否可编辑
  editable: true,
  // 是否开启协同编辑
  collaboration: false,
  // 占位符
  placeholders: {
    default: '输入内容...',
    heading: '标题'
  }
});
```

#### 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `isEditable` | `boolean` | 编辑器是否可编辑 |
| `mount` | `HTMLElement` | 编辑器挂载的元素 |
| `document` | `Block[]` | 当前文档内容 |
| `selection` | `Selection` | 当前选区 |

#### 方法

##### 块操作

```typescript
// 插入块
editor.insertBlocks(
  [{ type: 'paragraph', content: '新段落' }],
  referenceBlockId,
  'after' // 'before' | 'after' | 'nested'
);

// 更新块
editor.updateBlock(blockId, {
  type: 'heading',
  props: { level: 2 }
});

// 删除块
editor.removeBlocks([blockId1, blockId2]);

// 移动块
editor.moveBlock(blockId, targetBlockId, 'after');
```

详见 [src/api/blockManipulation](src/api/blockManipulation)

##### 选区操作

```typescript
// 获取当前选区
const selection = editor.getSelection();

// 设置选区
editor.setSelection({
  blockId: 'block-id',
  index: 0,
  length: 5
});

// 监听选区变化
editor.onSelectionChange(() => {
  console.log('选区已变化');
});
```

详见 [src/api/blockManipulation/selections](src/api/blockManipulation/selections)

##### 事件监听

```typescript
// 内容变化
editor.onChange(() => {
  console.log('内容已变化');
});

// 选区变化
editor.onSelectionChange(() => {
  console.log('选区已变化');
});
```

### Schema API

Schema 定义了编辑器的文档结构。

```typescript
import { BlockSchema, InlineContentSchema, StyleSchema } from '@lcw-doc/core';

// 定义块 Schema
interface MyBlockSchema extends BlockSchema {
  paragraph: {
    props: {};
  };
  heading: {
    props: { level: 1 | 2 | 3 };
  };
}
```

详见 [src/schema](src/schema)

## 扩展系统

### 创建自定义块

```typescript
import { createBlockSpec } from '@lcw-doc/core';

const CustomBlock = createBlockSpec({
  type: 'customBlock',
  propSchema: {
    // 定义属性
    title: {
      default: '默认标题'
    }
  },
  content: 'inline', // 'inline' | 'none' | 'table'
  
  // 渲染函数（React/Vue 中实现）
  render: ({ block, editor }) => {
    return {
      dom: document.createElement('div'),
      contentDOM: document.createElement('span')
    };
  }
});
```

详见 [src/schema/blocks/createSpec.ts](src/schema/blocks/createSpec.ts)

### 创建自定义样式

```typescript
import { createStyleSpec } from '@lcw-doc/core';

const Highlight = createStyleSpec({
  type: 'highlight',
  propSchema: {
    color: {
      default: 'yellow'
    }
  }
});
```

详见 [src/schema/styles/createSpec.ts](src/schema/styles/createSpec.ts)

### 创建自定义扩展

```typescript
import { Extension } from '@tiptap/core';

const MyExtension = Extension.create({
  name: 'myExtension',
  
  addProseMirrorPlugins() {
    return [
      // ProseMirror 插件
    ];
  },
  
  addKeyboardShortcuts() {
    return {
      'Mod-s': () => {
        // 保存快捷键
        return true;
      }
    };
  }
});
```

## 核心模块

### api

提供编辑器操作的 API。

| 模块 | 路径 | 说明 |
|------|------|------|
| Block Manipulation | [src/api/blockManipulation](src/api/blockManipulation) | 块的增删改查操作 |
| Clipboard | [src/api/clipboard](src/api/clipboard) | 复制粘贴处理 |
| Exporters | [src/api/exporters](src/api/exporters) | HTML/Markdown 导出 |
| Parsers | [src/api/parsers](src/api/parsers) | HTML/Markdown 解析 |

### blocks

内置块类型的实现。

详见 [src/blocks](src/blocks)

### editor

编辑器核心类。

| 文件 | 说明 |
|------|------|
| [LcwDocEditor.ts](src/editor/LcwDocEditor.ts) | 编辑器主类 |
| [LcwDocExtensions.ts](src/editor/LcwDocExtensions.ts) | 内置扩展集合 |
| [LcwDocSchema.ts](src/editor/LcwDocSchema.ts) | Schema 定义 |
| [LcwDocTipTapEditor.ts](src/editor/LcwDocTipTapEditor.ts) | Tiptap 编辑器封装 |

### extensions

内置扩展功能。

| 扩展 | 路径 | 说明 |
|------|------|------|
| FormattingToolbar | [src/extensions/FormattingToolbar](src/extensions/FormattingToolbar) | 格式化工具栏 |
| LinkToolbar | [src/extensions/LinkToolbar](src/extensions/LinkToolbar) | 链接工具栏 |
| SideMenu | [src/extensions/SideMenu](src/extensions/SideMenu) | 侧边菜单 |
| SuggestionMenu | [src/extensions/SuggestionMenu](src/extensions/SuggestionMenu) | 建议菜单（Slash 命令）|
| TableHandles | [src/extensions/TableHandles](src/extensions/TableHandles) | 表格操作手柄 |
| Placeholder | [src/extensions/Placeholder](src/extensions/Placeholder) | 占位符 |
| KeyboardShortcuts | [src/extensions/KeyboardShortcuts](src/extensions/KeyboardShortcuts) | 键盘快捷键 |

### schema

Schema 类型定义和创建工具。

| 模块 | 路径 | 说明 |
|------|------|------|
| Blocks | [src/schema/blocks](src/schema/blocks) | 块 Schema |
| InlineContent | [src/schema/inlineContent](src/schema/inlineContent) | 行内内容 Schema |
| Styles | [src/schema/styles](src/schema/styles) | 样式 Schema |

### pm-nodes

ProseMirror 节点定义。

| 文件 | 说明 |
|------|------|
| [BlockContainer.ts](src/pm-nodes/BlockContainer.ts) | 块容器节点 |
| [BlockGroup.ts](src/pm-nodes/BlockGroup.ts) | 块组节点 |
| [Doc.ts](src/pm-nodes/Doc.ts) | 文档根节点 |

### util

工具函数。

| 文件 | 说明 |
|------|------|
| [EventEmitter.ts](src/util/EventEmitter.ts) | 事件发射器 |
| [browser.ts](src/util/browser.ts) | 浏览器检测 |
| [string.ts](src/util/string.ts) | 字符串工具 |

## 测试

测试使用 Vitest 框架。

```bash
# 运行测试
pnpm test

# 运行测试（带覆盖率）
pnpm test:coverage
```

测试文件位于 [tests](tests) 目录。

| 测试类别 | 路径 |
|----------|------|
| API 测试 | [tests/api](tests/api) |
| 块测试 | [tests/blocks](tests/blocks) |
| 编辑器测试 | [tests/editor](tests/editor) |
| 扩展测试 | [tests/extensions](tests/extensions) |
| Schema 测试 | [tests/schema](tests/schema) |
| 工具测试 | [tests/util](tests/util) |

## 相关链接

- [React 包文档](../react/README.md)
- [Shadcn 包文档](../shadcn/README.md)
