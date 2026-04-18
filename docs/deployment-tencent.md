# 腾讯云轻量应用服务器部署与 GitHub CI/CD 持续集成教程

本教程涵盖从腾讯云轻量应用服务器购买到 GitHub CI/CD 完整配置的全流程，帮助你实现代码推送后自动构建、测试、打包 Docker 镜像并部署到生产环境。

> 💰 **轻量服务器优势**：套餐制计费，2核4G 低至 **¥58/月**（含 600GB 月流量），无需额外配置带宽和 VPC，开箱即用，非常适合个人开发者和初创团队。

---

## 目录

- [第一部分：腾讯云轻量服务器准备](#第一部分腾讯云轻量服务器准备)
  - [1. 购买与选型](#1-购买与选型)
  - [2. 服务器初始化](#2-服务器初始化)
  - [3. 域名与 HTTPS（可选）](#3-域名与-https可选)
- [第二部分：项目部署配置](#第二部分项目部署配置)
  - [4. 服务器端项目目录准备](#4-服务器端项目目录准备)
  - [5. 环境变量配置详解](#5-环境变量配置详解)
  - [6. Docker Compose 部署](#6-docker-compose-部署)
  - [7. 生产环境优化](#7-生产环境优化)
- [第三部分：GitHub CI/CD 配置](#第三部分github-cicd-配置)
  - [8. GitHub 仓库 Secrets 配置](#8-github-仓库-secrets-配置)
  - [9. GitHub Environments 配置](#9-github-environments-配置)
  - [10. CI 工作流详解](#10-ci-工作流详解)
  - [11. Release 工作流详解](#11-release-工作流详解)
  - [12. 手动部署工作流详解](#12-手动部署工作流详解)
- [第四部分：部署流程操作指南](#第四部分部署流程操作指南)
  - [13. 首次完整部署步骤](#13-首次完整部署步骤)
  - [14. 日常运维操作](#14-日常运维操作)
  - [15. 监控与告警](#15-监控与告警)
- [第五部分：故障排查](#第五部分故障排查)
  - [16. 轻量服务器常见问题](#16-轻量服务器常见问题)
  - [17. 通用故障排查](#17-通用故障排查)

---

## 第一部分：腾讯云轻量服务器准备

### 1. 购买与选型

腾讯云轻量应用服务器采用套餐制（CPU + 内存 + SSD + 带宽 + 流量打包），性价比极高：

| 配置 | SSD | 带宽 | 月流量 | 价格 | 适合场景 |
|------|-----|------|--------|------|---------|
| 2核2G | 40 GB | 4 Mbps | 300 GB | ¥34/月 | 个人博客/测试 |
| **2核4G** | **60 GB** | **6 Mbps** | **600 GB** | **¥58/月** | **小团队日常使用（推荐）** |
| 4核8G | 100 GB | 10 Mbps | 1200 GB | ¥128/月 | 生产环境/多人协作 |

> **推荐配置**：2核4G 套餐（¥58/月），Docker 容器合计约需 3-4 GB 内存，配合 4GB Swap 完全够用。

> **购买路径**：[腾讯云轻量应用服务器](https://cloud.tencent.com/product/lighthouse) → 立即购买 → 选择地域（推荐广州/上海）→ 选择套餐 → 操作系统选 **Ubuntu 22.04 LTS**

#### 操作系统选择

选择 **Ubuntu 22.04 LTS**，长期支持版本，社区资源丰富。

> **注意**：轻量服务器购买时选择"系统镜像"而非"应用镜像"，应用镜像预装了不需要的软件。

#### 轻量服务器 vs CVM 区别

| 对比项 | 轻量应用服务器 | 云服务器 CVM |
|--------|--------------|-------------|
| 计费方式 | 套餐制（打包价） | 按需配置（CPU/内存/带宽分别计费） |
| 网络 | 不支持 VPC，自带公网 IP | 支持 VPC，可配置内网 |
| 防火墙 | 控制台防火墙 | 安全组 |
| 扩展性 | 不可升级配置（需更换套餐） | 可随时升降配 |
| 适用场景 | 个人/小团队，流量可预估 | 企业级，需要 VPC 和弹性伸缩 |

> **结论**：部署本项目轻量服务器完全够用，且性价比远超 CVM。

#### 防火墙配置

轻量服务器使用**控制台防火墙**（不是安全组），在购买后需配置入站规则：

**操作路径**：腾讯云控制台 → 轻量应用服务器 → 点击实例 → 防火墙 → 添加规则

| 协议 | 端口 | 来源 | 策略 | 说明 |
|------|------|------|------|------|
| TCP | 22 | 你的 IP/32 | 允许 | SSH 登录 |
| TCP | 80 | 0.0.0.0/0 | 允许 | HTTP（Nginx） |
| TCP | 443 | 0.0.0.0/0 | 允许 | HTTPS（Nginx） |
| TCP | 8082 | 你的 IP/32 | 允许 | API 直连（调试用，可选） |
| TCP | 3000 | 你的 IP/32 | 允许 | Grafana（可选） |
| TCP | 9090 | 你的 IP/32 | 允许 | Prometheus（可选） |

> **安全提示**：不要将 5433（PostgreSQL）端口暴露到公网。数据库仅在 Docker 内部网络通信。

> **轻量服务器注意**：防火墙规则在控制台配置，无需在系统内使用 ufw。如果同时配置了控制台防火墙和 ufw，可能导致端口不通。

---

### 2. 服务器初始化

#### 2.1 SSH 密钥登录配置

**方式一：控制台绑定密钥（推荐）**

1. 腾讯云控制台 → 轻量应用服务器 → 密钥对 → 创建密钥
2. 下载自动生成的私钥文件（`.pem` 格式）
3. 选择刚创建的密钥 → 绑定实例 → 选择你的轻量服务器实例
4. 实例会自动重启以应用密钥

```bash
# 修改私钥文件权限
chmod 400 ~/Downloads/your-key.pem

# 登录服务器
ssh -i ~/Downloads/your-key.pem root@<服务器IP>
```

**方式二：手动配置**

```bash
# 本地机器生成密钥对
ssh-keygen -t ed25519 -C "your-email@example.com" -f ~/.ssh/tencent_deploy

# 将公钥上传到服务器
ssh-copy-id -i ~/.ssh/tencent_deploy.pub root@<服务器IP>

# 登录服务器
ssh -i ~/.ssh/tencent_deploy root@<服务器IP>
```

登录后禁用密码登录：

```bash
sudo sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/^#*PermitRootLogin.*/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config
sudo systemctl restart sshd
```

#### 2.2 系统更新与基础软件安装

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git htop unzip wget software-properties-common apt-transport-https ca-certificates
```

#### 2.3 Docker + Docker Compose 安装

```bash
# 添加 Docker 官方 GPG 密钥
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# 添加 Docker 仓库
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装 Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 验证安装
docker --version
docker compose version

# 配置 Docker 开机自启
sudo systemctl enable docker
sudo systemctl start docker
```

#### 2.4 Docker 网络与镜像加速配置

轻量服务器不支持 VPC 网络，Docker 的 bridge 网络可能与轻量服务器的网络配置冲突。需要配置 DNS 和镜像加速：

```bash
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<EOF
{
  "dns": ["183.60.83.19", "183.60.82.98"],
  "registry-mirrors": [
    "https://mirror.ccs.tencentyun.com"
  ]
}
EOF
sudo systemctl daemon-reload
sudo systemctl restart docker
```

> **说明**：
> - `dns`：腾讯云内网 DNS，解决轻量服务器 Docker 容器无法解析域名的问题
> - `registry-mirrors`：腾讯云镜像加速，拉取 Docker Hub 镜像更快

#### 2.5 Swap 分区配置（必做）

轻量服务器内存有限（2G 或 4G），必须配置 Swap 防止 OOM：

```bash
# 创建 4GB swap
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 持久化
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 优化 swappiness（更积极地使用 swap）
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

> **2G 内存特别注意**：如果使用 2核2G 套餐，建议创建 6GB swap，并将 swappiness 设为 20：
> ```bash
> sudo fallocate -l 6G /swapfile
> echo 'vm.swappiness=20' | sudo tee -a /etc/sysctl.conf
> ```

#### 2.6 创建部署用户

```bash
# 创建用户
sudo adduser deploy
sudo usermod -aG docker deploy

# 配置 SSH 密钥
sudo mkdir -p /home/deploy/.ssh
sudo cp ~/.ssh/authorized_keys /home/deploy/.ssh/
sudo chown -R deploy:deploy /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh
sudo chmod 600 /home/deploy/.ssh/authorized_keys

# 测试登录
ssh -i ~/.ssh/tencent_deploy deploy@<服务器IP>
```

---

### 3. 域名与 HTTPS（可选）

#### 3.1 DNSPod 域名解析

腾讯云使用 DNSPod（已被腾讯云收购）作为域名解析服务：

1. 登录 [DNSPod 控制台](https://console.dnspod.cn/)
2. 添加域名（可在腾讯云购买域名，或从其他注册商转入）
3. 添加解析记录：

| 记录类型 | 主机记录 | 记录值 | TTL |
|---------|---------|--------|-----|
| A | @ | 服务器 IP | 默认 |
| A | www | 服务器 IP | 默认 |
| CNAME | docs | your-domain.com | 默认（可选） |

#### 3.2 腾讯云免费 SSL 证书

1. 登录 [SSL 证书控制台](https://console.cloud.tencent.com/ssl)
2. 点击"申请免费证书"
3. 选择 DV 免费证书（有效期 1 年，可续期）
4. 填写域名，选择 DNS 验证
5. 在 DNSPod 添加验证 TXT 记录
6. 等待签发（通常 10 分钟内）

#### 3.3 Nginx 反向代理 + SSL 终止

如果使用域名 + HTTPS，需要在宿主机安装 Nginx 作为 SSL 终止层：

```bash
sudo apt install -y nginx
```

下载证书后，创建 `/etc/nginx/sites-available/lcw-docs`：

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # 腾讯云 SSL 证书路径（下载 Nginx 格式证书后上传）
    ssl_certificate /etc/nginx/ssl/your-domain.com_bundle.crt;
    ssl_certificate_key /etc/nginx/ssl/your-domain.com.key;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # 前端 + API 代理
    location / {
        proxy_pass http://127.0.0.1:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket 代理
    location /doc-yjs- {
        proxy_pass http://127.0.0.1:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400;
    }
}
```

```bash
# 上传证书
sudo mkdir -p /etc/nginx/ssl
sudo cp your-domain.com_bundle.crt your-domain.com.key /etc/nginx/ssl/
sudo chmod 600 /etc/nginx/ssl/*

# 启用站点
sudo ln -s /etc/nginx/sites-available/lcw-docs /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

> **注意**：如果使用宿主机 Nginx 做 SSL 终止，Docker 容器中的 web 服务端口 80 只需绑定到 `127.0.0.1:80:80`，不对外暴露。

---

## 第二部分：项目部署配置

### 4. 服务器端项目目录准备

```bash
# 切换到部署用户
su - deploy

# 创建项目目录
mkdir -p /home/deploy/lcw-docs
cd /home/deploy/lcw-docs

# 克隆仓库（浅克隆，节省空间）
git clone --depth 1 https://github.com/<your-username>/lcw-docs.git .

# 或者只克隆部署所需文件
# git clone --depth 1 --filter=blob:none --sparse https://github.com/<your-username>/lcw-docs.git .
# git sparse-checkout set docker-compose.deploy.yml monitoring .env.example
```

#### 目录结构

```
/home/deploy/lcw-docs/
├── docker-compose.deploy.yml   # 部署编排文件
├── .env                        # 生产环境变量（不纳入版本控制）
├── monitoring/
│   └── prometheus.yml          # Prometheus 配置
└── backups/                    # 数据库备份目录
```

### 5. 环境变量配置详解

创建 `.env` 文件：

```bash
cd /home/deploy/lcw-docs
nano .env
```

#### 必需变量

```env
# 数据库（Docker 内部网络，host 为服务名 postgres）
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=lcw_docs
DB_PASSWORD=<强密码，建议 32 位随机字符串>
DB_DATABASE=lcw_docs

# JWT 密钥（必须修改！）
JWT_SECRET=<使用下方命令生成>

# CORS 允许的前端域名
CORS_ORIGINS=https://your-domain.com,http://your-domain.com
```

#### 生成安全密钥

```bash
# 生成 JWT_SECRET
openssl rand -hex 32

# 生成数据库密码
openssl rand -hex 16
```

#### 可选变量

```env
# AI 功能（MiniMax）
MINIMAX_API_KEY=your-minimax-api-key

# Sentry 错误追踪
SENTRY_DSN=https://xxx@sentry.io/xxx

# Redis（Bull 队列需要，暂未使用）
REDIS_HOST=localhost
REDIS_PORT=6379

# Grafana 管理员密码
GRAFANA_PASSWORD=<强密码>
```

> **安全提示**：`.env` 文件权限应设为 `chmod 600 .env`，仅部署用户可读写。

### 6. Docker Compose 部署

#### 6.1 架构说明

```
┌─────────────────────────────────────────────────────────────┐
│                   docker-compose.deploy.yml                  │
│                                                             │
│  :80 ──────►  ┌──────────┐    ┌──────────────┐            │
│  (Nginx)      │   Web    │    │    Server    │            │
│               │ (Nginx)  │───►│  (NestJS)    │            │
│               │   :80    │    │   :8082      │            │
│               └──────────┘    └──────┬───────┘            │
│                                      │                     │
│                               ┌──────▼───────┐            │
│                               │  PostgreSQL  │            │
│                               │   :5432      │            │
│                               └──────────────┘            │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐                       │
│  │  Prometheus  │  │   Grafana    │                       │
│  │   :9090      │  │   :3000      │                       │
│  └──────────────┘  └──────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

- **Web (Nginx)**：前端静态文件 + API 反向代理 + WebSocket 代理
- **Server (NestJS)**：后端 API 服务，端口 8082
- **PostgreSQL**：数据库，仅在 Docker 内部网络通信
- **Prometheus**：指标采集，从 Server 的 `/api/metrics` 端点抓取
- **Grafana**：监控仪表盘

#### 6.2 首次部署命令

```bash
cd /home/deploy/lcw-docs

# 拉取镜像并启动
docker compose -f docker-compose.deploy.yml --env-file .env up -d

# 查看容器状态
docker compose -f docker-compose.deploy.yml ps

# 查看 Server 日志
docker compose -f docker-compose.deploy.yml logs -f server
```

#### 6.3 数据持久化

Docker Compose 定义了 3 个命名卷：

| 卷名 | 挂载点 | 用途 |
|------|--------|------|
| `postgres_data` | `/var/lib/postgresql/data` | 数据库数据 |
| `prometheus_data` | `/prometheus` | 监控指标存储 |
| `grafana_data` | `/var/lib/grafana` | 仪表盘配置 |

这些卷在 `docker compose down` 时不会被删除，只有 `docker compose down -v` 才会清除。

#### 6.4 数据库初始化

项目使用 TypeORM，首次启动时：

- **开发环境**：`synchronize: true`，自动创建表结构
- **生产环境**：`synchronize: false`，需要手动处理

首次部署时，临时启用 synchronize 初始化数据库：

```bash
# 在 .env 中临时添加
DB_SYNCHRONIZE=true

# 启动服务
docker compose -f docker-compose.deploy.yml --env-file .env up -d server

# 等待数据库初始化完成（查看日志确认）
docker compose -f docker-compose.deploy.yml logs -f server

# 初始化完成后，移除 DB_SYNCHRONIZE
# 从 .env 中删除 DB_SYNCHRONIZE=true

# 重启 server
docker compose -f docker-compose.deploy.yml --env-file .env up -d server
```

> **重要**：生产环境切勿长期开启 `DB_SYNCHRONIZE=true`，可能导致数据丢失。

### 7. 生产环境优化

#### 7.1 docker-compose.deploy.yml 使用 GHCR 镜像

CI/CD 流程会将 Docker 镜像推送到 GitHub Container Registry (GHCR)，部署时直接拉取预构建镜像，无需在服务器上构建：

```yaml
# 替换本地构建为远程镜像
server:
  image: ghcr.io/<your-username>/lcw-docs/server:${IMAGE_TAG:-latest}
  # 移除 build 配置

web:
  image: ghcr.io/<your-username>/lcw-docs/web:${IMAGE_TAG:-latest}
  # 移除 build 配置
```

#### 7.2 PostgreSQL 安全加固

```yaml
postgres:
  environment:
    POSTGRES_USER: ${DB_USERNAME:-lcw_docs}
    POSTGRES_PASSWORD: ${DB_PASSWORD:?请设置数据库密码}
    POSTGRES_DB: ${DB_DATABASE:-lcw_docs}
  # 不暴露端口到宿主机
  ports: []
```

#### 7.3 日志管理（轻量服务器内存优化）

轻量服务器磁盘和内存有限，日志管理尤为重要：

```yaml
services:
  server:
    logging:
      driver: json-file
      options:
        max-size: "20m"
        max-file: "3"
  web:
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "2"
  postgres:
    logging:
      driver: json-file
      options:
        max-size: "20m"
        max-file: "3"
```

> **2G 内存优化**：如果使用 2核2G 套餐，建议将 `max-size` 减半，并减少 `max-file` 数量。

#### 7.4 Docker 镜像加速

轻量服务器使用腾讯云公网镜像加速：

```bash
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<EOF
{
  "dns": ["183.60.83.19", "183.60.82.98"],
  "registry-mirrors": [
    "https://mirror.ccs.tencentyun.com"
  ]
}
EOF
sudo systemctl daemon-reload
sudo systemctl restart docker
```

> **注意**：轻量服务器不支持 VPC，无法使用 TCR 内网拉取。GHCR 镜像需通过公网拉取，如果拉取缓慢，参考 [第 17 节](#17-通用故障排查) 的镜像拉取失败解决方案。

---

## 第三部分：GitHub CI/CD 配置

### 8. GitHub 仓库 Secrets 配置

在 GitHub 仓库 → Settings → Secrets and variables → Actions 中添加以下 Secrets：

| Secret 名称 | 用途 | 示例值 |
|---|---|---|
| `DEPLOY_HOST` | 服务器公网 IP | `43.xxx.xxx.xxx` |
| `DEPLOY_USER` | SSH 用户名 | `deploy` |
| `DEPLOY_SSH_KEY` | SSH 私钥 | 见下方生成步骤 |
| `DEPLOY_PATH` | 服务器项目路径 | `/home/deploy/lcw-docs` |
| `DEPLOY_ENV` | 完整 .env 文件内容 | 见下方格式 |

#### 生成 SSH 密钥对

```bash
# 专门为 GitHub Actions 部署生成密钥
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy

# 将公钥添加到服务器
ssh-copy-id -i ~/.ssh/github_actions_deploy.pub deploy@<服务器IP>

# 私钥内容添加到 GitHub Secret DEPLOY_SSH_KEY
cat ~/.ssh/github_actions_deploy
```

#### DEPLOY_ENV 格式

将完整的 `.env` 文件内容作为 Secret 值：

```
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=lcw_docs
DB_PASSWORD=your-strong-password
DB_DATABASE=lcw_docs
JWT_SECRET=your-jwt-secret
CORS_ORIGINS=https://your-domain.com
MINIMAX_API_KEY=your-key
GRAFANA_PASSWORD=your-grafana-password
```

### 9. GitHub Environments 配置

在 GitHub 仓库 → Settings → Environments 中创建：

#### staging 环境

- **保护规则**：无特殊要求
- **Secrets**：可使用与 production 不同的 `DEPLOY_HOST`、`DEPLOY_ENV` 等

#### production 环境

- **保护规则**：
  - ✅ Required reviewers（添加你自己或团队负责人）
  - ✅ Wait timer：0 分钟
  - ✅ Deployment branches：Only `main` 分支
- **Secrets**：使用生产环境的 `DEPLOY_HOST`、`DEPLOY_ENV` 等

### 10. CI 工作流详解

文件：`.github/workflows/ci.yml`

#### 触发条件

```yaml
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
```

- 推送到 `main` 或 `develop` 分支时触发
- 向这两个分支提交 PR 时触发
- 并发控制：同一分支的 CI 会取消前一次运行

#### Job 1：lint-and-typecheck

```yaml
lint-and-typecheck:
  steps:
    - pnpm install --frozen-lockfile  # 严格按 lockfile 安装
    - pnpm lint                        # ESLint 检查
    - pnpm typecheck                   # TypeScript 类型检查
```

#### Job 2：test

```yaml
test:
  steps:
    - pnpm install --frozen-lockfile
    - pnpm --filter @lcw-doc/core build  # 先构建 core（测试依赖）
    - pnpm --filter @lcw-doc/core test:coverage  # 运行测试并生成覆盖率
```

#### Job 3-4：build-server / build-web

```yaml
build-server:
  needs: [lint-and-typecheck]  # 依赖 lint 通过
  steps:
    - pnpm --filter @lcw-doc/core build && pnpm --filter @lcw-doc/server build
    - upload artifact: apps/server/dist/

build-web:
  needs: [lint-and-typecheck]
  steps:
    - pnpm --filter @lcw-doc/core build
    - pnpm --filter @lcw-doc/react build
    - pnpm --filter @lcw-doc/shadcn build
    - pnpm --filter @lcw-doc/web build
    - upload artifact: apps/web/dist/
```

> **构建顺序说明**：monorepo 依赖链为 `core → react → shadcn → web`，必须按顺序构建。

#### Job 5：docker-build

```yaml
docker-build:
  needs: [lint-and-typecheck]
  steps:
    - docker build server  # 仅验证构建，不推送
    - docker build web     # 仅验证构建，不推送
```

### 11. Release 工作流详解

文件：`.github/workflows/release.yml`

#### 触发方式

```bash
# 创建版本标签触发
git tag v1.0.0
git push origin v1.0.0
```

#### 流程

```
打 tag → 构建 Docker 镜像 → 推送到 GHCR → SSH 部署到服务器
```

#### Job 1：build-and-push

1. 登录 GHCR（使用 `GITHUB_TOKEN`，自动提供）
2. 构建 server 和 web Docker 镜像
3. 推送到 `ghcr.io/<owner>/lcw-docs/server:v1.0.0` 和 `ghcr.io/<owner>/lcw-docs/web:v1.0.0`
4. 使用 GitHub Actions 缓存加速构建

#### Job 2：deploy

1. 通过 SSH 连接到腾讯云轻量服务器
2. 写入 `.env` 文件
3. 拉取最新镜像
4. 重启容器
5. 清理旧镜像

#### 版本回滚

```bash
# 回滚到指定版本
# 方法 1：在 GitHub Actions 中手动触发 deploy.yml，指定旧 tag
# 方法 2：SSH 到服务器手动操作
ssh deploy@<服务器IP>
cd /home/deploy/lcw-docs
IMAGE_TAG=v0.9.0 docker compose -f docker-compose.deploy.yml up -d
```

### 12. 手动部署工作流详解

文件：`.github/workflows/deploy.yml`

#### 触发方式

在 GitHub 仓库 → Actions → Deploy → Run workflow：

- **environment**：选择 `staging` 或 `production`
- **image_tag**：输入 Docker 镜像 tag（如 `v1.0.0`、`latest`）

#### 适用场景

- 紧急修复后手动部署
- 回滚到历史版本
- 部署到 staging 环境测试

---

## 第四部分：部署流程操作指南

### 13. 首次完整部署步骤

#### Step 1：服务器准备

完成 [第一部分](#第一部分腾讯云轻量服务器准备) 的所有步骤，确保：
- ✅ 服务器可通过 SSH 密钥登录
- ✅ Docker 和 Docker Compose 已安装
- ✅ 控制台防火墙已配置
- ✅ Swap 已配置
- ✅ Docker DNS 和镜像加速已配置

#### Step 2：仓库配置

```bash
# 在服务器上
ssh deploy@<服务器IP>
mkdir -p /home/deploy/lcw-docs
cd /home/deploy/lcw-docs

# 克隆仓库
git clone --depth 1 https://github.com/<your-username>/lcw-docs.git .

# 创建 .env
nano .env
chmod 600 .env
```

#### Step 3：GitHub Secrets 设置

在 GitHub 仓库设置中添加所有必需的 Secrets（见 [第 8 节](#8-github-仓库-secrets-配置)）。

#### Step 4：推送代码触发 CI

```bash
# 本地推送代码到 main 分支
git push origin main

# 在 GitHub Actions 页面确认 CI 通过
```

#### Step 5：打 tag 触发部署

```bash
# 首次部署
git tag v0.1.0
git push origin v0.1.0

# GitHub Actions 会自动：
# 1. 构建 Docker 镜像
# 2. 推送到 GHCR
# 3. SSH 部署到服务器
```

#### Step 6：验证部署

```bash
# 检查容器状态
ssh deploy@<服务器IP>
docker compose -f /home/deploy/lcw-docs/docker-compose.deploy.yml ps

# 测试 API
curl http://<服务器IP>/api/health

# 测试前端
curl -I http://<服务器IP>/
```

### 14. 日常运维操作

#### 更新部署

```bash
# 本地打新 tag
git tag v1.1.0
git push origin v1.1.0
# GitHub Actions 自动部署
```

#### 手动回滚

```bash
# 在 GitHub Actions 页面手动触发 Deploy workflow
# 选择 production 环境，输入旧版本 tag（如 v1.0.0）
```

#### 查看日志

```bash
ssh deploy@<服务器IP>
cd /home/deploy/lcw-docs

# 查看所有服务日志
docker compose -f docker-compose.deploy.yml logs --tail=100

# 查看特定服务日志
docker compose -f docker-compose.deploy.yml logs -f server
docker compose -f docker-compose.deploy.yml logs -f web
docker compose -f docker-compose.deploy.yml logs -f postgres
```

#### 数据库备份与恢复

```bash
# 备份
docker compose -f docker-compose.deploy.yml exec postgres \
  pg_dump -U lcw_docs lcw_docs > backup_$(date +%Y%m%d_%H%M%S).sql

# 恢复
docker compose -f docker-compose.deploy.yml exec -T postgres \
  psql -U lcw_docs lcw_docs < backup_20260417_120000.sql
```

#### 自动备份（Cron）

```bash
# 编辑 crontab
crontab -e

# 每天凌晨 3 点备份
0 3 * * * cd /home/deploy/lcw-docs && docker compose -f docker-compose.deploy.yml exec -T postgres pg_dump -U lcw_docs lcw_docs > /home/deploy/lcw-docs/backups/backup_$(date +\%Y\%m\%d).sql

# 保留最近 30 天备份
0 4 * * * find /home/deploy/lcw-docs/backups -name "backup_*.sql" -mtime +30 -delete
```

#### 重启服务

```bash
cd /home/deploy/lcw-docs

# 重启所有服务
docker compose -f docker-compose.deploy.yml restart

# 仅重启 server
docker compose -f docker-compose.deploy.yml restart server

# 拉取最新镜像并重启
docker compose -f docker-compose.deploy.yml pull
docker compose -f docker-compose.deploy.yml up -d --remove-orphans
docker image prune -f
```

### 15. 监控与告警

#### Prometheus 指标采集

Server 内置了 `/api/metrics` 端点，Prometheus 每 15 秒抓取一次：

```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'lcw-docs-server'
    static_configs:
      - targets: ['server:8082']
    metrics_path: '/api/metrics'
```

#### Grafana 仪表盘

1. 访问 `http://<服务器IP>:3000`
2. 默认账号 `admin`，密码为 `.env` 中的 `GRAFANA_PASSWORD`
3. 添加数据源：Prometheus，URL 填 `http://prometheus:9090`
4. 导入仪表盘或自定义面板

> **轻量服务器注意**：2核2G 套餐建议不部署 Prometheus + Grafana，它们会额外占用约 500MB 内存。可仅使用 `/api/health` 健康检查端点。

#### 健康检查端点

```bash
# 基本健康检查
curl http://<服务器IP>/api/health

# 就绪检查
curl http://<服务器IP>/api/health/ready

# 存活检查
curl http://<服务器IP>/api/health/live
```

---

## 第五部分：故障排查

### 16. 轻量服务器常见问题

#### Docker 容器无法访问外网

**症状**：容器内 `apt update`、`npm install` 等操作失败，DNS 解析超时

**原因**：轻量服务器不支持 VPC 网络，Docker 的 bridge 网络默认 DNS 配置可能不生效

**解决方案**：

```bash
# 方案 A：配置 Docker DNS（推荐，已在 2.4 节配置）
sudo tee /etc/docker/daemon.json <<EOF
{
  "dns": ["183.60.83.19", "183.60.82.98"],
  "registry-mirrors": [
    "https://mirror.ccs.tencentyun.com"
  ]
}
EOF
sudo systemctl restart docker

# 方案 B：使用 host 网络模式（在 docker-compose.deploy.yml 中）
# services:
#   server:
#     network_mode: host
#     # 移除 ports 映射
```

#### 月流量超限

**症状**：服务器突然无法访问，控制台显示流量已用完

**原因**：轻量服务器套餐有月流量限制（2核4G 为 600GB/月）

**解决方案**：

1. **短期**：在控制台购买流量包（¥0.8/GB）
2. **长期**：
   - 升级到更高流量套餐
   - 使用 CDN（腾讯云 CDN 免费额度 10GB/月）
   - 优化 Nginx 开启 gzip 压缩（已在 nginx.conf 中配置）
   - 减少不必要的监控数据传输

**流量监控**：腾讯云控制台 → 轻量应用服务器 → 点击实例 → 流量监控

#### 端口不通

**症状**：服务已启动但外部无法访问

**排查步骤**：

1. 检查控制台防火墙是否放行对应端口
2. 检查 Docker 容器端口映射是否正确
3. 检查服务是否绑定到 `0.0.0.0` 而非 `127.0.0.1`

```bash
# 检查端口监听
sudo ss -tlnp | grep -E '80|443|8082'

# 检查 Docker 端口映射
docker compose -f docker-compose.deploy.yml ps
```

> **轻量服务器注意**：控制台防火墙和系统 ufw 不要同时配置，可能导致端口不通。轻量服务器建议只用控制台防火墙。

#### 内存不足导致 OOM Kill

**症状**：Docker 容器频繁重启，`dmesg` 显示 `Out of memory: Killed process`

**解决方案**：

```bash
# 1. 确认 Swap 已配置
free -h

# 2. 增加 Swap（如果不够）
sudo swapoff /swapfile
sudo fallocate -l 6G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 3. 限制容器内存（在 docker-compose.deploy.yml 中）
# services:
#   server:
#     deploy:
#       resources:
#         limits:
#           memory: 1G
#   postgres:
#     deploy:
#       resources:
#         limits:
#           memory: 512M

# 4. 2G 内存套餐建议不部署 Prometheus + Grafana
```

#### 磁盘空间不足

**症状**：Docker 操作失败，日志写入失败

```bash
# 检查磁盘使用
df -h

# 清理 Docker 资源
docker system prune -a --volumes

# 检查大文件
du -sh /var/lib/docker/*
du -sh /home/deploy/lcw-docs/backups/*
```

> **轻量服务器磁盘有限**：2核2G 只有 40GB SSD，2核4G 只有 60GB SSD。定期清理旧备份和 Docker 镜像。

### 17. 通用故障排查

#### CI 构建失败

**症状**：GitHub Actions CI Job 报红

**排查步骤**：
1. 点击失败的 Job 查看详细日志
2. 常见原因：
   - `pnpm install --frozen-lockfile` 失败 → 本地执行 `pnpm install` 更新 lockfile 后提交
   - TypeScript 类型错误 → 本地执行 `pnpm typecheck` 修复
   - ESLint 错误 → 本地执行 `pnpm lint` 修复
   - 构建失败 → 检查依赖链是否完整构建

#### Docker 镜像拉取失败

**症状**：部署时 `docker compose pull` 报错

**原因**：中国大陆服务器访问 GHCR 可能不稳定

**解决方案**：

1. **方案 A：手动导入**
   ```bash
   # 在能访问 GHCR 的机器上拉取
   docker pull ghcr.io/<owner>/lcw-docs/server:v1.0.0
   docker pull ghcr.io/<owner>/lcw-docs/web:v1.0.0

   # 导出
   docker save ghcr.io/<owner>/lcw-docs/server:v1.0.0 | gzip > server-v1.0.0.tar.gz
   docker save ghcr.io/<owner>/lcw-docs/web:v1.0.0 | gzip > web-v1.0.0.tar.gz

   # 上传到服务器
   scp server-v1.0.0.tar.gz web-v1.0.0.tar.gz deploy@<服务器IP>:/tmp/

   # 在服务器上导入
   ssh deploy@<服务器IP>
   docker load < /tmp/server-v1.0.0.tar.gz
   docker load < /tmp/web-v1.0.0.tar.gz
   ```

2. **方案 B：服务器本地构建**
   ```bash
   # 在服务器上克隆代码并构建
   cd /home/deploy/lcw-docs
   docker compose -f docker-compose.deploy.yml build
   docker compose -f docker-compose.deploy.yml up -d
   ```

#### 数据库连接失败

**症状**：Server 日志显示 `Connection refused` 或 `ECONNREFUSED`

**排查步骤**：
```bash
# 检查 postgres 容器是否健康
docker compose -f docker-compose.deploy.yml ps postgres

# 检查 server 能否解析 postgres 主机名
docker compose -f docker-compose.deploy.yml exec server ping postgres

# 检查环境变量
docker compose -f docker-compose.deploy.yml exec server env | grep DB_
```

**常见原因**：
- `DB_HOST` 不是 `postgres`（Docker 内部服务名）
- postgres 容器未启动或健康检查未通过
- 密码不匹配

#### WebSocket 连接问题

**症状**：协同编辑功能不工作，浏览器控制台显示 WebSocket 连接失败

**排查步骤**：
1. 检查 Nginx WebSocket 代理配置是否包含 `/doc-yjs-` 路径
2. 检查 `proxy_read_timeout` 是否足够大（建议 86400s）
3. 检查前端 `VITE_WS_HOST` 配置

```bash
# 测试 WebSocket 连接
curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Version: 13" \
  -H "Sec-WebSocket-Key: test" \
  http://<服务器IP>/doc-yjs-test
```

#### Nginx 502/504 错误

**症状**：浏览器显示 502 Bad Gateway 或 504 Gateway Timeout

**排查步骤**：
```bash
# 检查 server 容器是否运行
docker compose -f docker-compose.deploy.yml ps server

# 检查 server 日志
docker compose -f docker-compose.deploy.yml logs --tail=50 server

# 检查 Nginx 配置中的代理地址
docker compose -f docker-compose.deploy.yml exec web cat /etc/nginx/conf.d/default.conf
```

**常见原因**：
- Server 容器崩溃或未启动
- Server 正在重启（等待健康检查）
- 内存不足导致 OOM Kill

---

## 附录

### A. 端口速查表

| 服务 | 容器端口 | 宿主机端口 | 是否对外 | 控制台防火墙 |
|------|---------|-----------|---------|-------------|
| Web (Nginx) | 80 | 80 | ✅ | 需放行 |
| Server (NestJS) | 8082 | 8082 | 可选（调试） | 需放行 |
| PostgreSQL | 5432 | 不暴露 | ❌ | 无需放行 |
| Prometheus | 9090 | 9090 | 可选 | 需放行 |
| Grafana | 3000 | 3000 | 可选 | 需放行 |

### B. 腾讯云轻量 vs 阿里云轻量对比

| 对比项 | 腾讯云轻量 | 阿里云轻量 |
|--------|-----------|-----------|
| 2核4G 月价 | **¥58/月** | ¥60/月 |
| 2核4G 月流量 | 600 GB | 600 GB |
| 2核4G 带宽 | 6 Mbps | 5 Mbps |
| Docker 镜像加速 | `mirror.ccs.tencentyun.com` | `<id>.mirror.aliyuncs.com` |
| 域名服务 | DNSPod | 万网 |
| 免费SSL | 有 | 有 |
| 控制台体验 | 简洁 | 功能丰富 |
| 新客优惠 | 更多 | 较少 |

### C. 常用命令速查

```bash
# 部署
docker compose -f docker-compose.deploy.yml --env-file .env up -d

# 查看状态
docker compose -f docker-compose.deploy.yml ps

# 查看日志
docker compose -f docker-compose.deploy.yml logs -f [service]

# 重启服务
docker compose -f docker-compose.deploy.yml restart [service]

# 拉取最新镜像
docker compose -f docker-compose.deploy.yml pull

# 停止所有服务
docker compose -f docker-compose.deploy.yml down

# 停止并删除数据卷（危险！）
docker compose -f docker-compose.deploy.yml down -v

# 数据库备份
docker compose -f docker-compose.deploy.yml exec -T postgres pg_dump -U lcw_docs lcw_docs > backup.sql

# 进入容器
docker compose -f docker-compose.deploy.yml exec server sh
docker compose -f docker-compose.deploy.yml exec postgres psql -U lcw_docs

# 检查内存使用
free -h
docker stats --no-stream
```

### D. GitHub Actions 工作流触发方式

| 工作流 | 触发方式 | 用途 |
|--------|---------|------|
| CI | push/PR 到 main/develop | 代码质量检查 |
| Release | 推送 `v*.*.*` tag | 构建镜像 + 自动部署 |
| Deploy | 手动触发 | 选择环境 + 版本部署 |
