# GitHub CI/CD 配置实施计划

## 现状分析

| 维度 | 现状 | 需要做什么 |
|------|------|-----------|
| CI/CD | 完全不存在 | 从零搭建 GitHub Actions |
| Dockerfile | 不存在 | 创建 server + web (nginx) 两个 Dockerfile |
| 部署配置 | PM2 + 引用不存在的 .devcontainer | 重建 Docker Compose 部署 |
| 环境变量 | 无 .env.example，API 密钥在 .env 中 | 创建模板文件，使用 GitHub Secrets |
| Node 版本 | 未指定 | 创建 .nvmrc 锁定 Node 20 LTS |
| 测试 | 仅 core 包有 vitest | CI 中运行 core 测试，server/web 暂无测试 |

---

## 实施步骤

### 1. 基础配置文件

#### 1.1 创建 `.nvmrc`

锁定 Node.js 版本为 20 LTS：

```
20
```

#### 1.2 创建 `.env.example`（服务端）

在 `apps/server/.env.example` 中列出所有必需的环境变量（不含实际值）：

```
# 数据库
DB_HOST=localhost
DB_PORT=5433
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=postgres

# JWT
JWT_SECRET=your-jwt-secret-here

# AI
MINIMAX_API_KEY=your-minimax-api-key-here

# CORS
CORS_ORIGINS=http://localhost:5173

# Redis (可选，Bull 队列需要)
REDIS_HOST=localhost
REDIS_PORT=6379
```

#### 1.3 创建 `.dockerignore`

```
node_modules
dist
.turbo
.git
.env
*.md
.vscode
.cspell
.trae
```

### 2. Dockerfile

#### 2.1 服务端 Dockerfile

创建 `apps/server/Dockerfile`：

```dockerfile
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
WORKDIR /app

# 依赖安装阶段
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/core/package.json ./packages/core/
COPY packages/react/package.json ./packages/react/
COPY packages/shadcn/package.json ./packages/shadcn/
COPY packages/shadcn-shared-ui/package.json ./packages/shadcn-shared-ui/
COPY apps/server/package.json ./apps/server/
RUN pnpm install --frozen-lockfile

# 构建阶段
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/core/node_modules ./packages/core/node_modules
COPY --from=deps /app/packages/react/node_modules ./packages/react/node_modules
COPY --from=deps /app/packages/shadcn/node_modules ./packages/shadcn/node_modules
COPY --from=deps /app/packages/shadcn-shared-ui/node_modules ./packages/shadcn-shared-ui/node_modules
COPY --from=deps /app/apps/server/node_modules ./apps/server/node_modules
COPY . .
RUN pnpm --filter @lcw-doc/core build && pnpm --filter @lcw-doc/server build

# 生产阶段
FROM node:20-alpine AS production
WORKDIR /app
COPY --from=build /app/apps/server/dist ./dist
COPY --from=build /app/apps/server/node_modules ./node_modules
COPY --from=build /app/packages/core/dist ./packages/core/dist
COPY --from=build /app/packages/react/dist ./packages/react/dist
COPY --from=build /app/packages/shadcn/dist ./packages/shadcn/dist

ENV NODE_ENV=production
EXPOSE 8082
CMD ["node", "dist/main.js"]
```

#### 2.2 前端 Dockerfile（Nginx）

创建 `apps/web/Dockerfile`：

