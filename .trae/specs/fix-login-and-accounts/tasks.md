# Tasks

- [x] Task 1: 修复明文密码用户 — 将 testuser、testuser2、testuser123 的密码转为 bcrypt 哈希
  - [x] 使用 SQL UPDATE 将 testuser 的密码 `test123` 转为 bcrypt 哈希
  - [x] 使用 SQL UPDATE 将 testuser2 的密码 `test123456` 转为 bcrypt 哈希
  - [x] 使用 SQL UPDATE 将 testuser123 的密码 `test123` 转为 bcrypt 哈希
  - [x] 重置 demouser 密码为 `demouser`（原密码未知）
  - [x] 重置 testdev 密码为 `testdev`（原密码未知）
  - [x] 验证修复后 testuser/test123 可以正常登录

- [x] Task 2: 生成数据库账号密码文档
  - [x] 创建 `docs/accounts.md` 列出所有账号和密码
  - [x] 包含用户名、密码、备注信息

- [x] Task 3: 验证单点登录功能
  - [x] 确认同一浏览器换 tab 不需要重新登录（当前 localStorage token 机制已支持）
  - [x] 新 tab 打开文档页面自动保持登录状态

# Task Dependencies
- Task 2 depends on Task 1 (需要修复后的完整账号信息)
- Task 3 is independent
