# Tasks

- [x] Task 1: 修改 database.ts 的 synchronize 逻辑
  - [x] 将 `synchronize: isProd ? false : (process.env.DB_SYNCHRONIZE === 'true')` 改为 `synchronize: process.env.DB_SYNCHRONIZE === 'true'`
- [x] Task 2: 在服务器上应用修复并初始化数据库
  - [x] 更新服务器上的 server 代码
  - [x] 设置 `DB_SYNCHRONIZE: "true"` 并重启 server 容器
  - [x] 验证数据库表已创建
  - [x] 将 `DB_SYNCHRONIZE` 改回 `"false"` 并重启

# Task Dependencies
- Task 2 depends on Task 1