```dockerfile
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
WORKDIR /app

# 依赖安装阶段
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/core/package.json ./packages/core/
COPY packages/react/package.json ./packages/react/
COPY packages/shadcn/package.json ./packages/shadcn/
COPY packages/shadcn-shared-ui/package.json ./packages/shadcn-shared-ui/
COPY apps/web/package.json ./apps/web/
RUN pnpm install --frozen-lockfile

# 构建阶段
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/core/node_modules ./packages/core/node_modules
COPY --from=deps /app/packages/react/node_modules ./packages/react/node_modules
COPY --from=deps /app/packages/shadcn/node_modules ./packages/shadcn/node_modules
COPY --from=deps /app/packages/shadcn-shared-ui/node_modules ./packages/shadcn-shared-ui/node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY . .
RUN pnpm --filter @lcw-doc/core build && \
    pnpm --filter @lcw-doc/react build && \
    pnpm --filter @lcw-doc/shadcn build && \
    pnpm --filter @lcw-doc/web build

# 生产阶段 - Nginx
FROM nginx:alpine AS production
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### 2.3 Nginx 配置

创建 `apps/web/nginx.conf`：

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # SPA 路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 代理到后端
    location /api/ {
        proxy_pass http://server:8082/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket 代理
    location /doc-yjs- {
        proxy_pass http://server:8082;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### 3. Docker Compose 部署文件

创建 `docker-compose.deploy.yml`（替换不存在的 .devcontainer 引用）：

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: lcw-docs-postgres
    restart: unless-stopped
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: ${DB_USERNAME:-postgres}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres}
      POSTGRES_DB: ${DB_DATABASE:-postgres}
    ports:
      - "5433:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  server:
    build:
      context: .
      dockerfile: apps/server/Dockerfile
    container_name: lcw-docs-server
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      DB_USERNAME: ${DB_USERNAME:-postgres}
      DB_PASSWORD: ${DB_PASSWORD:-postgres}
      DB_DATABASE: ${DB_DATABASE:-postgres}
      JWT_SECRET: ${JWT_SECRET:-dev-secret-key-change-in-production}
      MINIMAX_API_KEY: ${MINIMAX_API_KEY:-}
      CORS_ORIGINS: ${CORS_ORIGINS:-http://localhost}
      NODE_ENV: production
    ports:
      - "8082:8082"

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    container_name: lcw-docs-web
    restart: unless-stopped
    depends_on:
      - server
    ports:
      - "80:80"

volumes:
  postgres_data:
```

### 4. GitHub Actions 工作流

#### 4.1 CI 工作流 — `.github/workflows/ci.yml`

触发条件：push 到 main/develop，以及所有 PR

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint-and-typecheck:
    name: Lint & TypeCheck
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 10.33.0

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm lint

      - name: TypeCheck
        run: pnpm typecheck

  test:
    name: Test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 10.33.0

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build dependencies
        run: pnpm --filter @lcw-doc/core build

      - name: Test
        run: pnpm --filter @lcw-doc/core test:coverage

      - name: Upload coverage
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage-report
          path: packages/core/coverage/

  build-server:
    name: Build Server
    runs-on: ubuntu-latest
    needs: [lint-and-typecheck]
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 10.33.0

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build server
        run: pnpm --filter @lcw-doc/core build && pnpm --filter @lcw-doc/server build

      - name: Upload server dist
        uses: actions/upload-artifact@v4
        with:
          name: server-dist
          path: apps/server/dist/

  build-web:
    name: Build Web
    runs-on: ubuntu-latest
    needs: [lint-and-typecheck]
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 10.33.0

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build web
        run: |
          pnpm --filter @lcw-doc/core build
          pnpm --filter @lcw-doc/react build
          pnpm --filter @lcw-doc/shadcn build
          pnpm --filter @lcw-doc/web build

      - name: Upload web dist
        uses: actions/upload-artifact@v4
        with:
          name: web-dist
          path: apps/web/dist/

  docker-build:
    name: Docker Build Check
    runs-on: ubuntu-latest
    needs: [lint-and-typecheck]
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build server image (no push)
        uses: docker/build-push-action@v6
        with:
          context: .
          file: apps/server/Dockerfile
          push: false
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Build web image (no push)
        uses: docker/build-push-action@v6
        with:
          context: .
          file: apps/web/Dockerfile
          push: false
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

#### 4.2 发布工作流 — `.github/workflows/release.yml`

触发条件：创建版本标签（v*.*.*）

```yaml
name: Release

on:
  push:
    tags:
      - 'v*.*.*'

env:
  REGISTRY: ghcr.io
  SERVER_IMAGE_NAME: ${{ github.repository }}/server
  WEB_IMAGE_NAME: ${{ github.repository }}/web

jobs:
  build-and-push:
    name: Build & Push Docker Images
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: |
            ${{ env.REGISTRY }}/${{ env.SERVER_IMAGE_NAME }}
            ${{ env.REGISTRY }}/${{ env.WEB_IMAGE_NAME }}
          tags: |
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build and push server image
        uses: docker/build-push-action@v6
        with:
          context: .
          file: apps/server/Dockerfile
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.SERVER_IMAGE_NAME }}:${{ github.ref_name }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Build and push web image
        uses: docker/build-push-action@v6
        with:
          context: .
          file: apps/web/Dockerfile
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.WEB_IMAGE_NAME }}:${{ github.ref_name }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: build-and-push
    if: github.ref == 'refs/heads/main' || startsWith(github.ref, 'refs/tags/')
    environment: production

    steps:
      - uses: actions/checkout@v4

      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_SSH_KEY }}
          script: |
            cd ${{ secrets.DEPLOY_PATH }}
            echo "${{ secrets.DEPLOY_ENV }}" > .env
            docker compose -f docker-compose.deploy.yml pull
            docker compose -f docker-compose.deploy.yml up -d --remove-orphans
            docker image prune -f
```

