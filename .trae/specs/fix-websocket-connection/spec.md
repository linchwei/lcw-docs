# 修复 WebSocket 协同编辑连接问题 Spec

## Why
部署到服务器后，WebSocket 协同编辑不工作。根因是前端 WebSocket 连接地址硬编码为 `ws://localhost:8082`（当 `VITE_WS_HOST` 未设置时），浏览器会尝试连接用户本地机器而非服务器。同时代码使用 `wss://` 前缀（需要 HTTPS），但当前部署没有域名和 HTTPS。

## What Changes
- 修改 `apps/web/src/pages/Doc/index.tsx` 中的 WebSocket URL 逻辑，自动根据当前页面 URL 推算 WebSocket 地址
- 修改 `apps/web/src/pages/Share/ShareDocEditor.tsx` 中的 WebSocket URL 逻辑，保持一致
- 逻辑：`VITE_WS_HOST` 有值时使用它，否则根据 `window.location` 自动推算（http→ws, https→wss，使用相同 host）

## Impact
- Affected code: `apps/web/src/pages/Doc/index.tsx`, `apps/web/src/pages/Share/ShareDocEditor.tsx`
- Affected infrastructure: 需要重新构建 web 镜像

## ADDED Requirements

### Requirement: WebSocket 自动地址推算
系统 SHALL 在未设置 `VITE_WS_HOST` 时，自动根据当前页面 URL 推算 WebSocket 连接地址。

#### Scenario: HTTP 部署（无 HTTPS）
- **WHEN** 页面 URL 为 `http://106.53.73.48` 且 `VITE_WS_HOST` 未设置
- **THEN** WebSocket 连接地址为 `ws://106.53.73.48`

#### Scenario: HTTPS 部署
- **WHEN** 页面 URL 为 `https://docs.example.com` 且 `VITE_WS_HOST` 未设置
- **THEN** WebSocket 连接地址为 `wss://docs.example.com`

#### Scenario: 自定义 WS 地址
- **WHEN** `VITE_WS_HOST` 设置为 `ws.example.com`
- **THEN** WebSocket 连接地址为 `wss://ws.example.com`

## MODIFIED Requirements

### Requirement: WebSocket URL 生成逻辑
原逻辑：`import.meta.env.VITE_WS_HOST ? 'wss://${VITE_WS_HOST}' : 'ws://localhost:8082'`
新逻辑：`import.meta.env.VITE_WS_HOST ? 'wss://${VITE_WS_HOST}' : (window.location.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + window.location.host`
