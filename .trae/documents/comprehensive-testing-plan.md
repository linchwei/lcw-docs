# 全面测试计划

## 一、项目测试现状

| 维度 | 现状 |
|---|---|
| 测试框架 | 仅 `packages/core` 有 Vitest (33 个测试文件) |
| Server 测试 | ❌ 无任何测试 (无框架、无依赖、无脚本) |
| Web 测试 | ❌ 无任何测试 (无框架、无依赖、无脚本) |
| E2E 测试 | ❌ 无 |
| 测试 Setup | ❌ 无任何 setup 文件 |
| Turbo 集成 | ❌ turbo.json 无 test 任务 |

## 二、测试基础设施搭建

### 步骤 1：Server 端测试基础设施

**目标**：为 `apps/server` 搭建 Vitest + Supertest 测试环境

1. 安装依赖：
   ```bash
   pnpm --filter @lcw-doc/server add -D vitest supertest @types/supertest
   ```

2. 创建 `apps/server/vitest.config.ts`：
   ```typescript
   import { defineConfig } from 'vitest/config'
   export default defineConfig({
     test: {
       environment: 'node',
       globals: true,
       include: ['src/**/*.spec.ts'],
       setupFiles: ['src/test/setup.ts'],
     },
   })
   ```

3. 创建 `apps/server/src/test/setup.ts`：
   - 初始化测试数据库连接
   - 清理测试数据
   - 提供 JWT token 生成工具函数

4. 创建 `apps/server/src/test/helpers.ts`：
   - `createTestApp()`: 创建 NestJS 测试应用 (TestingModule)
   - `createAuthenticatedRequest()`: 返回带 JWT 的 supertest 请求
   - `createTestUser()`: 创建测试用户并返回 token
   - `cleanupDatabase()`: 清理测试数据

5. 在 `apps/server/package.json` 添加脚本：
   ```json
   "test": "vitest",
   "test:coverage": "vitest run --coverage"
   ```

### 步骤 2：Web 端测试基础设施

**目标**：为 `apps/web` 搭建 Vitest + @testing-library/react 测试环境

1. 安装依赖：
   ```bash
   pnpm --filter @lcw-doc/web add -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event msw
   ```

2. 创建 `apps/web/vitest.config.ts`：
   ```typescript
   import { defineConfig } from 'vitest/config'
   import path from 'path'
   export default defineConfig({
     resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
     test: {
       environment: 'jsdom',
       globals: true,
       include: ['src/**/*.test.{ts,tsx}'],
       setupFiles: ['src/test/setup.ts'],
     },
   })
   ```

3. 创建 `apps/web/src/test/setup.ts`：
   - 导入 `@testing-library/jest-dom`
   - 配置 MSW (Mock Service Worker) 请求拦截
   - mock `localStorage`、`window.matchMedia`、`IntersectionObserver` 等

4. 创建 `apps/web/src/test/helpers.tsx`：
   - `renderWithProviders(ui)`: 包含 QueryClientProvider + MemoryRouter 的渲染
   - `mockApiResponse(method, url, data, status)`: MSW 请求 mock
   - `mockAuthenticatedUser()`: mock 已登录状态

5. 在 `apps/web/package.json` 添加脚本：
   ```json
   "test": "vitest",
   "test:coverage": "vitest run --coverage"
   ```

### 步骤 3：根级集成

1. 在根 `package.json` 添加：
   ```json
   "test": "turbo test",
   "test:coverage": "turbo test:coverage"
   ```

2. 在 `turbo.json` 添加：
   ```json
   "test": { "dependsOn": ["^build"] },
   "test:coverage": { "dependsOn": ["^build"] }
   ```

---

## 三、后端 API 接口测试用例

### 3.1 HealthController (3 个端点，公开)

| 用例 ID | 测试描述 | 方法 | 路由 | 预期结果 |
|---|---|---|---|---|
| HC-001 | 健康检查 - 正常响应 | GET | /health | 200, { status: 'ok' } |
| HC-002 | 就绪检查 - 正常响应 | GET | /health/ready | 200, { status: 'ready' } |
| HC-003 | 存活检查 - 正常响应 | GET | /health/live | 200, { status: 'live' } |
| HC-004 | 健康检查 - 数据库不可用 | GET | /health | 503, ServiceUnavailable |

### 3.2 AuthController (4 个端点)

