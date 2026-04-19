# 一键部署命令 Spec

## Why
当前部署流程需要手动执行多个 git 命令（push main、创建 tag、push tag），然后等待 GitHub Actions 触发部署。用户希望一条命令完成"推送代码 + 自动部署到服务器"的完整流程。

## What Changes
- 在根 `package.json` 的 `scripts` 中添加 `deploy` 命令
- 该命令执行：推送 main 分支 → 自动递增版本号 → 创建 tag → 推送 tag → GitHub Actions 自动部署
- 添加 `deploy:minor` 和 `deploy:major` 命令支持不同版本级别

## Impact
- Affected code: `package.json`（scripts 部分）
- Affected workflows: 已有的 `.github/workflows/release.yml`（tag push 触发部署，无需修改）

## ADDED Requirements

### Requirement: 一键部署命令
系统 SHALL 提供 `pnpm deploy` 命令，执行后自动完成代码推送和服务器部署。

#### Scenario: 执行 pnpm deploy（patch 版本）
- **WHEN** 用户执行 `pnpm deploy`
- **THEN** 系统自动执行：git push origin main → npm version patch（递增补丁版本）→ git push origin v{新版本号} → GitHub Actions release.yml 自动触发 → SSH 到服务器拉取代码并重建部署

#### Scenario: 执行 pnpm deploy:minor（minor 版本）
- **WHEN** 用户执行 `pnpm deploy:minor`
- **THEN** 系统自动执行：git push origin main → npm version minor（递增次版本）→ git push origin v{新版本号} → 自动部署

#### Scenario: 执行 pnpm deploy:major（major 版本）
- **WHEN** 用户执行 `pnpm deploy:major`
- **THEN** 系统自动执行：git push origin main → npm version major（递增主版本）→ git push origin v{新版本号} → 自动部署

#### Scenario: 工作区不干净
- **WHEN** 用户执行 `pnpm deploy` 但有未提交的更改
- **THEN** 命令提示"请先提交更改"并中止，不会执行推送和部署
