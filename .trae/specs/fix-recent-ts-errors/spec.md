# 修复 TypeScript 语法错误 Spec

## Why
最近新增功能（批量标签 API、CI/CD 工作流、测试文件等）引入了 `vitest.config.ts` 和 `src/test` 目录，但 server 端 `tsconfig.json` 未排除这些文件，导致 `tsc --noEmit` 报 TS6059 错误。

## What Changes
- 修改 `apps/server/tsconfig.json` 排除 `vitest.config.ts` 和 `src/test` 目录
- 验证所有包 `tsc --noEmit` 通过

## Impact
- Affected code: `apps/server/tsconfig.json`

## ADDED Requirements

### Requirement: Server tsconfig.json 排除测试文件
系统 SHALL 在 `apps/server/tsconfig.json` 中排除 `vitest.config.ts` 和 `src/test` 目录，确保 `tsc --noEmit` 无错误。

#### Scenario: 默认 tsconfig 类型检查通过
- **WHEN** 在 `apps/server` 目录执行 `npx tsc --noEmit`
- **THEN** 无任何 TypeScript 错误输出

#### Scenario: 构建 tsconfig 类型检查通过
- **WHEN** 在 `apps/server` 目录执行 `npx tsc -p tsconfig.build.json --noEmit`
- **THEN** 无任何 TypeScript 错误输出

#### Scenario: 全项目 typecheck 通过
- **WHEN** 在项目根目录执行 `pnpm typecheck`
- **THEN** 所有 6 个包均通过类型检查
