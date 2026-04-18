# 修复 React 19 废弃写法 Spec

## Why
React 19 已经发布，其中一些在 React 18 中标记为废弃的写法在 React 19 中需要更新。本项目目前存在一些 React 18 之前的写法，需要升级到 React 19 的现代语法以确保兼容性和最佳实践。

## What Changes
- 将 `React.FC` 替换为常规函数组件类型定义
- 将 `forwardRef` 用法更新为 React 19 的新 ref 传递方式（可选）
- 检查并修复 `defaultProps` 的使用（函数组件中已废弃）
- 检查 `useRef` 的初始值问题
- 确保所有组件使用现代的类型定义方式

## Impact
- 影响文件：packages/react/src/editor/ 下的组件
- 影响文件：packages/shadcn/src/components/ui/ 下的组件
- 影响文件：packages/shadcn/src/ 下的各种组件

## ADDED Requirements

### Requirement: React 19 现代语法迁移
系统必须将所有 React 18 之前的废弃写法迁移到 React 19 现代语法。

#### Scenario: 类型检查通过
- **WHEN** 运行 `pnpm run typecheck`
- **THEN** 无 React 相关类型错误

#### Scenario: 构建成功
- **WHEN** 运行 `pnpm run build`
- **THEN** 所有包构建成功

## MODIFIED Requirements

### Requirement: 保持功能不变
**原则**：只更新语法写法，不修改任何功能代码逻辑。
