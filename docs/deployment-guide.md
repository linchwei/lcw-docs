# LCW-Docs 云服务器配置与 GitHub CI/CD 部署指南

> 本文档从零开始，逐步指导你完成云服务器配置和 GitHub CI/CD 自动部署。每一步都包含具体命令，可直接复制执行。

---

## 第一部分：云服务器配置

### 1.1 服务器基础环境

> 以下命令以 `root` 用户登录服务器后执行。腾讯云轻量应用服务器默认用户为 `ubuntu`，需先 `sudo su -` 切换到 root。

```bash
# 切换到 root（如果以 ubuntu 登录）
sudo su -

# 系统更新
apt update && apt upgrade -y

# 安装基础工具
apt install -y curl git wget unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release
```

#### 创建 deploy 用户

```bash
# 创建 deploy 用户
adduser --disabled-password --gecos "" deploy

# 为 deploy 用户设置密码（可选，建议仅用密钥登录）
echo "deploy:$(openssl rand -base64 16)" | chpasswd

# 创建 .ssh 目录
mkdir -p /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chown deploy:deploy /home/deploy/.ssh
```

#### 配置 SSH 密钥登录

```bash
# 在本地电脑生成 SSH 密钥（如果还没有）
# 替换 your-server-ip 为服务器 IP
ssh-keygen -t ed25519 -C "deploy@lcw-docs" -f ~/.ssh/lcw-docs-deploy

# 将公钥上传到服务器
# 在本地电脑执行：
ssh-copy-id -i ~/.ssh/lcw-docs-deploy.pub deploy@your-server-ip

# 或手动添加（在服务器上执行）：
echo "你的公钥内容" >> /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys
chown deploy:deploy /home/deploy/.ssh/authorized_keys
```

#### 配置 sudo 免密

```bash
# 允许 deploy 用户免密使用 sudo
echo "deploy ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/deploy
chmod 440 /etc/sudoers.d/deploy
```

#### 安全加固

```bash
# 编辑 SSH 配置
vi /etc/ssh/sshd_config

# 修改以下配置项：
# PermitRootLogin no          # 禁止 root SSH 登录
# PasswordAuthentication no   # 禁止密码登录（仅密钥）
# PubkeyAuthentication yes    # 启用密钥登录

# 重启 SSH 服务
systemctl restart sshd
```

> ⚠️ 修改 SSH 配置前，请确保你已经能用密钥登录 deploy 用户，否则会被锁在外面！

---

### 1.2 Docker 环境安装

> 以下命令以 `deploy` 用户执行（需要 sudo）。

```bash
# 切换到 deploy 用户
su - deploy

# 安装 Docker（使用官方脚本）
curl -fsSL https://get.docker.com | sudo sh

# 将 deploy 用户加入 docker 组（免 sudo 执行 docker 命令）
sudo usermod -aG docker deploy

# 使组变更生效（需要重新登录）
exit

# 重新以 deploy 用户登录后验证
docker --version
docker compose version
```

#### 配置 Docker 镜像加速（国内服务器推荐）

```bash
# 创建 Docker 配置目录
sudo mkdir -p /etc/docker

# 写入镜像加速配置
sudo tee /etc/docker/daemon.json <<EOF
{
  "registry-mirrors": [
    "https://mirror.ccs.tencentyun.com"
  ]
}
EOF

# 重启 Docker
sudo systemctl daemon-reload
sudo systemctl restart docker
```

#### 配置 Swap（4G 内存服务器推荐）

```bash
# 检查是否已有 swap
swapon --show

# 如果没有 swap，创建 4GB swap 文件
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 持久化 swap（重启后自动挂载）
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 验证
free -h
```

---

### 1.3 项目部署

```bash
# 以 deploy 用户登录服务器
ssh -i ~/.ssh/lcw-docs-deploy deploy@your-server-ip

# 克隆项目代码
cd ~
git clone https://github.com/linchwei/lcw-docs.git
cd lcw-docs
```

#### 生成 .env 配置文件

```bash
# 生成随机密码
DB_PASSWORD=$(openssl rand -hex 16)
JWT_SECRET=$(openssl rand -hex 32)
GRAFANA_PASSWORD=$(openssl rand -hex 12)

# 写入 .env 文件
# 替换 your-server-ip 为服务器 IP
# 替换 your-minimax-api-key 为你的 MiniMax API Key
cat > .env <<EOF
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=lcw_docs
DB_PASSWORD=${DB_PASSWORD}
DB_DATABASE=lcw_docs
JWT_SECRET=${JWT_SECRET}
CORS_ORIGINS=http://your-server-ip
MINIMAX_API_KEY=your-minimax-api-key
GRAFANA_PASSWORD=${GRAFANA_PASSWORD}
EOF

# 设置文件权限（仅 owner 可读写）
chmod 600 .env
```

#### 首次构建并启动（含数据库初始化）

