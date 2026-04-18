# 交互式一键部署方案

## 背景

用户觉得现有的部署文档太复杂（1200+ 行），希望能通过交互式问答的方式，由 AI 收集必要信息后，自动生成所有配置文件和部署命令，简化部署流程。

## 核心思路

将 1200 行文档中的手动操作，转化为 **AI 逐步提问 → 收集信息 → 自动生成配置 → 输出可执行命令** 的交互流程。用户只需回答问题，AI 负责拼装所有配置。

## 需要收集的信息清单

### 第一阶段：服务器基础信息
1. **服务器公网 IP** — 用于 SSH 连接、防火墙配置、域名解析
2. **服务器配置** — 2核2G / 2核4G / 4核8G（决定 Swap 大小、是否部署监控）
3. **SSH 登录方式** — 密钥文件路径 or 密码登录
4. **操作系统** — Ubuntu 22.04（默认）/ 其他

### 第二阶段：域名与 HTTPS
5. **是否有域名** — 有域名则配置 DNS + SSL，无域名则直接用 IP 访问
6. **域名地址**（如有）— 如 docs.example.com
7. **是否需要 HTTPS**（如有域名）— 是则生成 Nginx SSL 配置

### 第三阶段：项目配置
8. **GitHub 仓库地址** — 如 `your-username/lcw-docs`，用于 GHCR 镜像路径和 git clone
9. **数据库密码** — 可自动生成 or 用户提供
10. **JWT 密钥** — 可自动生成 or 用户提供
11. **CORS 允许的域名** — 根据是否有域名自动推断
12. **是否需要 MiniMax AI 功能** — 可选
13. **是否需要 Grafana 监控** — 根据服务器配置推荐

### 第四阶段：CI/CD 配置
14. **是否配置 GitHub CI/CD** — 是则需要配置 Secrets
15. **GitHub Actions SSH 密钥** — 可自动生成命令

## 自动生成的输出物

根据收集的信息，AI 将自动生成以下内容：

### 1. 服务器初始化脚本 (`setup-server.sh`)
- 系统更新
- Docker + Docker Compose 安装
- Docker DNS 和镜像加速配置
- Swap 分区配置（根据服务器配置自动调整大小）
- 创建部署用户
- SSH 安全加固

### 2. `.env` 生产环境配置文件
- 根据用户选择自动填充所有变量
- 自动生成强密码和 JWT 密钥
- 根据域名配置 CORS_ORIGINS

### 3. 防火墙规则表
- 根据是否有域名、是否需要监控，自动计算需要开放的端口
- 自动填入用户的本机 IP（提供查询命令）

### 4. Nginx SSL 配置（如需 HTTPS）
- 完整的 Nginx 反向代理 + SSL 配置
- HTTP → HTTPS 重定向
- WebSocket 代理

### 5. 首次部署命令序列
- 按顺序排列的可执行命令
- 每步附带说明

### 6. GitHub Secrets 配置清单
- 需要配置的 Secret 名称和值
- SSH 密钥生成命令

### 7. 日常运维命令速查卡
- 常用 docker compose 命令
- 日志查看、备份、回滚

## 实施步骤

### Step 1：创建交互式部署脚本
创建 `scripts/deploy-wizard.sh`（可选，辅助脚本），以及更新部署文档，添加交互式部署章节。

### Step 2：在部署文档中添加「快速部署」章节
在 `docs/deployment-tencent.md` 开头添加一个「快速交互式部署」章节，引导用户使用此方式。

### Step 3：实现交互流程
通过对话方式，分 4 个阶段收集信息，每个阶段结束后确认，然后自动生成所有配置。

## 交互流程设计

```
🚀 欢迎使用 lcw-docs 交互式部署向导！

我将通过几个简单问题，帮你生成所有部署配置。
整个过程大约需要 5 分钟。

━━━ 第一阶段：服务器信息 ━━━

Q1: 你的服务器公网 IP 是什么？
    （例如：43.136.xx.xx）

Q2: 服务器配置是？
    [1] 2核2G（¥34/月）
    [2] 2核4G（¥58/月）← 推荐
    [3] 4核8G（¥128/月）

Q3: 你现在能 SSH 登录服务器吗？
    [1] 能，使用密钥文件（请提供路径）
    [2] 能，使用密码
    [3] 还没买服务器

━━━ 第二阶段：域名与 HTTPS ━━━

Q4: 你有域名吗？
    [1] 有（请输入域名，如 docs.example.com）
    [2] 没有，直接用 IP 访问

Q5: 是否需要 HTTPS？（仅在有域名时询问）
    [1] 需要（推荐）
    [2] 不需要

━━━ 第三阶段：项目配置 ━━━

Q6: 你的 GitHub 仓库地址？
    （例如：levy/lcw-docs）

Q7: 数据库密码和 JWT 密钥如何处理？
    [1] 自动生成强密码（推荐）
    [2] 我自己指定

Q8: 是否需要 AI 功能（MiniMax）？
    [1] 需要（请提供 API Key）
    [2] 暂不需要

Q9: 是否部署监控（Prometheus + Grafana）？
    [根据服务器配置自动推荐]

━━━ 第四阶段：CI/CD ━━━

Q10: 是否配置 GitHub Actions 自动部署？
    [1] 是
    [2] 否，手动部署即可

━━━ 生成配置中... ━━━

✅ 已为你生成以下文件：
  1. setup-server.sh — 服务器初始化脚本
  2. .env — 生产环境变量
  3. nginx-ssl.conf — Nginx HTTPS 配置（如适用）
  4. deploy-commands.md — 部署命令步骤
  5. github-secrets.md — GitHub Secrets 配置清单
```

## 关键决策逻辑

| 条件 | 决策 |
|------|------|
| 2核2G 服务器 | Swap 6GB，swappiness=20，不部署监控，日志 max-size 减半 |
| 2核4G 服务器 | Swap 4GB，swappiness=10，可选监控 |
| 4核8G 服务器 | Swap 4GB，部署全部服务 |
| 无域名 | 不配置 Nginx SSL，CORS_ORIGINS 用 IP，web 端口绑定 0.0.0.0:80 |
| 有域名 + HTTPS | 配置 Nginx SSL，web 端口绑定 127.0.0.1:80 |
| 有域名无 HTTPS | 配置 Nginx 反向代理但无 SSL |
| 不配 CI/CD | 提供 git clone + docker compose 手动部署命令 |
| 配 CI/CD | 提供 GitHub Secrets 配置清单 + SSH 密钥生成命令 |

## 输出文件

1. **`scripts/setup-server.sh`** — 服务器初始化一键脚本（参数化）
2. **`.env.production`** — 根据用户信息生成的生产环境变量文件
3. **`scripts/nginx-ssl.conf`** — Nginx SSL 配置（条件生成）
4. **更新 `docs/deployment-tencent.md`** — 在文档开头添加「快速交互式部署」引导章节
