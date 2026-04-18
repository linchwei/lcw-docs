# 配置数据库与启动服务 Spec

## Why
项目需要配置本地 PostgreSQL 数据库，启动后端服务，并确保用户注册和登录功能正常工作。

## What Changes
- 使用 Docker Compose 启动 PostgreSQL 数据库（端口 5433，密码 postgres）
- 后端数据库配置已更新为 localhost:5433
- 构建并启动后端服务（端口 8082）
- 验证注册和登录功能

## Impact
- Affected code:
  - `apps/server/src/config/database.ts`（已更新）
  - `docker-compose.yml`（已创建）
  - `apps/server/tsconfig.json`（已修复构建问题）

## ADDED Requirements
### Requirement: 数据库启动
The system SHALL provide a running PostgreSQL database accessible on localhost:5433.

#### Scenario: 启动数据库
- **WHEN** 运行 docker-compose up -d
- **THEN** PostgreSQL 容器在本地启动，监听端口 5433

### Requirement: 后端服务启动
The system SHALL start the backend NestJS service connected to the database.

#### Scenario: 启动后端
- **WHEN** 运行后端服务
- **THEN** 服务在端口 8082 启动并成功连接数据库

### Requirement: 用户注册和登录
The system SHALL allow users to register and login.

#### Scenario: 注册并登录
- **WHEN** 用户在登录页注册新账号
- **THEN** 注册成功后可以登录
- **AND** 登录后跳转到文档页面
