# 修复编辑器斜杠菜单和侧边菜单加号按钮 Spec

## Why

编辑器输入 "/" 没有弹出样式选择菜单（斜杠菜单），点击左侧加号按钮也没有反应。这两个功能是编辑器核心交互，无法使用严重影响编辑体验。

## What Changes

- 修复 `AddBlockButton.tsx` 中 `onClick` 事件绑定在 icon 上而非 Button 组件上的 bug（已完成）
- 修复 `LcwDocDefaultUI.tsx` 不渲染 `props.children` 的 bug（**核心问题**）
- 重新构建 react 和 shadcn 包以更新构建产物

## Impact

- Affected code: `packages/react/src/components/SideMenu/DefaultButtons/AddBlockButton.tsx`（已修复）
- Affected code: `packages/react/src/editor/LcwDocDefaultUI.tsx`（需要修复）
- Affected code: `packages/react/`（需要重新构建）
- Affected code: `packages/shadcn/`（需要重新构建）

## ADDED Requirements

### Requirement: 侧边菜单加号按钮点击功能

系统 SHALL 在用户点击编辑器左侧加号按钮时，正确触发 `editor.openSuggestionMenu('/')` 打开斜杠菜单。

#### Scenario: 点击加号按钮打开斜杠菜单

- **WHEN** 用户点击编辑器块左侧的加号按钮
- **THEN** 系统应在当前块位置打开斜杠菜单，显示可选的块类型列表

#### Scenario: 空块点击加号按钮

- **WHEN** 用户在空块上点击加号按钮
- **THEN** 系统应将光标定位到该空块并打开斜杠菜单

#### Scenario: 非空块点击加号按钮

- **WHEN** 用户在非空块上点击加号按钮
- **THEN** 系统应在该块下方插入新的空段落块，将光标定位到新块并打开斜杠菜单

### Requirement: 斜杠菜单输入触发功能

系统 SHALL 在用户输入 "/" 字符时，弹出斜杠菜单显示可选的块类型列表。

#### Scenario: 输入斜杠触发菜单

- **WHEN** 用户在编辑器中输入 "/" 字符
- **THEN** 系统应弹出斜杠菜单，包含默认块类型和自定义 AI 选项

#### Scenario: 斜杠菜单搜索过滤

- **WHEN** 用户在 "/" 后继续输入文字
- **THEN** 系统应根据输入过滤菜单项

### Requirement: LcwDocDefaultUI 渲染 children

`LcwDocDefaultUI` 组件 SHALL 渲染 `props.children`，使通过 `LcwDocView` 传入的自定义 UI 控制器（如 `SuggestionMenuController`）能够正确挂载。

#### Scenario: 自定义 SuggestionMenuController 作为 children 传入

- **WHEN** 用户通过 `<LcwDocView slashMenu={false}>` 传入自定义 `<SuggestionMenuController triggerCharacter="/" />` 作为 children
- **THEN** 自定义 SuggestionMenuController 应被正确挂载，"/" 触发字符应被注册到编辑器

## MODIFIED Requirements

### Requirement: AddBlockButton onClick 事件传递（已修复）

`AddBlockButton` 组件 SHALL 将 `onClick` 回调通过 `Components.SideMenu.Button` 的 `onClick` prop 传递，而非绑定在 icon 元素上。

### Requirement: LcwDocDefaultUI children 渲染

`LcwDocDefaultUI` 组件 SHALL 在其 JSX 中渲染 `{props.children}`，确保通过 `LcwDocView` 传入的自定义子组件被正确挂载。

**修改前**：

```tsx
export function LcwDocDefaultUI(props: LcwDocDefaultUIProps) {
    const editor = useLcwDocEditor()
    return (
        <>
            {props.formattingToolbar !== false && <FormattingToolbarController />}
            {props.linkToolbar !== false && <LinkToolbarController />}
            {props.slashMenu !== false && <SuggestionMenuController triggerCharacter="/" />}
            {props.emojiPicker !== false && <GridSuggestionMenuController triggerCharacter=":" columns={10} minQueryLength={2} />}
            {props.sideMenu !== false && <SideMenuController />}
            {editor.filePanel && props.filePanel !== false && <FilePanelController />}
            {editor.tableHandles && props.tableHandles !== false && <TableHandlesController />}
        </>
    )
}
```

**修改后**：

```tsx
export function LcwDocDefaultUI(props: LcwDocDefaultUIProps) {
    const editor = useLcwDocEditor()
    return (
        <>
            {props.formattingToolbar !== false && <FormattingToolbarController />}
            {props.linkToolbar !== false && <LinkToolbarController />}
            {props.slashMenu !== false && <SuggestionMenuController triggerCharacter="/" />}
            {props.emojiPicker !== false && <GridSuggestionMenuController triggerCharacter=":" columns={10} minQueryLength={2} />}
            {props.sideMenu !== false && <SideMenuController />}
            {editor.filePanel && props.filePanel !== false && <FilePanelController />}
            {editor.tableHandles && props.tableHandles !== false && <TableHandlesController />}
            {props.children}
        </>
    )
}
```

## Root Cause Analysis

### 问题 1：加号按钮 onClick 未传递到 Button 组件（已修复）

- `AddBlockButton.tsx` 将 `onClick` 放在了 `icon` prop 内部的 `<AiOutlinePlus>` SVG 元素上
- `SideMenuButton.tsx` 从 props 中解构 `onClick` 并传递给 `ShadCNComponents.Button.Button`
- 由于 `onClick` 没有作为 `Components.SideMenu.Button` 的 prop 传递，`SideMenuButton` 接收到的 `onClick` 为 `undefined`
- 因此 `<button>` 元素本身没有 onClick 处理器，点击按钮不会触发任何事件

### 问题 2：斜杠菜单不弹出（核心问题）

- **根本原因**：`LcwDocDefaultUI` 组件虽然类型定义中接受 `children?: ReactNode` prop，但在 JSX 中从未渲染 `{props.children}`
- `DocEditor.tsx` 设置 `slashMenu={false}` 禁用了默认斜杠菜单，然后通过 `<LcwDocView>` 的 children 传入自定义的 `<SuggestionMenuController triggerCharacter="/" />` 和 `<SuggestionMenuController triggerCharacter="@" />`
- `LcwDocView`（shadcn）将 children 传给 `LcwDocViewRaw`（react），`LcwDocViewRaw` 将 children 传给 `LcwDocDefaultUI`
- 但 `LcwDocDefaultUI` 不渲染 children，导致自定义的 `SuggestionMenuController` 组件从未被挂载
- 未挂载意味着 `editor.suggestionMenus.onUpdate("/", callback)` 从未被调用，"/" 触发字符从未注册
- 因此输入 "/" 时 ProseMirror 的 `handleTextInput` 检查 `triggerCharacters.includes("/")` 返回 false，不会触发菜单
