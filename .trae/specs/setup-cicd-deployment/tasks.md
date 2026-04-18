# Tasks

- [x] Task 1: 用户自行推送代码到 GitHub
  - [x] SubTask 1.1: 用户在本地执行 `git push -u origin main`
  - [x] SubTask 1.2: AI 确认代码已推送到 GitHub

- [x] Task 2: 修改 docker-compose.deploy.yml 端口绑定（无域名场景）
  - [x] SubTask 2.1: web 端口从 `127.0.0.1:80:80` 改为 `80:80`（无域名无需 Nginx SSL 终止）— 原本已是 80:80
  - [x] SubTask 2.2: server 端口从 `127.0.0.1:8082:8082` 改为 `8082:8082`（无域名需直接访问 API）

- [x] Task 3: 在服务器上克隆项目并配置 .env
  - [x] SubTask 3.1: SSH 到服务器，以 deploy 用户克隆项目到 /home/deploy/lcw-docs
  - [x] SubTask 3.2: 生成 .env 文件（含自动生成的 DB_PASSWORD、JWT_SECRET、CORS_ORIGINS、MINIMAX_API_KEY）
  - [x] SubTask 3.3: 上传 .env 到服务器，设置权限 600

- [ ] Task 4: 首次启动 Docker Compose 并初始化数据库
  - [ ] SubTask 4.1: 临时启用 DB_SYNCHRONIZE=true
  - [ ] SubTask 4.2: 启动 Docker Compose
  - [ ] SubTask 4.3: 等待数据库初始化完成
  - [ ] SubTask 4.4: 移除 DB_SYNCHRONIZE，重启 server

- [ ] Task 5: 生成 GitHub Actions SSH 密钥对
  - [ ] SubTask 5.1: 在本地生成 ed25519 密钥对（github_actions_deploy）
  - [ ] SubTask 5.2: 将公钥添加到服务器 deploy 用户

- [ ] Task 6: 提供 GitHub Secrets 配置指引
  - [ ] SubTask 6.1: 输出所有需要配置的 Secret 名称和值
  - [ ] SubTask 6.2: 用户在浏览器中完成配置

- [ ] Task 7: 验证部署
  - [ ] SubTask 7.1: 验证 http://106.53.73.48 可访问
  - [ ] SubTask 7.2: 验证 http://106.53.73.48/api/health 返回正常

# Task Dependencies
- [Task 2] depends on [Task 1]（需要先推送代码，服务器才能克隆）
- [Task 3] depends on [Task 2]
- [Task 4] depends on [Task 3]
- [Task 5] depends on [Task 4]（服务器部署成功后才配置 CI/CD）
- [Task 6] depends on [Task 5]
- [Task 7] depends on [Task 4]（部署后即可验证，CI/CD 验证需 Task 6 完成后）
