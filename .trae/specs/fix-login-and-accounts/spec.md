# 修复登录与账号管理 Spec

## Why
1. 部分用户密码以明文存储，导致 bcrypt.compare 无法验证，登录失败
2. 用户需要知道所有可用账号和密码
3. 同一浏览器换 tab 不需要重新登录（单点登录）

## What Changes
- 修复明文密码用户：将 testuser、testuser2、testuser123 的明文密码转为 bcrypt 哈希
- 生成数据库账号密码 MD 文档（仅列出可用的账号和密码）
- 确认单点登录已正常工作（当前基于 localStorage token 的机制已支持同一浏览器换 tab 不用重新登录）

## Impact
- Affected code:
  - 数据库 user 表 — 3 条记录的 password 字段需要从明文转为 bcrypt 哈希
  - 新增文档 `docs/accounts.md` — 列出所有账号和密码

## ADDED Requirements

### Requirement: 明文密码用户修复
系统 SHALL 确保所有用户密码以 bcrypt 哈希存储，使得 `bcrypt.compare` 能正确验证。

#### Scenario: 明文密码用户登录
- **WHEN** 用户 testuser/test123 尝试登录
- **THEN** 登录成功，返回 access_token

### Requirement: 账号密码文档
系统 SHALL 提供一份文档列出所有可用账号及其密码，方便开发测试。

#### Scenario: 查看账号文档
- **WHEN** 开发者查看 docs/accounts.md
- **THEN** 能看到所有账号的用户名和明文密码

### Requirement: 单点登录
同一浏览器中，用户登录后切换 tab 不需要重新登录。

#### Scenario: 同一浏览器切换 tab
- **WHEN** 用户在 Tab A 登录成功
- **AND** 在同一浏览器打开 Tab B 访问文档
- **THEN** Tab B 自动保持登录状态，不需要重新登录

## MODIFIED Requirements

### Requirement: 密码存储
所有用户密码 SHALL 使用 bcrypt 哈希存储。UserService.validateUser() 使用 bcrypt.compare 验证密码，不支持明文密码比对。