| 用例 ID | 测试描述 | 方法 | 路由 | 预期结果 |
|---|---|---|---|---|
| AU-001 | 登录 - 正确凭据 | POST | /auth/login | 200, 返回 JWT token |
| AU-002 | 登录 - 错误密码 | POST | /auth/login | 401, Unauthorized |
| AU-003 | 登录 - 不存在的用户 | POST | /auth/login | 401, Unauthorized |
| AU-004 | 登录 - 缺少字段 | POST | /auth/login | 400, Validation failed |
| AU-005 | 登出 - 已认证 | POST | /auth/logout | 200 |
| AU-006 | 登出 - 未认证 | POST | /auth/logout | 401 |
| AU-007 | 获取当前用户 - 已认证 | GET | /currentUser | 200, 返回用户信息 |
| AU-008 | 获取当前用户 - 未认证 | GET | /currentUser | 401 |
| AU-009 | 获取用户资料 - 已认证 | GET | /me | 200, 返回用户资料 |
| AU-010 | 获取用户资料 - 未认证 | GET | /me | 401 |

### 3.3 UserController (1 个端点，公开)

| 用例 ID | 测试描述 | 方法 | 路由 | 预期结果 |
|---|---|---|---|---|
| US-001 | 注册 - 正常注册 | POST | /user/register | 201, 返回用户信息 |
| US-002 | 注册 - 用户名太短 | POST | /user/register | 400, Validation failed |
| US-003 | 注册 - 用户名太长 | POST | /user/register | 400, Validation failed |
| US-004 | 注册 - 密码太短 | POST | /user/register | 400, Validation failed |
| US-005 | 注册 - 重复用户名 | POST | /user/register | 409, Conflict |
| US-006 | 注册 - 缺少必填字段 | POST | /user/register | 400, Validation failed |

### 3.4 PageController (14 个端点，JWT 保护)

| 用例 ID | 测试描述 | 方法 | 路由 | 预期结果 |
|---|---|---|---|---|
| PG-001 | 创建页面 - 正常 | POST | /page | 201, 返回页面信息 |
| PG-002 | 创建页面 - 未认证 | POST | /page | 401 |
| PG-003 | 创建页面 - 缺少必填字段 | POST | /page | 400 |
| PG-004 | 更新页面 - 修改标题 | PUT | /page | 200 |
| PG-005 | 更新页面 - 修改封面 | PUT | /page | 200, coverImage 更新 |
| PG-006 | 更新页面 - 修改文件夹 | PUT | /page | 200, folderId 更新 |
| PG-007 | 更新页面 - 不存在的页面 | PUT | /page | 404 |
| PG-008 | 获取页面列表 | GET | /page | 200, 返回页面数组 |
| PG-009 | 获取页面详情 | GET | /page/:pageId | 200, 返回页面详情 |
| PG-010 | 获取页面详情 - 不存在 | GET | /page/:pageId | 404 |
| PG-011 | 搜索页面 | GET | /page/search?query=xxx | 200, 返回搜索结果 |
| PG-012 | 搜索页面 - 空查询 | GET | /page/search?query= | 200, 空数组 |
| PG-013 | 获取共享页面 | GET | /page/shared | 200 |
| PG-014 | 获取反向链接 | GET | /page/:pageId/backlinks | 200 |
| PG-015 | 获取回收站 | GET | /page/trash | 200 |
| PG-016 | 获取最近页面 | GET | /page/recent | 200 |
| PG-017 | 获取页面图谱 | GET | /page/graph | 200 |
| PG-018 | 切换收藏 - 收藏 | PUT | /page/:pageId/favorite | 200 |
| PG-019 | 切换收藏 - 取消收藏 | PUT | /page/:pageId/favorite | 200 |
| PG-020 | 软删除页面 | DELETE | /page | 200 |
| PG-021 | 恢复页面 | POST | /page/:pageId/restore | 200 |
| PG-022 | 永久删除页面 | DELETE | /page/:pageId/permanent | 200 |
| PG-023 | 永久删除 - 不存在 | DELETE | /page/:pageId/permanent | 404 |
| PG-024 | 无权限操作他人页面 | PUT | /page | 403 |

### 3.5 SyncController (3 个端点，JWT 保护)

