# CI/CD 集成部署 Spec

## Why
用户希望将项目部署到腾讯云轻量服务器，并配置 GitHub Actions CI/CD 实现推送代码后自动部署。当前 Git 推送因网络问题无法由 AI 完成，需要用户自行推送到 GitHub 后，AI 再完成服务器配置和 CI/CD 集成。

## What Changes
- 用户自行将代码推送到 GitHub 仓库 `linchwei/lcw-docs`
- AI 通过 SSH 在服务器上完成项目克隆和 Docker 部署
- AI 生成 GitHub Actions SSH 密钥对
- AI 提供 GitHub Secrets 配置指引（需用户在浏览器中操作）
- 修改 `docker-compose.deploy.yml` 中 web 端口绑定方式（无域名，绑定 0.0.0.0:80）

## Impact
- Affected code: `docker-compose.deploy.yml`（端口绑定调整）
- Affected systems: 腾讯云服务器 106.53.73.48、GitHub 仓库 linchwei/lcw-docs

## 已知信息

| 项目 | 值 |
|------|-----|
| 服务器 IP | 106.53.73.48 |
| SSH 用户 | ubuntu（sudo 免密） |
| SSH 密钥 | ~/Desktop/levy/info/lcw_doc.pem |
| 服务器配置 | 4核4G，已有 4GB Swap |
| Docker | 已安装 v29.4.0 |
| Docker Compose | 已安装 v5.1.3 |
| Docker DNS | 已配置腾讯云内网 DNS |
| deploy 用户 | 已存在，已在 docker 组 |
| GitHub 仓库 | linchwei/lcw-docs（已创建，未推送） |
| 域名 | 无，直接 IP 访问 |
| HTTPS | 不需要 |
| MiniMax API Key | sk-cp-m2mafgyBudJj4RxDXnyP282wzs09jm_2qlbo3uUHfzQTQZtJlnMZBr9rfR4LhOVRE_ti_YFBxOPJ1Alrerxn0tgEXWfDlTEOhJmPCwgnhlC4y77x6l4ryW0 |
| 数据库密码 | 自动生成 |
| JWT 密钥 | 自动生成 |

## ADDED Requirements

### Requirement: 服务器项目部署
系统 SHALL 在服务器上通过 Docker Compose 部署 lcw-docs 项目，包含 postgres、server、web 三个核心服务。

#### Scenario: 首次部署
- **WHEN** 服务器上没有运行中的 lcw-docs 容器
- **THEN** 克隆项目、配置 .env、启动 Docker Compose、初始化数据库

### Requirement: GitHub Actions CI/CD 自动部署
系统 SHALL 在用户推送 `v*.*.*` tag 时自动构建 Docker 镜像并部署到服务器。

#### Scenario: 推送 tag 触发自动部署
- **WHEN** 用户执行 `git tag v0.1.0 && git push origin v0.1.0`
- **THEN** GitHub Actions 自动构建 server 和 web 镜像 → 推送到 GHCR → SSH 部署到服务器

### Requirement: GitHub Secrets 配置
系统 SHALL 提供完整的 GitHub Secrets 配置指引，用户按指引在浏览器中完成配置。

#### Scenario: 用户配置 Secrets
- **WHEN** AI 生成 SSH 密钥对并提供配置清单
- **THEN** 用户在 GitHub 仓库 Settings 中添加所有必需的 Secrets

### Requirement: 无域名直接 IP 访问
系统 SHALL 支持无域名场景，web 服务端口绑定 0.0.0.0:80，CORS 配置使用服务器 IP。

#### Scenario: 通过 IP 访问
- **WHEN** 用户浏览器访问 http://106.53.73.48
- **THEN** 正常显示前端页面，API 请求正常
