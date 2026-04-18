# 修复登录用户显示错误 Spec

## Why
用户注册账号 "lin" 后登录，显示的用户名却是 "testUser"。原因是 `AuthService.login()` 创建 JWT 时使用了 `user.userId`（不存在），而 UserEntity 的主键字段是 `id`，导致 JWT 的 `sub` 为 `undefined`，`JwtStrategy.validate()` 查找用户时返回了数据库中第一条记录（testUser）。

## What Changes
- 修复 `AuthService.login()` 中 JWT payload 的字段名：`user.userId` → `user.id`

## Impact
- Affected code: apps/server/src/modules/auth/auth.service.ts
- Affected specs: 无

## ADDED Requirements
无

## MODIFIED Requirements
### Requirement: JWT Token 创建
AuthService.login() 创建 JWT payload 时 SHALL 使用 `user.id`（而非 `user.userId`）作为 `sub` 字段值，确保 JWT token 包含正确的用户 ID。

## REMOVED Requirements
无
