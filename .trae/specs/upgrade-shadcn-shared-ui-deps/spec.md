# 升级 shadcn-shared-ui 依赖 Spec

## Why
shadcn-shared-ui 包的依赖版本较旧，需要升级到最新稳定版本以获得更好的性能、安全性和新功能。

## What Changes
- 升级 react 从 ^18 到 ^19.2.0
- 升级 tailwindcss 从 3.4.14 到 ^4.1.x
- 升级 lucide-react 从 0.454.0 到 ^0.523.0 (或 ^1.7.0)
- 升级 @radix-ui 相关依赖到最新版本
- 升级其他依赖到最新稳定版本
- 修复所有升级后的 TypeScript 类型错误

## Impact
- 影响文件：packages/shadcn-shared-ui/package.json
- 可能需要更新 tailwindcss 配置（v3 到 v4 有破坏性变更）

## ADDED Requirements

### Requirement: 依赖升级
系统必须将所有依赖升级到最新稳定版本。

#### Scenario: 所有依赖升级完成
- **WHEN** 运行 `pnpm outdated`
- **THEN** 没有可升级的依赖

### Requirement: 类型检查通过
系统必须修复所有升级后的 TypeScript 类型错误。

#### Scenario: 类型检查通过
- **WHEN** 运行 `pnpm run typecheck`
- **THEN** 无任何 TypeScript 错误

## MODIFIED Requirements

### Requirement: 保持功能不变
**原则**：只升级依赖和修复类型错误，不修改任何功能代码逻辑。