| 用例 ID | 测试描述 | 方法 | 路由 | 预期结果 |
|---|---|---|---|---|
| SY-001 | 获取操作记录 | GET | /doc/:pageId/ops?since=0 | 200, 返回操作列表 |
| SY-002 | 推送操作记录 | POST | /doc/:pageId/ops | 200 |
| SY-003 | 获取快照 | GET | /doc/:pageId/snapshot | 200 |
| SY-004 | 推送操作 - 无权限 | POST | /doc/:pageId/ops | 403 |

### 3.6 VersionController (6 个端点，JWT 保护)

| 用例 ID | 测试描述 | 方法 | 路由 | 预期结果 |
|---|---|---|---|---|
| VR-001 | 创建版本 | POST | /page/:pageId/version | 201 |
| VR-002 | 创建版本 - 带描述 | POST | /page/:pageId/version | 201, 含 description |
| VR-003 | 获取版本列表 | GET | /page/:pageId/versions | 200, 返回版本数组 |
| VR-004 | 获取版本详情 | GET | /version/:versionId | 200 |
| VR-005 | 删除版本 | DELETE | /version/:versionId | 200 |
| VR-006 | 回滚版本 | POST | /page/:pageId/version/:versionId/rollback | 200 |
| VR-007 | 版本对比 | GET | /page/:pageId/version/:v1/diff/:v2 | 200, 返回 diff |
| VR-008 | 回滚 - 不存在的版本 | POST | /page/:pageId/version/:xxx/rollback | 404 |

### 3.7 ShareController (5 个端点，混合保护)

| 用例 ID | 测试描述 | 方法 | 路由 | 预期结果 |
|---|---|---|---|---|
| SH-001 | 创建分享链接 | POST | /share | 201, 返回分享信息 |
| SH-002 | 创建分享 - 带密码 | POST | /share | 201, 含 password |
| SH-003 | 创建分享 - 带过期时间 | POST | /share | 201, 含 expiresAt |
| SH-004 | 创建分享 - 未认证 | POST | /share | 401 |
| SH-005 | 获取页面分享列表 | GET | /share/page/:pageId | 200 |
| SH-006 | 删除分享 | DELETE | /share/:shareId | 200 |
| SH-007 | 访问分享信息 - 公开 | GET | /share/:shareId/info | 200 |
| SH-008 | 访问分享信息 - 需要密码 | GET | /share/:shareId/info | 403, 需要密码 |
| SH-009 | 访问分享信息 - 错误密码 | GET | /share/:shareId/info | 403 |
| SH-010 | 获取分享内容 - 公开 | GET | /share/:shareId/content | 200 |
| SH-011 | 获取分享内容 - 不存在 | GET | /share/:shareId/content | 404 |
| SH-012 | 获取分享内容 - 已过期 | GET | /share/:shareId/content | 410, Gone |

### 3.8 CollaboratorController (4 个端点，JWT 保护)

| 用例 ID | 测试描述 | 方法 | 路由 | 预期结果 |
|---|---|---|---|---|
| CL-001 | 获取协作者列表 | GET | /page/:pageId/collaborators | 200 |
| CL-002 | 添加协作者 | POST | /page/:pageId/collaborator | 201 |
| CL-003 | 添加协作者 - 无效角色 | POST | /page/:pageId/collaborator | 400 |
| CL-004 | 更新协作者角色 | PUT | /collaborator/:collaboratorId | 200 |
| CL-005 | 移除协作者 | DELETE | /collaborator/:collaboratorId | 200 |
| CL-006 | 添加协作者 - 不存在的用户 | POST | /page/:pageId/collaborator | 404 |

### 3.9 CommentController (5 个端点，JWT 保护)

| 用例 ID | 测试描述 | 方法 | 路由 | 预期结果 |
|---|---|---|---|---|
| CM-001 | 创建评论 | POST | /page/:pageId/comment | 201 |
| CM-002 | 创建评论 - 带锚点 | POST | /page/:pageId/comment | 201, 含 anchorText |
| CM-003 | 获取页面评论 | GET | /page/:pageId/comments | 200 |
| CM-004 | 回复评论 | POST | /comment/:commentId/reply | 201 |
| CM-005 | 解决评论 | PUT | /comment/:commentId/resolve | 200 |
| CM-006 | 删除评论 | DELETE | /comment/:commentId | 200 |
| CM-007 | 回复 - 不存在的评论 | POST | /comment/:xxx/reply | 404 |

