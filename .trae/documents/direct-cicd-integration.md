# 直接集成 CI/CD 部署方案

## 用户意图

用户一次性提供所有信息 → 我一次性完成所有配置 → 之后用户只需 `git push` + `git tag` 就自动部署。

## 已收集的信息

- 服务器 IP：106.53.73.48
- SSH 方式：密钥文件登录
- 服务器配置：4核4G
- GitHub 仓库：还没推送

## 还需要用户提供的信息（请一次性回复）

```
1. SSH 密钥文件路径（例如：~/Downloads/tencent.pem）
2. GitHub 用户名（例如：levy）
3. GitHub 仓库是否已创建？（如未创建，我提供创建步骤）
4. 是否有域名？（有请提供，如 docs.example.com；无则直接 IP 访问）
5. 是否需要 HTTPS？（有域名时）
6. 是否需要 MiniMax AI 功能？（需要请提供 API Key，不需要跳过）
7. 数据库密码和 JWT 密钥：自己指定 or 我自动生成？
```

## 我将执行的操作（一次性完成）

### 1. 推送代码到 GitHub
- 初始化 Git 远程仓库
- 推送代码

### 2. SSH 到服务器初始化
- 系统更新 + 安装 Docker/Docker Compose
- 配置 Docker DNS 和镜像加速
- 配置 Swap（4核4G → 4GB Swap）
- 创建部署用户 deploy
- SSH 安全加固
- 克隆项目
- 上传 .env 配置
- 首次启动 Docker Compose

### 3. 配置 GitHub Secrets
- 生成 GitHub Actions 专用 SSH 密钥对
- 公钥添加到服务器
- 在 GitHub 仓库添加所有 Secrets

### 4. 验证 CI/CD
- 打 tag 触发自动部署
- 验证服务可访问

## 最终效果

```bash
git tag v0.1.0 && git push origin v0.1.0
# GitHub Actions 自动：构建镜像 → 推送 GHCR → SSH 部署 ✅
```
