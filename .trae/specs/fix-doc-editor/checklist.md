# Checklist

## TipTap 版本修复检查点
- [x] `@tiptap/core` 版本升级到 `^2.26.2`
- [x] `@tiptap/react` 版本升级到 `^2.26.2`
- [x] pnpm install 成功

## DocEditor queryFn 修复检查点
- [x] useQuery 包含 queryFn
- [x] currentUser 正确获取

## Y.Doc/Provider 生命周期修复检查点
- [x] Y.Doc 和 Provider 在组件内创建
- [x] room name 使用 pageId
- [x] 组件卸载时正确销毁
- [x] 无重复 disconnect

## TipTap 核心扩展重复修复检查点
- [x] 移除 getLcwDocExtensions 中与 TipTap 内置重复的扩展
- [x] 编辑器无 RangeError 错误

## MCP 测试检查点
- [x] 编辑器无 RangeError 错误
- [x] currentUser queryFn 正常工作
- [x] WebSocket 连接（后端未运行，连接失败为预期行为）
- [x] 编辑器可以输入内容
