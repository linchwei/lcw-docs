# QA 测试工程师 - 实施计划

> **角色**: 高级测试工程师（用户视角，非开发视角）
> **目标**: 确保功能整体可用，测试真实用户操作路径
> **基础**: 已有 QA 测试计划 `.trae/documents/qa-test-plan.md`（161 个用例），本计划是具体实施步骤

---

## 项目关键参数

| 参数 | 值 |
|---|---|
| 后端端口 | 8082 |
| API 前缀 | `/api` |
| 前端端口 | 5173 (Vite 默认) |
| 数据库 | PostgreSQL 16, 端口 5433 (Docker) |
| 登录端点 | `POST /api/auth/login` |
| 注册端点 | `POST /api/user/register` |
| JWT 有效期 | 24h |
| Token 存储 | `localStorage.token` |

---

## 实施步骤

### 阶段 1：搭建 Playwright E2E 测试环境

#### 步骤 1：安装 Playwright 依赖

```bash
pnpm add -Dw @playwright/test
npx playwright install chromium
```

#### 步骤 2：创建 Playwright 配置文件

创建 `playwright.config.ts`（项目根目录）：

```typescript
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 60000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: 'http://localhost:5173',
    actionTimeout: 10000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: 'pnpm --filter @lcw-doc/server start:dev',
      port: 8082,
      reuseExistingServer: true,
      timeout: 30000,
    },
    {
      command: 'pnpm --filter @lcw-doc/web dev',
      port: 5173,
      reuseExistingServer: true,
      timeout: 30000,
    },
  ],
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
})
```

#### 步骤 3：创建 E2E 测试辅助工具

创建 `e2e/helpers.ts`：
- `login(page, username, password)` - 通过 UI 登录
- `apiLogin(username, password)` - 通过 API 直接获取 token
- `createTestDocument(page, title?)` - 创建测试文档
- `waitForSaveStatus(page, status)` - 等待保存状态

创建 `e2e/page-objects/` 目录：
- `login.page.ts` - LoginPage（用户名/密码输入、登录/注册切换、提交按钮）
- `doclist.page.ts` - DocListPage（新建按钮、文档卡片、三点菜单、搜索）
- `doc.page.ts` - DocPage（标题编辑、保存状态、分享/版本/评论面板）
- `share.page.ts` - SharePage（密码输入、文档内容、过期提示）

#### 步骤 4：添加 E2E 测试脚本

在根 `package.json` 添加：
```json
"test:e2e": "playwright test",
"test:e2e:headed": "playwright test --headed"
```

---

### 阶段 2：P0 核心流程 E2E 测试

#### 步骤 5：编写认证流程 E2E 测试

文件：`e2e/auth.spec.ts`

覆盖用例：
- E2E-001: 未登录访问 `/` 自动跳转到 `/account/login`
- E2E-002: 注册新用户（输入用户名+密码 → Toast 提示 → 切回登录模式）
- E2E-003: 登录成功（Toast 提示 → 跳转到 `/doc`）
- E2E-004: 登录后首页空状态（"暂无文档"引导）
- E2E-005: 点击"新建文档"→ 创建文档 → 跳转编辑页
- E2E-006: 编辑页输入标题和内容 → 状态栏"已保存"
- E2E-007: 返回首页 → 新文档出现在卡片列表
- E2E-088: 点击退出登录 → 跳转登录页
- E2E-089: 重新登录 → 首页文档列表正确显示

#### 步骤 6：编写文档编辑 E2E 测试

文件：`e2e/doc-edit.spec.ts`

覆盖用例：
- E2E-008: 输入文本 → 保存状态从"保存中"变为"已保存"
- E2E-009: 修改标题 → 面包屑同步更新
- E2E-010: 选择 emoji → 文档 emoji 更新
- E2E-011: 添加封面 → 封面图显示
- E2E-012: 移除封面 → 封面消失
- E2E-013: 刷新页面 → 内容不丢失

---

### 阶段 3：P1 重要功能 E2E 测试

#### 步骤 7：编写分享功能 E2E 测试

文件：`e2e/share.spec.ts`

覆盖用例：
- E2E-014 ~ E2E-025（共 12 个用例）
- 重点：创建分享链接、密码保护、过期时间、隐身窗口访问、删除分享

#### 步骤 8：编写协作者权限 E2E 测试

