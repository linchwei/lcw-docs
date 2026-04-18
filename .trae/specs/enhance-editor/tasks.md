# Tasks

- [x] Task 1: 新增引用块（Blockquote）自定义块
  - [x] SubTask 1.1: 创建 `apps/web/src/blocks/blockquote/blockquote.tsx`，使用 `createReactBlockSpec` 定义引用块，包含左边框、背景色等样式
  - [x] SubTask 1.2: 创建 `apps/web/src/blocks/blockquote/index.ts` 导出
  - [x] SubTask 1.3: 在 `DocEditor.tsx` 的 schema 中注册 blockquote 块
  - [x] SubTask 1.4: 在斜杠菜单中添加"引用"插入项
  - [x] SubTask 1.5: 在格式化工具栏的 BlockTypeSelect 中添加"引用"选项（修改核心包 @lcw-doc/react）

- [x] Task 10: 修复 React 19 contentRef 兼容性及类型错误
  - [x] SubTask 10.1: 修复 `packages/react/src/schema/ReactBlockSpec.tsx` 中 `nodeViewContentRef` 可能为 `undefined` 的类型错误，使用非空断言 `ref!` 或空值合并
  - [x] SubTask 10.2: 修复 `packages/react/src/schema/ReactInlineContentSpec.tsx` 中 `nodeViewContentRef` 可能为 `undefined` 的类型错误，同上
  - [x] SubTask 10.3: 修复 `packages/react/src/components/FormattingToolbar/DefaultSelects/BlockTypeSelect.tsx` 中 `RiDoubleQuotes` 不存在的导入错误，改为 `RiDoubleQuotesR`
  - [x] SubTask 10.4: 验证 TypeScript 编译通过（`npx tsc --noEmit -p packages/react/tsconfig.json`）
  - [x] SubTask 10.5: 验证编辑器主体正常渲染（ProseMirror 编辑区域可见）
  - [x] SubTask 10.6: 验证引用块（blockquote）可以正确输入富文本内容
  - [x] SubTask 10.7: 验证提示框（callout）可以正确输入富文本内容
  - [x] SubTask 10.8: 验证 Mention 内联内容正常渲染

- [x] Task 2: 新增分割线（Divider）自定义块
  - [x] SubTask 2.1: 创建 `apps/web/src/blocks/divider/divider.tsx`，使用 `createReactBlockSpec` 定义分割线块
  - [x] SubTask 2.2: 创建 `apps/web/src/blocks/divider/index.ts` 导出
  - [x] SubTask 2.3: 在 `DocEditor.tsx` 的 schema 中注册 divider 块
  - [x] SubTask 2.4: 在斜杠菜单中添加"分割线"插入项

- [x] Task 3: 新增提示框（Callout）自定义块
  - [x] SubTask 3.1: 创建 `apps/web/src/blocks/callout/callout.tsx`，使用 `createReactBlockSpec` 定义提示框块，propSchema 包含 `calloutType`（info/warning/error/success），content 为 `inline*`
  - [x] SubTask 3.2: 创建 `apps/web/src/blocks/callout/index.ts` 导出
  - [x] SubTask 3.3: 在 `DocEditor.tsx` 的 schema 中注册 callout 块
  - [x] SubTask 3.4: 在斜杠菜单中添加"提示框"插入项（含子类型：信息/警告/错误/成功）

- [x] Task 4: 后端文件上传端点
  - [x] SubTask 4.1: 创建 `apps/server/src/modules/upload/upload.controller.ts`，使用 Multer FileInterceptor 处理文件上传
  - [x] SubTask 4.2: 创建 `apps/server/src/modules/upload/upload.service.ts`，实现文件存储逻辑（本地存储到 uploads 目录）
  - [x] SubTask 4.3: 创建 `apps/server/src/modules/upload/upload.module.ts`，注册模块
  - [x] SubTask 4.4: 在 `app.module.ts` 中注册 UploadModule
  - [x] SubTask 4.5: 配置 NestJS 静态文件服务，使上传的文件可通过 URL 访问
  - [x] SubTask 4.6: 前端 `services/` 中新增 `upload.ts`，提供 `uploadFile` API 函数

- [x] Task 5: 前端配置文件上传
  - [x] SubTask 5.1: 在 `DocEditor.tsx` 的 `useCreateLcwDoc` 中配置 `uploadFile` 和 `resolveFileUrl`
  - [x] SubTask 5.2: 验证文件面板的上传标签页可用
  - [x] SubTask 5.3: 验证拖放和粘贴文件功能

- [x] Task 6: 后端 AI 代理端点
  - [x] SubTask 6.1: 创建 `apps/server/src/modules/ai/ai.controller.ts`，提供 `/ai/chat` 端点，支持 SSE streaming
  - [x] SubTask 6.2: 创建 `apps/server/src/modules/ai/ai.service.ts`，封装 Dify API 调用，API Key 从环境变量读取
  - [x] SubTask 6.3: 创建 `apps/server/src/modules/ai/ai.module.ts`，注册模块
  - [x] SubTask 6.4: 在 `app.module.ts` 中注册 AIModule
  - [x] SubTask 6.5: 前端 `services/` 中新增 `ai.ts`，提供 AI 聊天 API 函数

- [x] Task 7: 增强 AI 块
  - [x] SubTask 7.1: 重写 `apps/web/src/blocks/ai/ai.tsx`，propSchema 添加 `status`（idle/generating/done/error）和 `prompt`
  - [x] SubTask 7.2: 实现 AI 块的渲染：idle 状态显示输入框，generating 状态显示流式内容和加载动画，done 状态显示操作按钮（接受/重新生成/丢弃），error 状态显示错误提示和重试
  - [x] SubTask 7.3: AI 块内直接调用后端 AI 代理端点，使用 SSE 接收流式响应

- [x] Task 8: 升级 AI 聊天面板为流式输出
  - [x] SubTask 8.1: 修改 `BasicAIChatPanel.tsx`，将 `response_mode` 从 `blocking` 改为通过后端代理的 SSE streaming
  - [x] SubTask 8.2: 实现流式内容的逐步渲染，使用 ReadableStream 处理 SSE 事件
  - [x] SubTask 8.3: 添加取消生成按钮（AbortController）
  - [x] SubTask 8.4: 更新样式为 Notion 暖色调风格

- [x] Task 9: 优化 Mention 组件
  - [x] SubTask 9.1: 修改 `mention.tsx` 的 propSchema，添加 `title` 和 `icon` 可选属性
  - [x] SubTask 9.2: 修改 `MentionContent.tsx`，优先使用 props 中的 title/icon，仅在缺失时查询
  - [x] SubTask 9.3: 修改 `DocEditor.tsx` 中的 `getMentionMenuItems`，插入时传入 title 和 icon

# Task Dependencies
- [Task 5] depends on [Task 4]
- [Task 7] depends on [Task 6]
- [Task 8] depends on [Task 6]
- [Task 1, Task 2, Task 3] 可并行执行
- [Task 9] 无依赖，可并行执行
- [Task 10] 无依赖，可立即执行（关键修复）