### 3.10 FolderController (4 个端点，JWT 保护)

| 用例 ID | 测试描述 | 方法 | 路由 | 预期结果 |
|---|---|---|---|---|
| FD-001 | 获取文件夹列表 | GET | /folder | 200 |
| FD-002 | 创建文件夹 | POST | /folder | 201 |
| FD-003 | 创建子文件夹 | POST | /folder | 201, 含 parentId |
| FD-004 | 更新文件夹 | PUT | /folder | 200 |
| FD-005 | 删除文件夹 | DELETE | /folder/:folderId | 200 |
| FD-006 | 删除 - 不存在 | DELETE | /folder/:xxx | 404 |

### 3.11 TagController (8 个端点，JWT 保护)

| 用例 ID | 测试描述 | 方法 | 路由 | 预期结果 |
|---|---|---|---|---|
| TG-001 | 获取标签列表 | GET | /tags | 200 |
| TG-002 | 创建标签 | POST | /tag | 201 |
| TG-003 | 创建标签 - 带颜色 | POST | /tag | 201, 含 color |
| TG-004 | 更新标签 | PUT | /tag | 200 |
| TG-005 | 删除标签 | DELETE | /tag/:tagId | 200 |
| TG-006 | 为页面添加标签 | POST | /page-tag | 200 |
| TG-007 | 移除页面标签 | DELETE | /page-tag | 200 |
| TG-008 | 获取页面标签 | GET | /page/:pageId/tags | 200 |
| TG-009 | 获取标签下的页面 | GET | /tag/:tagId/pages | 200 |
| TG-010 | 重复添加标签 | POST | /page-tag | 409, Conflict |

### 3.12 NotificationController (5 个端点，JWT 保护)

| 用例 ID | 测试描述 | 方法 | 路由 | 预期结果 |
|---|---|---|---|---|
| NT-001 | 获取通知列表 | GET | /notification | 200 |
| NT-002 | 获取未读数 | GET | /notification/unread-count | 200, { count: number } |
| NT-003 | 标记已读 | POST | /notification/:notificationId/read | 200 |
| NT-004 | 全部标记已读 | POST | /notification/read-all | 200 |
| NT-005 | 删除通知 | DELETE | /notification/:notificationId | 200 |

### 3.13 AiController (1 个端点，JWT 保护，SSE)

| 用例 ID | 测试描述 | 方法 | 路由 | 预期结果 |
|---|---|---|---|---|
| AI-001 | AI 聊天 - 正常请求 | POST | /ai/chat | 200, SSE 流式响应 |
| AI-002 | AI 聊天 - 未认证 | POST | /ai/chat | 401 |
| AI-003 | AI 聊天 - 空消息 | POST | /ai/chat | 400 |
| AI-004 | AI 聊天 - API Key 未配置 | POST | /ai/chat | 503 |

### 3.14 UploadController (1 个端点，JWT 保护)

| 用例 ID | 测试描述 | 方法 | 路由 | 预期结果 |
|---|---|---|---|---|
| UP-001 | 上传文件 - 正常 | POST | /upload | 200, 返回文件 URL |
| UP-002 | 上传文件 - 未认证 | POST | /upload | 401 |
| UP-003 | 上传文件 - 无文件 | POST | /upload | 400 |
| UP-004 | 上传文件 - 超大文件 | POST | /upload | 413, Payload Too Large |

### 3.15 ApplicationController (4 个端点，JWT 保护)

| 用例 ID | 测试描述 | 方法 | 路由 | 预期结果 |
|---|---|---|---|---|
| AP-001 | 创建应用 | POST | /application | 201 |
| AP-002 | 更新应用 | PUT | /application | 200 |
| AP-003 | 获取应用列表 | GET | /application | 200 |
| AP-004 | 删除应用 | DELETE | /application | 200 |

### 3.16 AuditController (1 个端点，JWT 保护)

| 用例 ID | 测试描述 | 方法 | 路由 | 预期结果 |
|---|---|---|---|---|
| AD-001 | 获取页面审计日志 | GET | /page/:pageId/audit_log | 200 |
| AD-002 | 获取审计日志 - 带 limit | GET | /page/:pageId/audit_log?limit=10 | 200 |
| AD-003 | 获取审计日志 - 无权限 | GET | /page/:pageId/audit_log | 403 |

---

## 四、后端安全测试用例

### 4.1 认证与授权