文件：`e2e/collaborator.spec.ts`

覆盖用例：
- E2E-026 ~ E2E-033（共 8 个用例）
- 重点：邀请协作者、角色变更、权限验证、边界场景

#### 步骤 9：编写版本管理 E2E 测试

文件：`e2e/version.spec.ts`

覆盖用例：
- E2E-034 ~ E2E-040（共 7 个用例）
- 重点：保存版本、版本对比、恢复版本、删除版本

#### 步骤 10：编写评论功能 E2E 测试

文件：`e2e/comment.spec.ts`

覆盖用例：
- E2E-041 ~ E2E-045（共 5 个用例）
- 重点：发表评论、回复、标记已解决、删除

#### 步骤 11：编写权限边界 E2E 测试

文件：`e2e/permission.spec.ts`

覆盖用例：
- E2E-078 ~ E2E-084（共 7 个用例）
- 重点：查看者/评论者/编辑者权限验证、非所有者限制

#### 步骤 12：编写离线重连 E2E 测试

文件：`e2e/offline.spec.ts`

覆盖用例：
- E2E-085 ~ E2E-087（共 3 个用例）
- 重点：断网→离线编辑→恢复连接→同步

---

### 阶段 4：P2 一般功能 E2E 测试

#### 步骤 13：编写文档组织与检索 E2E 测试

文件：`e2e/doc-organize.spec.ts`

覆盖用例：
- E2E-046 ~ E2E-058（共 13 个用例）
- 重点：文件夹、标签、搜索、收藏、删除/恢复/永久删除

#### 步骤 14：编写导出/AI/通知/图谱/Markdown 上传 E2E 测试

文件：`e2e/extra-features.spec.ts`

覆盖用例：
- E2E-059 ~ E2E-077（共 19 个用例）
- 重点：文档图谱、导出（MD/HTML/Word/PDF/TXT）、AI 助手、通知、Markdown 上传

---

### 阶段 5：API 黑盒补充测试

#### 步骤 15：编写 API 边界场景测试

基于现有 Vitest + Supertest 基础设施，在 `apps/server/src/test/api-boundary/` 目录下创建：

- `auth-boundary.spec.ts` - API-AUTH-001 ~ 008（8 个用例）
  - token 有效期验证、登出后 token 状态、用户名/密码边界值、特殊字符
- `page-boundary.spec.ts` - API-PAGE-001 ~ 011（11 个用例）
  - 空 emoji/title、coverImage 为 null/无效 URL、搜索特殊字符/超长、收藏/恢复/删除边界
- `share-boundary.spec.ts` - API-SHARE-001 ~ 007（7 个用例）
  - 无效权限值、过去过期时间、非所有者创建、多分享、过期访问、密码验证、非所有者删除
- `collaborator-boundary.spec.ts` - API-COLLAB-001 ~ 004（4 个用例）
  - 添加自己、重复添加、非所有者添加、更新不存在协作者
- `version-boundary.spec.ts` - API-VER-001 ~ 003（3 个用例）
  - 不存在页面创建版本、相同版本对比、不存在页面回滚
- `comment-boundary.spec.ts` - API-CMT-001 ~ 004（4 个用例）
  - 空内容、超长内容、回复不存在评论、重复解决
- `upload-boundary.spec.ts` - API-UPLOAD-001 ~ 003（3 个用例）
  - 非图片文件、空文件、特殊字符文件名
- `tag-boundary.spec.ts` - API-TAG-001 ~ 003（3 个用例）
  - 同名标签、删除后关联、重复添加页面标签

#### 步骤 16：编写安全测试补充

文件：`apps/server/src/test/security/advanced.security.spec.ts`

覆盖用例：
- SEC-031 ~ SEC-037（7 个用例）
- 重点：暴力破解密码、WebSocket 认证、恶意文件上传、批量枚举、JWT 过期、并发编辑

---

### 阶段 6：UI 交互补充测试

#### 步骤 17：编写前端 UI 交互测试

基于现有 Vitest + Testing Library + MSW 基础设施，在 `apps/web/src/test/interactions/` 目录下创建：

- `login-interaction.test.tsx` - UI-INT-001 ~ 004（4 个用例）
  - 提交后按钮禁用、失败后可重提交、密码显隐切换、注册后切回登录
