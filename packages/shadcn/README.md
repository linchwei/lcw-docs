# @lcw-doc/shadcn

基于 shadcn/ui 的 LcwDoc 编辑器 UI 实现包，提供美观、可访问的编辑器界面组件。

## 目录

- [架构概述](#架构概述)
- [组件映射关系](#组件映射关系)
- [主题系统](#主题系统)
- [UI 组件](#ui-组件)
- [使用示例](#使用示例)

## 架构概述

Shadcn 包是 React 包的 UI 实现层，使用 [shadcn/ui](https://ui.shadcn.com/) 组件库构建：

```
┌─────────────────────────────────────────────────────────────┐
│                    Shadcn UI 层                              │
│  ┌──────────────┬──────────────┬──────────────┐              │
│  │    Menu      │    Panel     │  Suggestion  │              │
│  └──────────────┴──────────────┴──────────────┘              │
├─────────────────────────────────────────────────────────────┤
│                    @lcw-doc/react                            │
│  ┌──────────────┬──────────────┬──────────────┐              │
│  │  组件接口    │   Hooks      │   Context    │              │
│  └──────────────┴──────────────┴──────────────┘              │
├─────────────────────────────────────────────────────────────┤
│                    @lcw-doc/core                             │
│                    LcwDocEditor 实例                         │
└─────────────────────────────────────────────────────────────┘
```

### 技术栈

- **React 19**: UI 框架
- **shadcn/ui**: 基础 UI 组件库
- **Radix UI**: 无头 UI 组件原语
- **Tailwind CSS**: 样式系统
- **Lucide React**: 图标库

## 组件映射关系

Shadcn 包实现了 React 包定义的所有 UI 组件接口：

| React 组件接口 | Shadcn 实现 | 文件路径 |
|----------------|-------------|----------|
| `Menu` | `Menu` | [src/menu/Menu.tsx](src/menu/Menu.tsx) |
| `Panel` | `Panel` | [src/panel/Panel.tsx](src/panel/Panel.tsx) |
| `SuggestionMenu` | `SuggestionMenu` | [src/suggestionMenu/SuggestionMenu.tsx](src/suggestionMenu/SuggestionMenu.tsx) |
| `SideMenu` | `SideMenu` | [src/sideMenu/SideMenu.tsx](src/sideMenu/SideMenu.tsx) |
| `Toolbar` | `Toolbar` | [src/toolbar/Toolbar.tsx](src/toolbar/Toolbar.tsx) |
| `TableHandle` | `TableHandle` | [src/tableHandle/TableHandle.tsx](src/tableHandle/TableHandle.tsx) |
| `Popover` | `Popover` | [src/popover/popover.tsx](src/popover/popover.tsx) |
| `Form` | `Form` | [src/form/Form.tsx](src/form/Form.tsx) |

## 主题系统

### 主题配置

Shadcn 包支持 light 和 dark 两种主题模式：

```css
/* Light 主题（默认） */
.bn-shadcn {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --secondary: 210 40% 96.1%;
  /* ... */
}

/* Dark 主题 */
.bn-shadcn.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --primary: 210 40% 98%;
  --secondary: 217.2 32.6% 17.5%;
  /* ... */
}
```

详见 [src/style.css](src/style.css)

### 使用主题

```tsx
import { LcwDocView } from '@lcw-doc/react';
import { ShadCNComponentsContext } from '@lcw-doc/shadcn';

// 使用 light 主题
<LcwDocView editor={editor} theme="light" />

// 使用 dark 主题
<LcwDocView editor={editor} theme="dark" />
```

### CSS 变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `--background` | 背景色 | 白色/深色 |
| `--foreground` | 前景色（文字）| 深色/白色 |
| `--primary` | 主色调 | 深蓝/白色 |
| `--secondary` | 次色调 | 浅灰/深灰 |
| `--muted` | 静音色 | 浅灰/深灰 |
| `--accent` | 强调色 | 浅灰/深灰 |
| `--destructive` | 危险色 | 红色 |
| `--border` | 边框色 | 浅灰/深灰 |
| `--input` | 输入框边框 | 浅灰/深灰 |
| `--ring` | 焦点环 | 深蓝/浅蓝 |
| `--radius` | 圆角 | 0.5rem |

## UI 组件

### Menu（菜单）

下拉菜单组件，用于工具栏按钮等场景。

```tsx
import { Menu, MenuItem } from '@lcw-doc/shadcn';

<Menu>
  <MenuItem onClick={() => {}}>选项 1</MenuItem>
  <MenuItem onClick={() => {}}>选项 2</MenuItem>
</Menu>
```

**文件位置：**
- 主组件：[src/menu/Menu.tsx](src/menu/Menu.tsx)

### Panel（面板）

可复用的面板容器组件，包含以下子组件：

| 组件 | 路径 | 说明 |
|------|------|------|
| `Panel` | [src/panel/Panel.tsx](src/panel/Panel.tsx) | 面板容器 |
| `PanelButton` | [src/panel/PanelButton.tsx](src/panel/PanelButton.tsx) | 面板按钮 |
| `PanelTextInput` | [src/panel/PanelTextInput.tsx](src/panel/PanelTextInput.tsx) | 面板文本输入 |
| `PanelFileInput` | [src/panel/PanelFileInput.tsx](src/panel/PanelFileInput.tsx) | 面板文件输入 |
| `PanelTab` | [src/panel/PanelTab.tsx](src/panel/PanelTab.tsx) | 面板标签页 |

### SuggestionMenu（建议菜单）

斜杠命令菜单和表情选择器的实现。

| 组件 | 路径 | 说明 |
|------|------|------|
| `SuggestionMenu` | [src/suggestionMenu/SuggestionMenu.tsx](src/suggestionMenu/SuggestionMenu.tsx) | 建议菜单容器 |
| `SuggestionMenuItem` | [src/suggestionMenu/SuggestionMenuItem.tsx](src/suggestionMenu/SuggestionMenuItem.tsx) | 建议菜单项 |
| `SuggestionMenuEmptyItem` | [src/suggestionMenu/SuggestionMenuEmptyItem.tsx](src/suggestionMenu/SuggestionMenuEmptyItem.tsx) | 空状态 |
| `SuggestionMenuLabel` | [src/suggestionMenu/SuggestionMenuLabel.tsx](src/suggestionMenu/SuggestionMenuLabel.tsx) | 菜单标签 |
| `SuggestionMenuLoader` | [src/suggestionMenu/SuggestionMenuLoader.tsx](src/suggestionMenu/SuggestionMenuLoader.tsx) | 加载状态 |
| `GridSuggestionMenu` | [src/suggestionMenu/gridSuggestionMenu](src/suggestionMenu/gridSuggestionMenu) | 网格建议菜单（表情选择器）|

### SideMenu（侧边菜单）

块级操作的侧边菜单实现。

| 组件 | 路径 | 说明 |
|------|------|------|
| `SideMenu` | [src/sideMenu/SideMenu.tsx](src/sideMenu/SideMenu.tsx) | 侧边菜单容器 |
| `SideMenuButton` | [src/sideMenu/SideMenuButton.tsx](src/sideMenu/SideMenuButton.tsx) | 侧边菜单按钮 |

### Toolbar（工具栏）

格式化工具栏和链接工具栏的实现。

**文件位置：**
- [src/toolbar/Toolbar.tsx](src/toolbar/Toolbar.tsx)

### TableHandle（表格手柄）

表格操作手柄的实现。

| 组件 | 路径 | 说明 |
|------|------|------|
| `TableHandle` | [src/tableHandle/TableHandle.tsx](src/tableHandle/TableHandle.tsx) | 表格手柄 |
| `ExtendButton` | [src/tableHandle/ExtendButton.tsx](src/tableHandle/ExtendButton.tsx) | 扩展按钮 |

### Popover（弹出层）

基于 Radix UI 的弹出层组件。

**文件位置：**
- [src/popover/popover.tsx](src/popover/popover.tsx)

### Form（表单）

表单组件，包含以下子组件：

| 组件 | 路径 | 说明 |
|------|------|------|
| `Form` | [src/form/Form.tsx](src/form/Form.tsx) | 表单容器 |
| `TextInput` | [src/form/TextInput.tsx](src/form/TextInput.tsx) | 文本输入框 |

### 基础 UI 组件

基于 shadcn/ui 的基础组件：

| 组件 | 路径 | 说明 |
|------|------|------|
| `Button` | [src/components/ui/button.tsx](src/components/ui/button.tsx) | 按钮 |
| `Badge` | [src/components/ui/badge.tsx](src/components/ui/badge.tsx) | 徽章 |
| `Card` | [src/components/ui/card.tsx](src/components/ui/card.tsx) | 卡片 |
| `DropdownMenu` | [src/components/ui/dropdown-menu.tsx](src/components/ui/dropdown-menu.tsx) | 下拉菜单 |
| `Form` | [src/components/ui/form.tsx](src/components/ui/form.tsx) | 表单 |
| `Input` | [src/components/ui/input.tsx](src/components/ui/input.tsx) | 输入框 |
| `Label` | [src/components/ui/label.tsx](src/components/ui/label.tsx) | 标签 |
| `Popover` | [src/components/ui/popover.tsx](src/components/ui/popover.tsx) | 弹出层 |
| `Select` | [src/components/ui/select.tsx](src/components/ui/select.tsx) | 选择器 |
| `Tabs` | [src/components/ui/tabs.tsx](src/components/ui/tabs.tsx) | 标签页 |
| `Toggle` | [src/components/ui/toggle.tsx](src/components/ui/toggle.tsx) | 切换按钮 |
| `Tooltip` | [src/components/ui/tooltip.tsx](src/components/ui/tooltip.tsx) | 工具提示 |

## 使用示例

### 基本使用

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

### 自定义组件

```tsx
import { ShadCNComponentsContext } from '@lcw-doc/shadcn';

// 提供自定义组件
function CustomEditor() {
  const customComponents = {
    // 覆盖默认的 Menu 组件
    Menu: MyCustomMenu,
    // 覆盖默认的 Panel 组件
    Panel: MyCustomPanel,
  };

  return (
    <ShadCNComponentsContext.Provider value={customComponents}>
      <LcwDocView editor={editor} />
    </ShadCNComponentsContext.Provider>
  );
}
```

### 主题定制

```css
/* 自定义主题变量 */
.my-custom-theme {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --primary: 240 5.9% 10%;
  --primary-foreground: 0 0% 98%;
  /* ... */
}
```

```tsx
<div className="my-custom-theme">
  <LcwDocView editor={editor} />
</div>
```

## 依赖关系

```
@lcw-doc/shadcn
├── @lcw-doc/core (peer dependency)
├── @lcw-doc/react (peer dependency)
├── @radix-ui/* (UI primitives)
├── class-variance-authority (样式变体)
├── clsx (类名工具)
├── lucide-react (图标)
├── tailwind-merge (Tailwind 类名合并)
└── tailwindcss (样式框架)
```

## 相关链接

- [Core 包文档](../core/README.md)
- [React 包文档](../react/README.md)
- [ShadcnSharedUI 包文档](../shadcn-shared-ui/README.md)
- [shadcn/ui 官方文档](https://ui.shadcn.com/)