| 用例 ID | 测试描述 | 攻击向量 | 预期结果 |
|---|---|---|---|
| SEC-001 | 无 Token 访问受保护端点 | GET /page (无 Authorization header) | 401 Unauthorized |
| SEC-002 | 过期 Token 访问 | GET /page (过期 JWT) | 401 Unauthorized |
| SEC-003 | 无效 Token 格式 | GET /page (Authorization: Bearer invalid) | 401 Unauthorized |
| SEC-004 | 篡改 Token 签名 | GET /page (修改 payload 部分) | 401 Unauthorized |
| SEC-005 | 越权访问他人页面 | GET /page/:otherUserPageId | 403 Forbidden |
| SEC-006 | 越权修改他人页面 | PUT /page (他人 pageId) | 403 Forbidden |
| SEC-007 | 越权删除他人页面 | DELETE /page (他人 pageId) | 403 Forbidden |
| SEC-008 | 越权管理他人协作者 | POST /page/:otherPageId/collaborator | 403 Forbidden |
| SEC-009 | Viewer 角色尝试编辑 | PUT /page (viewer 权限用户) | 403 Forbidden |
| SEC-010 | Commenter 角色尝试编辑 | PUT /page (commenter 权限用户) | 403 Forbidden |

### 4.2 输入验证与注入

| 用例 ID | 测试描述 | 攻击向量 | 预期结果 |
|---|---|---|---|
| SEC-011 | SQL 注入 - 登录 | POST /auth/login { username: "' OR 1=1--" } | 401, 无 SQL 错误 |
| SEC-012 | SQL 注入 - 搜索 | GET /page/search?query='; DROP TABLE pages;-- | 200, 无 SQL 错误 |
| SEC-013 | XSS - 页面标题 | POST /page { title: "<script>alert(1)</script>" } | 标题被转义或过滤 |
| SEC-014 | XSS - 评论内容 | POST /page/:id/comment { content: "<img onerror=alert(1)>" } | 内容被转义或过滤 |
| SEC-015 | NoSQL 注入 | POST /user/register { username: {"$gt": ""} } | 400, 验证失败 |
| SEC-016 | 超长字符串 | POST /page { title: "A".repeat(10000) } | 400, 验证失败 |
| SEC-017 | 空请求体 | POST /page {} | 400, 验证失败 |
| SEC-018 | 额外字段注入 | POST /page { title: "x", isAdmin: true } | 额外字段被忽略 |
| SEC-019 | 路径遍历 | GET /page/../../etc/passwd | 400/404, 无文件泄露 |
| SEC-020 | CRLF 注入 | POST /page { title: "test\r\nSet-Cookie: evil=true" } | 无 CRLF 注入 |

### 4.3 速率限制与 DoS

| 用例 ID | 测试描述 | 攻击向量 | 预期结果 |
|---|---|---|---|
| SEC-021 | 登录暴力破解 | 连续 10 次错误登录 | 429 Too Many Requests |
| SEC-022 | API 速率限制 | 短时间大量请求 | 429 Too Many Requests |
| SEC-023 | 大文件上传 | 上传超大文件 | 413 Payload Too Large |

### 4.4 数据安全

| 用例 ID | 测试描述 | 攻击向量 | 预期结果 |
|---|---|---|---|
| SEC-024 | 密码哈希存储 | 检查数据库中密码是否明文 | 密码应为 bcrypt 哈希 |
| SEC-025 | JWT Secret 强度 | 检查默认 JWT Secret | 生产环境不应使用默认值 |
| SEC-026 | 敏感信息泄露 | GET /currentUser 响应 | 不应包含 password 字段 |
| SEC-027 | 错误信息泄露 | 触发 500 错误 | 不应泄露堆栈跟踪 |
| SEC-028 | CORS 配置 | 跨域请求 | 仅允许配置的域名 |
| SEC-029 | 分享链接密码保护 | GET /share/:id/info (无密码) | 有密码的分享返回 403 |
| SEC-030 | 分享过期检查 | GET /share/:id/content (已过期) | 410 Gone |

---

## 五、前端 UI 与功能测试用例

### 5.1 登录页面 (Account/Login)