#### 4.3 部署工作流（手动触发）— `.github/workflows/deploy.yml`

```yaml
name: Deploy

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Deployment environment'
        required: true
        default: 'staging'
        type: choice
        options:
          - staging
          - production
      image_tag:
        description: 'Docker image tag (e.g., v1.0.0, latest)'
        required: true
        default: 'latest'

jobs:
  deploy:
    name: Deploy to ${{ github.event.inputs.environment }}
    runs-on: ubuntu-latest
    environment: ${{ github.event.inputs.environment }}

    steps:
      - uses: actions/checkout@v4

      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_SSH_KEY }}
          script: |
            cd ${{ secrets.DEPLOY_PATH }}
            echo "${{ secrets.DEPLOY_ENV }}" > .env
            export IMAGE_TAG=${{ github.event.inputs.image_tag }}
            docker compose -f docker-compose.deploy.yml pull
            docker compose -f docker-compose.deploy.yml up -d --remove-orphans
            docker image prune -f
```

### 5. 更新根 package.json 脚本

替换引用不存在 .devcontainer 的脚本：

```json
{
  "docker:deploy": "docker compose -p lcw-docs -f docker-compose.deploy.yml up -d",
  "docker:build-deploy": "pnpm build && pnpm docker:deploy",
  "docker:deploy:stop": "docker compose -p lcw-docs -f docker-compose.deploy.yml down"
}
```

### 6. GitHub 仓库配置清单

需要在 GitHub 仓库 Settings 中配置的 Secrets 和 Variables：

**Secrets（敏感信息）：**
| Secret 名称 | 用途 |
|---|---|
| `DEPLOY_HOST` | 部署服务器 IP/域名 |
| `DEPLOY_USER` | SSH 用户名 |
| `DEPLOY_SSH_KEY` | SSH 私钥 |
| `DEPLOY_PATH` | 服务器上的项目路径 |
| `DEPLOY_ENV` | 完整的 .env 文件内容 |

**Environments：**
| 环境 | 用途 |
|---|---|
| `staging` | 预发布环境，手动触发 |
| `production` | 生产环境，需要审批 |

### 7. 需要创建的文件清单

| 文件路径 | 用途 |
|---|---|
| `.nvmrc` | 锁定 Node.js 版本 |
| `.dockerignore` | Docker 构建忽略文件 |
| `apps/server/.env.example` | 服务端环境变量模板 |
| `apps/server/Dockerfile` | 服务端 Docker 镜像 |
| `apps/web/Dockerfile` | 前端 Docker 镜像 |
| `apps/web/nginx.conf` | Nginx 配置（SPA 路由 + API 代理 + WebSocket） |
| `docker-compose.deploy.yml` | 生产部署编排 |
| `.github/workflows/ci.yml` | CI 工作流（lint + typecheck + test + build） |
| `.github/workflows/release.yml` | 发布工作流（Docker 镜像构建 + 推送 + 部署） |
| `.github/workflows/deploy.yml` | 手动部署工作流 |

### 8. 实施顺序

1. 创建 `.nvmrc` 和 `.dockerignore`
2. 创建 `apps/server/.env.example`
3. 创建 `apps/web/nginx.conf`
4. 创建 `apps/server/Dockerfile`
5. 创建 `apps/web/Dockerfile`
6. 创建 `docker-compose.deploy.yml`
7. 更新根 `package.json` 中的 docker 脚本
8. 创建 `.github/workflows/ci.yml`
9. 创建 `.github/workflows/release.yml`
10. 创建 `.github/workflows/deploy.yml`
11. 本地验证 Docker 构建是否成功
12. 推送到 GitHub 验证 CI 是否通过
