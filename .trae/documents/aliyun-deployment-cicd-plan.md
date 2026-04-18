# 阿里云服务器部署 + GitHub CI/CD 持续集成文档计划

## 目标

创建一份详细的、面向实践的持续集成与部署教程文档，涵盖从阿里云服务器购买到 GitHub CI/CD 完整配置的全流程。文档将写入 `docs/deployment.md`。

## 文档结构

### 第一部分：阿里云服务器准备

1. **购买与选型**
   - 推荐配置（2核4G 起步，推荐 4核8G）
   - 操作系统选择（Ubuntu 22.04 LTS）
   - 安全组配置（开放端口：22/80/443/8082/3000/9090）
   - 弹性公网 IP 绑定

2. **服务器初始化**
   - SSH 密钥登录配置（禁用密码登录）
   - 系统更新与基础软件安装（curl, git, htop, unzip）
   - Docker + Docker Compose 安装
   - 防火墙配置（ufw）
   - Swap 分区配置（小内存服务器）
   - 创建部署用户（非 root）

3. **域名与 HTTPS（可选）**
   - 阿里云域名解析配置
   - Certbot + Let's Encrypt 证书申请
   - Nginx 反向代理 + SSL 终止配置

### 第二部分：项目部署配置

4. **服务器端项目目录准备**
   - 创建项目目录结构
   - 克隆仓库（浅克隆）
   - 配置 `.env` 生产环境变量
   - 目录权限设置

5. **环境变量配置详解**
   - 必需变量：DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE, JWT_SECRET, CORS_ORIGINS
   - 可选变量：MINIMAX_API_KEY, SENTRY_DSN, REDIS_HOST, REDIS_PORT
   - 安全注意事项（JWT_SECRET 生成方式、密码强度）

6. **Docker Compose 部署**
   - `docker-compose.deploy.yml` 架构说明
   - 首次部署命令
   - 数据持久化（volumes 说明）
   - 数据库初始化与迁移（TypeORM synchronize 说明）
   - 健康检查与依赖关系

7. **生产环境优化**
   - `docker-compose.deploy.yml` 改用预构建镜像（从 GHCR 拉取）
   - PostgreSQL 安全加固
   - Nginx 性能调优（gzip, client_max_body_size）
   - 日志管理（Docker log driver, logrotate）
   - 自动重启策略

### 第三部分：GitHub CI/CD 配置

8. **GitHub 仓库 Secrets 配置**
   - DEPLOY_HOST（服务器 IP）
   - DEPLOY_USER（SSH 用户名）
   - DEPLOY_SSH_KEY（SSH 私钥，含生成步骤）
   - DEPLOY_PATH（部署路径）
   - DEPLOY_ENV（完整 .env 内容）
   - GITHUB_TOKEN（自动提供）

9. **GitHub Environments 配置**
   - staging 环境（手动触发）
   - production 环境（需审批 + 保护规则）

10. **CI 工作流详解**（`.github/workflows/ci.yml`）
    - 触发条件说明
    - 各 Job 解析：lint-and-typecheck, test, build-server, build-web, docker-build
    - 并发控制与缓存策略
    - 常见问题排查

11. **Release 工作流详解**（`.github/workflows/release.yml`）
    - 触发方式（Git tag）
    - Docker 镜像构建与推送 GHCR
    - SSH 部署流程
    - 版本回滚方法

12. **手动部署工作流详解**（`.github/workflows/deploy.yml`）
    - workflow_dispatch 触发
    - 环境选择与镜像 tag 指定
    - 适用场景

### 第四部分：部署流程操作指南

13. **首次完整部署步骤**（从零到上线）
    - Step 1: 服务器准备
    - Step 2: 仓库配置
    - Step 3: Secrets 设置
    - Step 4: 推送代码触发 CI
    - Step 5: 打 tag 触发部署
    - Step 6: 验证部署

14. **日常运维操作**
    - 更新部署（打新 tag）
    - 手动回滚
    - 查看日志
    - 数据库备份与恢复
    - 重启服务

15. **监控与告警**
    - Prometheus 指标采集
    - Grafana 仪表盘配置
    - 健康检查端点（/api/health）

### 第五部分：故障排查

16. **常见问题与解决方案**
    - CI 构建失败
    - Docker 镜像拉取失败（GHCR 访问问题，阿里云镜像加速）
    - 数据库连接失败
    - WebSocket 连接问题
    - Nginx 502/504 错误
    - 磁盘空间不足

## 需要修改的文件

| 文件 | 修改内容 |
|------|---------|
| `docs/deployment.md` | **新建** - 完整的部署与 CI/CD 教程文档 |
| `docker-compose.deploy.yml` | 修改 server/web 服务改用 GHCR 镜像而非本地构建 |
| `.github/workflows/release.yml` | 添加阿里云镜像加速支持、完善部署脚本 |
| `.github/workflows/deploy.yml` | 完善 IMAGE_TAG 变量传递到 docker-compose |
| `apps/web/nginx.conf` | 添加 gzip 压缩、client_max_body_size、安全头 |

## 实施步骤

1. 创建 `docs/deployment.md` 完整文档
2. 更新 `docker-compose.deploy.yml` 支持从 GHCR 拉取镜像
3. 更新 `.github/workflows/release.yml` 完善部署逻辑
4. 更新 `.github/workflows/deploy.yml` 传递 IMAGE_TAG
5. 更新 `apps/web/nginx.conf` 生产优化
