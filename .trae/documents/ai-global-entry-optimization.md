# AI 全局入口优化计划

## 当前状态

上一轮会话中，AI 全局入口优化的核心功能已经实现完毕：

- ✅ `EditorContext.tsx` — 全局编辑器实例共享
- ✅ `GlobalAIChat/index.tsx` — 右下角浮动 AI 助手（FAB + 聊天面板）
- ✅ `Layout/index.tsx` — 集成 EditorProvider + GlobalAIChat
- ✅ `Doc/index.tsx` — 编辑器就绪时设置全局 editor
- ✅ 所有文件无 TypeScript 编译错误

## 发现的问题

### 1. FAB 按钮与聊天面板重叠（Bug）

当聊天面板打开时，FAB 按钮（X 关闭图标）和聊天面板都定位在 `bottom: 24px; right: 24px`，导致两者重叠。聊天面板头部已有自己的 X 关闭按钮，FAB 按钮在面板打开时应该隐藏。

**修复方案**：聊天面板打开时隐藏 FAB 按钮。

### 2. 光标闪烁动画缺失（Bug）

`streamContent` 渲染时使用了 `animation: 'blink 1s infinite'`，但没有定义对应的 `@keyframes blink` CSS。内联样式无法定义 keyframes，需要通过其他方式注入。

**修复方案**：使用 `useEffect` 动态注入 `<style>` 标签，或改用 JS 实现闪烁效果。

### 3. 未使用的导入（Warning）

`Doc/index.tsx` 中 `MessageSquare` 和 `Wifi` 导入但未使用。

**修复方案**：移除未使用的导入。

## 实施步骤

### Step 1: 修复 FAB 按钮重叠问题
- 文件：`apps/web/src/components/GlobalAIChat/index.tsx`
- 当 `isOpen` 为 true 时，不渲染 FAB 按钮（聊天面板头部已有关闭按钮）

### Step 2: 修复光标闪烁动画
- 文件：`apps/web/src/components/GlobalAIChat/index.tsx`
- 使用 `useEffect` 在组件挂载时动态注入 `@keyframes blink` 样式
- 组件卸载时清理注入的样式

### Step 3: 清理未使用的导入
- 文件：`apps/web/src/pages/Doc/index.tsx`
- 移除 `MessageSquare` 和 `Wifi` 的导入

### Step 4: 验证功能
- 启动开发服务器
- 在非编辑器页面验证 FAB 按钮和聊天功能
- 在编辑器页面验证"已连接编辑器"标识和"插入文档"按钮
- 验证"插入文档"功能正确插入格式化内容

### Step 5: 代码自检
- 运行 typecheck 确保无类型错误
