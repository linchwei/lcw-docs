# Tasks

- [x] Task 1: 修复 apps/server/tsconfig.json 排除测试文件
  - [x] SubTask 1.1: 在 tsconfig.json 中添加 exclude 字段，排除 vitest.config.ts 和 src/test
  - [x] SubTask 1.2: 验证 `npx tsc --noEmit` 通过

- [x] Task 2: 全项目 typecheck 验证
  - [x] SubTask 2.1: 执行 `pnpm typecheck` 确认所有包通过
  - [x] SubTask 2.2: 使用 MCP GetDiagnostics 验证无诊断错误

# Task Dependencies
- [Task 2] depends on [Task 1]