- `doclist-interaction.test.tsx` - UI-INT-005 ~ 013（9 个用例）
  - 三点菜单、封面子菜单、选择/移除封面、标签子菜单、添加/创建标签、删除确认、卡片跳转
- `doc-interaction.test.tsx` - UI-INT-014 ~ 022（9 个用例）
  - 标题编辑、保存状态、分享面板、创建/复制分享链接、版本面板、保存版本、评论面板、发表评论
- `sidebar-interaction.test.tsx` - UI-INT-023 ~ 027（5 个用例）
  - 搜索对话框、搜索结果点击、回收站展开/折叠、恢复文档、永久删除

#### 步骤 18：运行全部测试并修复失败用例

- 运行 `pnpm test` 确保现有测试不受影响
- 运行 `pnpm test:e2e` 确保 E2E 测试通过
- 修复所有失败用例

---

## 文件结构总览

```
e2e/
  helpers.ts                              # E2E 辅助函数
  page-objects/
    login.page.ts                         # 登录页 Page Object
    doclist.page.ts                       # 首页 Page Object
    doc.page.ts                           # 编辑页 Page Object
    share.page.ts                         # 分享页 Page Object
  auth.spec.ts                            # 认证流程 (E2E-001~007, 088~089)
  doc-edit.spec.ts                        # 文档编辑 (E2E-008~013)
  share.spec.ts                           # 分享功能 (E2E-014~025)
  collaborator.spec.ts                    # 协作者权限 (E2E-026~033)
  version.spec.ts                         # 版本管理 (E2E-034~040)
  comment.spec.ts                         # 评论功能 (E2E-041~045)
  permission.spec.ts                      # 权限边界 (E2E-078~084)
  offline.spec.ts                         # 离线重连 (E2E-085~087)
  doc-organize.spec.ts                    # 文档组织检索 (E2E-046~058)
  extra-features.spec.ts                  # 导出/AI/通知/图谱/上传 (E2E-059~077)

apps/server/src/test/
  api-boundary/
    auth-boundary.spec.ts                 # 认证边界 (API-AUTH-001~008)
    page-boundary.spec.ts                 # 页面边界 (API-PAGE-001~011)
    share-boundary.spec.ts                # 分享边界 (API-SHARE-001~007)
    collaborator-boundary.spec.ts         # 协作者边界 (API-COLLAB-001~004)
    version-boundary.spec.ts              # 版本边界 (API-VER-001~003)
    comment-boundary.spec.ts              # 评论边界 (API-CMT-001~004)
    upload-boundary.spec.ts               # 上传边界 (API-UPLOAD-001~003)
    tag-boundary.spec.ts                  # 标签边界 (API-TAG-001~003)
  security/
    advanced.security.spec.ts             # 高级安全 (SEC-031~037)

apps/web/src/test/
  interactions/
    login-interaction.test.tsx            # 登录交互 (UI-INT-001~004)
    doclist-interaction.test.tsx          # 首页交互 (UI-INT-005~013)
    doc-interaction.test.tsx              # 编辑页交互 (UI-INT-014~022)
    sidebar-interaction.test.tsx          # 侧边栏交互 (UI-INT-023~027)

playwright.config.ts                      # Playwright 配置（项目根目录）
```

---

## 用例统计

| 类别 | 用例数 | 文件数 |
|---|---|---|
| E2E 用户流程测试 | 89 | 11 |
| API 黑盒补充测试 | 38 | 8 |
| UI 交互补充测试 | 27 | 4 |
| 安全测试补充 | 7 | 1 |
| **总计** | **161** | **24** |

加上现有 173 个测试用例，项目将达到 **334 个测试用例**。

---

## 前置条件

1. **数据库**: Docker PostgreSQL 需要运行（`pnpm docker:start`）
2. **环境变量**: 服务端 `.env` 需要配置 `JWT_SECRET` 和数据库连接
3. **依赖构建**: 需要先 `pnpm build` 确保 packages 可用
4. **E2E 测试需要**: 同时启动 server 和 web 开发服务器

---

## 实施优先级

1. **先做 API 黑盒测试**（步骤 15-16）- 不需要浏览器，执行快，能立即验证后端功能
2. **再做 UI 交互测试**（步骤 17）- 基于现有基础设施，扩展方便
3. **最后做 E2E 测试**（步骤 5-14）- 需要完整环境，执行慢，但价值最高
