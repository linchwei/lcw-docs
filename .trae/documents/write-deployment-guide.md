# 云服务器配置与 GitHub CI/CD 部署指南编写计划

## 目标
编写一份从零开始的详细部署文档，包含云服务器配置的每一条命令和 GitHub CI/CD 的每一步操作，使任何人都能按照文档从空白服务器到完整自动部署。

## 文档结构

### 第一部分：云服务器配置（从零开始）

1. **服务器基础环境配置**
   - 系统更新
   - 创建 deploy 用户
   - 配置 SSH 密钥登录
   - 配置 sudo 免密
   - 安全加固（禁用 root SSH、禁用密码登录）

2. **Docker 环境安装**
   - 安装 Docker Engine
   - 安装 Docker Compose
   - 配置 Docker 用户组（deploy 用户免 sudo）
   - 配置 Docker 镜像加速（国内服务器）

3. **项目部署**
   - 克隆项目代码
   - 生成 .env 配置文件
   - 首次构建并启动（含 DB_SYNCHRONIZE）
   - 数据库初始化验证
   - 关闭 DB_SYNCHRONIZE 并重启

4. **防火墙配置**
   - 腾讯云轻量应用服务器防火墙规则

### 第二部分：GitHub CI/CD 配置

1. **生成 SSH 密钥对**
   - 本地生成密钥
   - 公钥添加到服务器
   - 验证连接

2. **GitHub 仓库配置**
   - 创建 production 环境
   - 配置 Secrets（DEPLOY_HOST、DEPLOY_USER、DEPLOY_SSH_KEY、DEPLOY_PATH）

3. **CI/CD 工作流说明**
   - ci.yml：代码质量检查
   - release.yml：tag 推送自动部署
   - deploy.yml：手动触发部署

4. **一键部署命令**
   - pnpm ship / ship:minor / ship:major 使用说明

## 实施步骤
1. 在 `docs/` 目录下创建 `deployment-guide.md` 文件，写入完整文档