| 用例 ID | 测试描述 | 测试类型 | 预期结果 |
|---|---|---|---|
| UI-001 | 渲染登录表单 | UI | 显示用户名、密码输入框和登录按钮 |
| UI-002 | 输入验证 - 空字段 | 功能 | 点击登录时显示验证错误 |
| UI-003 | 登录成功 | 功能 | 跳转到首页，localStorage 存有 token |
| UI-004 | 登录失败 - 错误密码 | 功能 | 显示错误提示 |
| UI-005 | 注册链接跳转 | UI | 点击注册链接跳转到注册表单 |
| UI-006 | 注册成功 | 功能 | 注册后自动登录或跳转登录页 |
| UI-007 | 注册失败 - 重复用户名 | 功能 | 显示用户名已存在错误 |

### 5.2 首页文档列表 (DocList)

| 用例 ID | 测试描述 | 测试类型 | 预期结果 |
|---|---|---|---|
| UI-008 | 渲染文档卡片列表 | UI | 显示页面卡片，含标题、emoji、时间 |
| UI-009 | 空列表状态 | UI | 显示空状态提示 |
| UI-010 | 创建新文档 | 功能 | 点击新建按钮，创建文档并跳转 |
| UI-011 | 点击卡片进入文档 | 功能 | 跳转到文档编辑页 |
| UI-012 | 三个点菜单 - 打开 | UI | 点击三点按钮显示下拉菜单 |
| UI-013 | 三个点菜单 - 收藏 | 功能 | 点击收藏，卡片状态更新 |
| UI-014 | 三个点菜单 - 新标签打开 | 功能 | 在新标签页打开文档 |
| UI-015 | 三个点菜单 - 封面子菜单 | UI | 悬停封面项显示封面选择器 |
| UI-016 | 三个点菜单 - 添加封面 | 功能 | 选择封面图片，卡片显示封面 |
| UI-017 | 三个点菜单 - 移除封面 | 功能 | 点击移除封面，封面消失 |
| UI-018 | 三个点菜单 - 标签子菜单 | UI | 悬停标签项显示标签选择器 |
| UI-019 | 三个点菜单 - 添加标签 | 功能 | 选择已有标签，卡片显示标签 |
| UI-020 | 三个点菜单 - 创建新标签 | 功能 | 输入名称、选择颜色、创建并添加 |
| UI-021 | 三个点菜单 - 移除标签 | 功能 | 点击标签上的 X 移除 |
| UI-022 | 三个点菜单 - 删除 | 功能 | 点击删除，文档移入回收站 |
| UI-023 | 三个点菜单 - 非所有者 | UI | 不显示收藏和删除选项 |
| UI-024 | 卡片显示封面图 | UI | 有封面时显示封面图区域 |
| UI-025 | 卡片显示标签 | UI | 有标签时显示标签徽章 |
| UI-026 | 卡片标签超过2个 | UI | 显示 "+N" 更多标签提示 |
| UI-027 | 搜索功能 | 功能 | 输入搜索词，过滤文档列表 |
| UI-028 | 收藏筛选 | 功能 | 切换收藏筛选，仅显示收藏文档 |

### 5.3 文档编辑页 (Doc)

| 用例 ID | 测试描述 | 测试类型 | 预期结果 |
|---|---|---|---|
| UI-029 | 渲染编辑器 | UI | 显示 Tiptap 编辑器 |
| UI-030 | 输入文本 | 功能 | 输入内容实时保存 |
| UI-031 | 标题编辑 | 功能 | 修改标题，保存后更新 |
| UI-032 | Emoji 选择 | 功能 | 点击 emoji 选择器，选择后更新 |
| UI-033 | 协作者头像列表 | UI | 显示当前在线协作者头像 |
| UI-034 | 文档大纲 | UI | 显示文档标题大纲 |
| UI-035 | 大纲点击跳转 | 功能 | 点击大纲项跳转到对应位置 |
| UI-036 | 分享功能 | 功能 | 打开分享对话框，创建分享链接 |
| UI-037 | 版本历史 | 功能 | 打开版本面板，查看历史版本 |
| UI-038 | 版本回滚 | 功能 | 选择历史版本回滚 |
| UI-039 | 版本对比 | 功能 | 选择两个版本进行 diff |
| UI-040 | 评论功能 | 功能 | 选中文本，创建评论 |
| UI-041 | 回复评论 | 功能 | 在评论下回复 |
| UI-042 | 解决评论 | 功能 | 标记评论为已解决 |
| UI-043 | 协作者管理 | 功能 | 添加/移除/修改协作者 |
| UI-044 | 实时协作 | 功能 | 多用户同时编辑，内容同步 |
| UI-045 | 光标显示 | UI | 显示其他协作者的光标位置 |

