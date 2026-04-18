# Tasks

- [x] Task 1: 修复 AddBlockButton onClick 事件传递
  - [x] Task 1.1: 将 `AddBlockButton.tsx` 中 icon 上的 `onClick` 移到 `Components.SideMenu.Button` 的 prop 上
  - [x] Task 1.2: 验证修改后 `SideMenuButton.tsx` 能正确接收到 `onClick` prop

- [x] Task 2: 修复 LcwDocDefaultUI 不渲染 children 的 bug
  - [x] Task 2.1: 在 `LcwDocDefaultUI.tsx` 的 JSX 末尾添加 `{props.children}`
  - [x] Task 2.2: 确认 children 渲染位置正确（在所有默认 UI 控制器之后）

- [x] Task 3: 修复 LcwDocContext 缺少 setContentEditableProps 的 bug
  - [x] Task 3.1: 在 `LcwDocView.tsx` 的 context 值中添加 `setContentEditableProps`
  - [x] Task 3.2: 更新 context 的 useMemo 依赖数组

- [x] Task 4: 修复 querySelector 使用 bn: 前缀的 CSS 选择器错误
  - [x] Task 4.1: 修复 `SuggestionMenuItem.tsx` 中 `querySelector('.bn:suggestion-menu')` 为 `querySelector('.bn-suggestion-menu')`
  - [x] Task 4.2: 修复 `GridSuggestionMenuItem.tsx` 中 `querySelector('.bn:grid-suggestion-menu')` 为 `querySelector('.bn-grid-suggestion-menu')`

- [x] Task 5: 重新构建 react 和 shadcn 包
  - [x] Task 5.1: 在 `packages/react` 目录执行 `pnpm build` 更新构建产物
  - [x] Task 5.2: 在 `packages/shadcn` 目录执行 `pnpm build` 更新构建产物

- [x] Task 6: 验证斜杠菜单和加号按钮功能
  - [x] Task 6.1: 在编辑器中输入 "/" 确认斜杠菜单弹出
  - [x] Task 6.2: 确认斜杠菜单包含默认块类型和 AI 选项
  - [x] Task 6.3: 确认斜杠菜单搜索过滤功能正常

# Task Dependencies
- Task 2 是核心修复（LcwDocDefaultUI 不渲染 children）
- Task 3 依赖 Task 2（children 渲染后 SuggestionMenuWrapper 需要 setContentEditableProps）
- Task 4 依赖 Task 3（SuggestionMenuWrapper 渲染后 querySelector 需要正确的选择器）
- Task 5 依赖 Task 2-4（源码修改后需要重新构建）
- Task 6 依赖 Task 5（构建产物更新后才能验证）