```bash
# 临时启用数据库自动同步
# 修改 docker-compose.local.yml 中的 DB_SYNCHRONIZE 为 "true"
sed -i 's/DB_SYNCHRONIZE: "false"/DB_SYNCHRONIZE: "true"/' docker-compose.local.yml

# 构建并启动所有服务
docker compose -f docker-compose.local.yml build --no-cache server web
docker compose -f docker-compose.local.yml up -d

# 等待服务启动（约 30 秒）
sleep 30

# 验证数据库表已创建
docker exec lcw-docs-postgres psql -U lcw_docs -d lcw_docs -c '\dt'

# 应该看到 13 张表：application, audit_log, collaborator, comment, folder,
# notification, page, page_tag, share, tag, user, version, yjs-writings
```

#### 关闭数据库自动同步并重启

```bash
# 将 DB_SYNCHRONIZE 改回 "false"
sed -i 's/DB_SYNCHRONIZE: "true"/DB_SYNCHRONIZE: "false"/' docker-compose.local.yml

# 重启 server 容器
docker compose -f docker-compose.local.yml up -d server

# 验证服务正常运行
curl -s http://localhost:8082/api/health
# 应返回 {"status":"ok",...}

curl -s -o /dev/null -w '%{http_code}' http://localhost:80
# 应返回 200
```

---

### 1.4 防火墙配置

#### 腾讯云轻量应用服务器

1. 登录 [腾讯云轻量应用服务器控制台](https://console.cloud.tencent.com/lighthouse)
2. 点击目标服务器 → **防火墙** 标签页
3. 添加以下规则：

| 协议 | 端口 | 策略 | 备注 |
|------|------|------|------|
| TCP | 22 | 允许 | SSH 登录 |
| TCP | 80 | 允许 | Web 前端 |
| TCP | 8082 | 允许 | Server API |

> 如果不需要直接访问 API（仅通过 Nginx 反向代理），可以不开放 8082 端口。

---

## 第二部分：GitHub CI/CD 配置

### 2.1 生成 SSH 密钥对

> 在本地电脑执行以下命令。

```bash
# 生成 GitHub Actions 专用的 SSH 密钥对
ssh-keygen -t ed25519 -C "github-actions@lcw-docs" -f ~/.ssh/lcw-docs-github-actions -N ""

# 查看公钥（稍后添加到服务器）
cat ~/.ssh/lcw-docs-github-actions.pub

# 查看私钥（稍后添加到 GitHub Secrets）
cat ~/.ssh/lcw-docs-github-actions
```

#### 将公钥添加到服务器

```bash
# 在服务器上执行（以 deploy 用户登录）
echo "你的公钥内容" >> ~/.ssh/authorized_keys

# 或从本地直接执行
ssh -i ~/.ssh/lcw-docs-deploy deploy@your-server-ip \
  "echo '$(cat ~/.ssh/lcw-docs-github-actions.pub)' >> ~/.ssh/authorized_keys"
```

#### 验证连接

```bash
# 在本地测试 GitHub Actions 密钥能否连接服务器
ssh -i ~/.ssh/lcw-docs-github-actions deploy@your-server-ip "echo '连接成功'"
```

---

### 2.2 GitHub 仓库配置

#### 创建 production 环境

1. 打开 GitHub 仓库：`https://github.com/linchwei/lcw-docs`
2. 进入 **Settings → Environments**
3. 点击 **New environment**
4. 输入名称：`production`
5. 点击 **Add environment**

#### 配置 Secrets

1. 进入 **Settings → Secrets and variables → Actions**
2. 点击 **New repository secret**，逐个添加以下 4 个 Secret：

| Secret 名称 | 值 | 说明 |
|---|---|---|
| `DEPLOY_HOST` | `你的服务器IP` | 服务器公网 IP，如 `106.53.73.48` |
| `DEPLOY_USER` | `deploy` | SSH 登录用户名 |
| `DEPLOY_SSH_KEY` | `-----BEGIN OPENSSH PRIVATE KEY-----\n...\n-----END OPENSSH PRIVATE KEY-----` | 2.1 步生成的私钥完整内容 |
| `DEPLOY_PATH` | `/home/deploy/lcw-docs` | 服务器上项目路径 |

> `DEPLOY_SSH_KEY` 的值是 `cat ~/.ssh/lcw-docs-github-actions` 输出的完整内容，包括首尾的 `-----BEGIN/END OPENSSH PRIVATE KEY-----` 行。

---

### 2.3 CI/CD 工作流说明

项目包含 3 个 GitHub Actions 工作流：

#### ci.yml — 代码质量检查

- **触发条件**：推送到 `main` 或 `develop` 分支，或创建 Pull Request
- **执行内容**：
  1. Lint & TypeCheck — 代码规范和类型检查
  2. Test — 单元测试 + 覆盖率
  3. Build Server — 编译 NestJS 服务端
  4. Build Web — 编译 React 前端
  5. Docker Build Check — 验证 Docker 镜像能成功构建

#### release.yml — Tag 推送自动部署

- **触发条件**：推送 `v*.*.*` 格式的 tag（如 `v1.0.1`）
- **执行内容**：
  1. SSH 连接服务器
  2. 拉取对应 tag 的代码
  3. 重新构建 server 和 web Docker 镜像
  4. 重启容器
  5. 清理旧镜像

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags:
      - 'v*.*.*'

jobs:
  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest
    environment: production

    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_SSH_KEY }}
          script: |
            cd ${{ secrets.DEPLOY_PATH }}
            git fetch --all
            git checkout ${{ github.ref_name }}
            docker compose -f docker-compose.local.yml build --no-cache server web
            docker compose -f docker-compose.local.yml up -d --remove-orphans
            docker image prune -f
            echo "Deployed version ${{ github.ref_name }} successfully"