### 5.4 文档图谱 (DocGraph)

| 用例 ID | 测试描述 | 测试类型 | 预期结果 |
|---|---|---|---|
| UI-046 | 渲染图谱 | UI | 显示页面关系图谱 (节点+边) |
| UI-047 | 节点点击 | 功能 | 点击节点跳转到对应页面 |
| UI-048 | 空图谱 | UI | 无页面时显示空状态 |
| UI-049 | 图谱缩放拖拽 | 功能 | 可以缩放和拖拽图谱 |

### 5.5 分享页面 (Share)

| 用例 ID | 测试描述 | 测试类型 | 预期结果 |
|---|---|---|---|
| UI-050 | 渲染分享页面 | UI | 显示分享的文档内容 |
| UI-051 | 密码保护 | 功能 | 输入密码后才能查看 |
| UI-052 | 分享过期 | 功能 | 显示分享已过期提示 |
| UI-053 | 只读模式 | 功能 | viewer 权限无法编辑 |
| UI-054 | 评论模式 | 功能 | commenter 可以评论但不能编辑 |

### 5.6 前端服务层测试

| 用例 ID | 测试描述 | 模块 | 预期结果 |
|---|---|---|---|
| SRV-001 | 登录请求 | user.ts | POST /auth/login, 返回 token |
| SRV-002 | 注册请求 | user.ts | POST /user/register |
| SRV-003 | 获取当前用户 | user.ts | GET /currentUser |
| SRV-004 | 登出请求 | user.ts | POST /auth/logout |
| SRV-005 | 获取页面列表 | page.ts | GET /page |
| SRV-006 | 创建页面 | page.ts | POST /page |
| SRV-007 | 更新页面 | page.ts | PUT /page |
| SRV-008 | 删除页面 | page.ts | DELETE /page |
| SRV-009 | 搜索页面 | page.ts | GET /page/search |
| SRV-010 | 收藏切换 | page.ts | PUT /page/:id/favorite |
| SRV-011 | 获取回收站 | page.ts | GET /page/trash |
| SRV-012 | 恢复页面 | page.ts | POST /page/:id/restore |
| SRV-013 | 永久删除 | page.ts | DELETE /page/:id/permanent |
| SRV-014 | 创建版本 | version.ts | POST /page/:id/version |
| SRV-015 | 获取版本列表 | version.ts | GET /page/:id/versions |
| SRV-016 | 版本回滚 | version.ts | POST /page/:id/version/:vid/rollback |
| SRV-017 | 版本对比 | version.ts | GET /page/:id/version/:v1/diff/:v2 |
| SRV-018 | 创建分享 | share.ts | POST /share |
| SRV-019 | 获取分享信息 | share.ts | GET /share/:id/info |
| SRV-020 | 获取分享内容 | share.ts | GET /share/:id/content |
| SRV-021 | 添加协作者 | collaborator.ts | POST /page/:id/collaborator |
| SRV-022 | 更新协作者 | collaborator.ts | PUT /collaborator/:id |
| SRV-023 | 创建评论 | comment.ts | POST /page/:id/comment |
| SRV-024 | 解决评论 | comment.ts | PUT /comment/:id/resolve |
| SRV-025 | 创建文件夹 | folder.ts | POST /folder |
| SRV-026 | 创建标签 | tag.ts | POST /tag |
| SRV-027 | 添加页面标签 | tag.ts | POST /page-tag |
| SRV-028 | 获取通知 | notification.ts | GET /notification |
| SRV-029 | 标记通知已读 | notification.ts | POST /notification/:id/read |
| SRV-030 | AI 聊天 | ai.ts | POST /ai/chat (SSE) |
| SRV-031 | 文件上传 | upload.ts | POST /upload (multipart) |
| SRV-032 | 请求拦截器 - 附加 Token | request.ts | 请求头包含 Authorization |
| SRV-033 | 响应拦截器 - 401 重定向 | request.ts | 401 时跳转登录页 |
| SRV-034 | 响应拦截器 - 403 提示 | request.ts | 403 时 toast 错误消息 |

---

## 六、实施步骤

