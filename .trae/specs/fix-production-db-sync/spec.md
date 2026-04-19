# 修复生产环境数据库表未创建问题 Spec

## Why
部署到生产环境后，所有 API 请求返回 500 错误，根因是 TypeORM 的 `synchronize` 在 `NODE_ENV=production` 时被硬编码为 `false`，导致数据库表从未被创建。数据库中仅有 `yjs-writings` 表（由 YjsPostgreSQL 模块创建），缺少 user、page、folder 等 12 张核心业务表。

## What Changes
- 修改 `apps/server/src/config/database.ts`，使 `DB_SYNCHRONIZE` 环境变量在生产环境下也能生效（当显式设置为 `"true"` 时）
- 在服务器上重新启动 server 容器，让 TypeORM 自动创建表结构
- 初始化完成后将 `DB_SYNCHRONIZE` 改回 `"false"`

## Impact
- Affected code: `apps/server/src/config/database.ts`
- Affected infrastructure: 服务器上的 `docker-compose.local.yml` 环境变量

## ADDED Requirements

### Requirement: 生产环境数据库初始化
系统 SHALL 允许在生产环境下通过 `DB_SYNCHRONIZE=true` 环境变量显式启用 TypeORM 自动同步，用于首次部署时的数据库表结构初始化。

#### Scenario: 首次部署时启用同步
- **WHEN** `NODE_ENV=production` 且 `DB_SYNCHRONIZE=true`
- **THEN** TypeORM `synchronize` 为 `true`，自动创建所有实体表

#### Scenario: 正常运行时禁用同步
- **WHEN** `NODE_ENV=production` 且 `DB_SYNCHRONIZE` 未设置或为其他值
- **THEN** TypeORM `synchronize` 为 `false`，不自动修改表结构

## MODIFIED Requirements

### Requirement: database.ts synchronize 逻辑
原逻辑：`synchronize: isProd ? false : (process.env.DB_SYNCHRONIZE === 'true')`
新逻辑：`synchronize: process.env.DB_SYNCHRONIZE === 'true'`

统一由 `DB_SYNCHRONIZE` 环境变量控制，不再因生产环境而强制禁用。这符合"显式优于隐式"原则——运维人员应该有权决定是否启用同步。