```

#### deploy.yml — 手动触发部署

- **触发条件**：在 GitHub Actions 页面手动点击 Run workflow
- **执行内容**：拉取 main 分支最新代码，重建并重启

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  workflow_dispatch:

jobs:
  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest
    environment: production

    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_SSH_KEY }}
          script: |
            cd ${{ secrets.DEPLOY_PATH }}
            git fetch --all
            git checkout main
            git pull origin main
            docker compose -f docker-compose.local.yml build --no-cache server web
            docker compose -f docker-compose.local.yml up -d --remove-orphans
            docker image prune -f
            echo "Deployed latest main successfully"
```

---

### 2.4 一键部署命令

项目在 `package.json` 中配置了 3 个部署命令，执行后会自动推送代码并触发 GitHub Actions 部署：

| 命令 | 版本递增 | 示例 |
|------|----------|------|
| `pnpm ship` | patch | 1.0.0 → 1.0.1 |
| `pnpm ship:minor` | minor | 1.0.0 → 1.1.0 |
| `pnpm ship:major` | major | 1.0.0 → 2.0.0 |

#### 执行流程

```
pnpm ship
  │
  ├─ 1. git push origin main        ← 推送最新代码到 main 分支
  │
  ├─ 2. npm version patch           ← 自动递增版本号 + 创建 git tag
  │     （工作区不干净时会报错中止）
  │
  └─ 3. git push origin main --tags ← 推送 tag 到 GitHub
        │
        └─ 4. GitHub Actions release.yml 自动触发
              │
              └─ 5. SSH 到服务器 → git checkout tag → docker build → docker up
```

#### 使用示例

```bash
# 日常 bug 修复或小改动
pnpm ship

# 新功能发布
pnpm ship:minor

# 大版本升级（有破坏性变更）
pnpm ship:major
```

> ⚠️ 执行前请确保所有更改已 commit，否则 `npm version` 会报错中止。

---

## 附录

### A. 常用运维命令

```bash
# 查看容器状态
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'

# 查看 server 日志
docker logs lcw-docs-server --tail 50 -f

# 查看 web 日志
docker logs lcw-docs-web --tail 50 -f

# 重启 server
docker compose -f docker-compose.local.yml restart server

# 重建并重启（代码更新后）
docker compose -f docker-compose.local.yml build --no-cache server web
docker compose -f docker-compose.local.yml up -d --remove-orphans

# 清理旧镜像
docker image prune -f

# 进入数据库
docker exec -it lcw-docs-postgres psql -U lcw_docs -d lcw_docs

# 备份数据库
docker exec lcw-docs-postgres pg_dump -U lcw_docs lcw_docs > backup_$(date +%Y%m%d).sql

# 恢复数据库
cat backup_20260419.sql | docker exec -i lcw-docs-postgres psql -U lcw_docs -d lcw_docs
```

### B. 项目文件结构说明

```
lcw-docs/
├── .github/workflows/
│   ├── ci.yml                    # CI：代码质量检查
│   ├── release.yml               # CD：tag 推送自动部署
│   └── deploy.yml                # CD：手动触发部署
├── apps/
│   ├── server/
│   │   ├── Dockerfile            # Server Docker 镜像构建
│   │   └── src/config/database.ts  # 数据库配置（含 DB_SYNCHRONIZE）
│   └── web/
│       ├── Dockerfile            # Web Docker 镜像构建
│       └── nginx.conf            # Nginx 反向代理配置
├── docker-compose.local.yml      # 本地构建部署（服务器用）
├── docker-compose.deploy.yml     # GHCR 镜像部署（备用）
├── package.json                  # 含 ship/ship:minor/ship:major 命令
└── .env                          # 环境变量（服务器上，不提交到 Git）
```

### C. 环境变量说明

| 变量 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `DB_HOST` | 是 | - | 数据库主机，Docker 内为 `postgres` |
| `DB_PORT` | 是 | `5432` | 数据库端口 |
| `DB_USERNAME` | 是 | `lcw_docs` | 数据库用户名 |
| `DB_PASSWORD` | 是 | - | 数据库密码 |
| `DB_DATABASE` | 是 | `lcw_docs` | 数据库名 |
| `JWT_SECRET` | 是 | - | JWT 签名密钥 |
| `CORS_ORIGINS` | 否 | `http://localhost` | 允许的前端域名 |
| `MINIMAX_API_KEY` | 否 | - | MiniMax AI API 密钥 |
| `SENTRY_DSN` | 否 | - | Sentry 错误追踪 DSN |
| `DB_SYNCHRONIZE` | 否 | `false` | 是否自动同步数据库表结构 |