### 阶段 1：测试基础设施搭建 (步骤 1-3)
1. Server 端 Vitest + Supertest 配置
2. Web 端 Vitest + Testing Library + MSW 配置
3. 根级 Turbo 集成

### 阶段 2：后端 API 测试 (步骤 4-7)
4. 编写测试辅助工具 (createTestApp, createAuthenticatedRequest 等)
5. 编写 HealthController + AuthController + UserController 测试
6. 编写 PageController + SyncController + VersionController 测试
7. 编写其余 Controller 测试 (Share, Collaborator, Comment, Folder, Tag, Notification, AI, Upload, Application, Audit)

### 阶段 3：后端安全测试 (步骤 8-9)
8. 编写认证授权安全测试 (SEC-001 ~ SEC-010)
9. 编写输入验证与注入安全测试 (SEC-011 ~ SEC-030)

### 阶段 4：前端服务层测试 (步骤 10-11)
10. 编写 MSW mock 配置和测试辅助工具
11. 编写所有服务模块测试 (SRV-001 ~ SRV-034)

### 阶段 5：前端 UI 与功能测试 (步骤 12-14)
12. 编写登录页面测试 (UI-001 ~ UI-007)
13. 编写首页文档列表测试 (UI-008 ~ UI-028)
14. 编写文档编辑页、图谱页、分享页测试 (UI-029 ~ UI-054)

### 阶段 6：验证与清理 (步骤 15)
15. 运行全部测试，确保通过率，修复失败用例

---

## 七、测试文件结构

```
apps/server/
  src/
    test/
      setup.ts                    # 测试环境初始化
      helpers.ts                  # 测试辅助函数
      modules/
        health/
          health.controller.spec.ts
        auth/
          auth.controller.spec.ts
        user/
          user.controller.spec.ts
        page/
          page.controller.spec.ts
        sync/
          sync.controller.spec.ts
        version/
          version.controller.spec.ts
        share/
          share.controller.spec.ts
        collaborator/
          collaborator.controller.spec.ts
        comment/
          comment.controller.spec.ts
        folder/
          folder.controller.spec.ts
        tag/
          tag.controller.spec.ts
        notification/
          notification.controller.spec.ts
        ai/
          ai.controller.spec.ts
        upload/
          upload.controller.spec.ts
        application/
          application.controller.spec.ts
        audit/
          audit.controller.spec.ts
      security/
        auth.security.spec.ts
        injection.security.spec.ts
        rate-limit.security.spec.ts
        data.security.spec.ts

apps/web/
  src/
    test/
      setup.ts                    # 测试环境初始化
      helpers.tsx                 # 测试辅助组件和函数
      mocks/
        handlers.ts               # MSW 请求处理器
        server.ts                 # MSW 服务器
      services/
        user.test.ts
        page.test.ts
        version.test.ts
        share.test.ts
        collaborator.test.ts
        comment.test.ts
        folder.test.ts
        tag.test.ts
        notification.test.ts
        ai.test.ts
        upload.test.ts
        request.test.ts
      pages/
        Login/
          Login.test.tsx
        DocList/
          DocList.test.tsx
        Doc/
          Doc.test.tsx
        DocGraph/
          DocGraph.test.tsx
        Share/
          Share.test.tsx
```

---

## 八、关键测试技术点

1. **NestJS 测试**：使用 `Test.createTestingModule` 创建测试模块，配合 `supertest` 发起 HTTP 请求
2. **JWT 测试**：使用 `jwt.sign()` 生成测试 token，测试过期/无效/篡改场景
3. **Zod 验证测试**：直接测试 Zod schema 的 parse/safeParse 方法
4. **SSE 测试**：使用 `supertest` 的 `.expect('Content-Type', /text\/event-stream/)` 测试流式响应
5. **文件上传测试**：使用 `supertest` 的 `.attach('file', buffer)` 测试 multipart
6. **React 组件测试**：使用 `@testing-library/react` 的 `render`、`screen`、`fireEvent`/`userEvent`
7. **API Mock**：使用 MSW 拦截前端 API 请求，返回预设数据
8. **React Query 测试**：包裹 `QueryClientProvider`，使用真实的 QueryClient
9. **Router 测试**：使用 `MemoryRouter` 或 `createMemoryHistory` 控制路由
10. **WebSocket 测试**：使用 `ws` 客户端库连接 DocYjsGateway 进行集成测试
