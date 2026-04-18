# Tasks

- [x] Task 1: 创建 dialog.tsx 组件
  - [x] SubTask 1.1: 在 `packages/shadcn-shared-ui/src/components/ui/` 下创建 `dialog.tsx`，基于 `@radix-ui/react-dialog` 实现标准 shadcn Dialog 组件
  - [x] SubTask 1.2: 导出 Dialog, DialogPortal, DialogOverlay, DialogClose, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription

- [x] Task 2: 验证前端构建
  - [x] SubTask 2.1: 确认 `npx tsc --noEmit -p apps/web/tsconfig.json` 无错误
  - [x] SubTask 2.2: 确认 Vite 开发服务器启动无错误
  - [x] SubTask 2.3: 确认浏览器访问 `http://localhost:5173` 页面正常加载

- [x] Task 3: 端到端验证
  - [x] SubTask 3.1: 启动后端服务，确认无启动错误
  - [x] SubTask 3.2: 测试登录流程（注册新用户 → 登录 → 跳转文档列表）
  - [x] SubTask 3.3: 测试文档编辑（创建文档 → 输入文字 → 确认编辑器正常）
  - [x] SubTask 3.4: 测试快捷键面板（按 Ctrl+/ → 确认面板弹出）

# Task Dependencies
- [Task 2] depends on [Task 1]
- [Task 3] depends on [Task 2]
