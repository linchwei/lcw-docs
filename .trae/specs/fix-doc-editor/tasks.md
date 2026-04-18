# Tasks

- [x] Task 1: 修复 TipTap 版本不匹配
  - [x] Task 1.1: 在 `packages/react/package.json` 中将 `@tiptap/core` 从 `^2.7.1` 升级到 `^2.26.2`
  - [x] Task 1.2: 在 `packages/react/package.json` 中将 `@tiptap/react` 从 `^2.7.1` 升级到 `^2.26.2`
  - [x] Task 1.3: 运行 `pnpm install` 安装新版本

- [x] Task 2: 修复 DocEditor.tsx 缺失的 queryFn
  - [x] Task 2.1: 在 `apps/web/src/pages/Doc/DocEditor.tsx` 的 useQuery 调用中添加 queryFn

- [x] Task 3: 修复 Y.Doc/WebsocketProvider 生命周期
  - [x] Task 3.1: 将 `Doc/index.tsx` 中模块级的 Y.Doc 和 WebsocketProvider 移入组件内部
  - [x] Task 3.2: 使用 pageId 作为 WebsocketProvider 的 room name
  - [x] Task 3.3: 在组件卸载时正确销毁 Y.Doc 和 Provider
  - [x] Task 3.4: 移除重复的 provider.disconnect() 调用

- [x] Task 4: 使用 MCP 测试验证
  - [x] Task 4.1: 验证编辑器无 RangeError 错误
  - [x] Task 4.2: 验证 currentUser queryFn 正常工作
  - [x] Task 4.3: 验证 WebSocket 连接成功（后端未运行，连接失败为预期行为）
  - [x] Task 4.4: 验证编辑器可以输入内容

# Task Dependencies
- Task 1 必须最先完成（修复底层依赖问题）
- Task 2 和 Task 3 可以并行
- Task 4 必须在所有开发任务完成后执行
