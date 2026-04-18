# Checklist

## React.FC 修复检查点

- [x] EditorContent.tsx 不再使用 React.FC
- [x] 所有文件都不再使用 React.FC

## forwardRef 修复检查点

- [x] shadcn/src/components/ui/ 下所有 forwardRef 组件类型正确
- [x] shadcn/src/ 下其他 forwardRef 组件类型正确
- [x] react/src/editor/ 下 forwardRef 组件类型正确

## 最终验证检查点

- [x] `pnpm run typecheck` 通过
- [x] `pnpm run build` 成功
