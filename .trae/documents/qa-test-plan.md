# 高级测试工程师 - 全面测试计划

> **核心理念**：从用户视角出发，测试真实可用性，而非代码覆盖率。
> 现有 173 个测试用例都是开发者视角的单元/集成测试，本计划补充**端到端用户流程测试**和**黑盒功能验证测试**。

---

## 一、测试策略

### 1.1 测试分层

| 层级 | 工具 | 目标 | 现状 |
|---|---|---|---|
| **E2E 用户流程测试** | Playwright | 验证用户真实操作路径 | ❌ 完全缺失 |
| **API 黑盒测试** | Vitest + Supertest | 验证 API 契约和行为 | ⚠️ 有但不够（缺少边界/错误场景） |
| **UI 交互测试** | Vitest + Testing Library | 验证 UI 组件交互 | ⚠️ 有但太浅（只测渲染，不测交互） |

### 1.2 测试优先级

| 优先级 | 标准 | 示例 |
|---|---|---|
| P0 - 阻断级 | 核心流程不通则产品不可用 | 登录、创建文档、编辑保存 |
| P1 - 严重级 | 重要功能异常影响用户体验 | 分享、协作、版本回滚 |
| P2 - 一般级 | 功能可用但边界场景有问题 | 标签管理、文件夹、通知 |
| P3 - 轻微级 | UI 细节或罕见场景 | 主题切换、键盘快捷键 |

---

## 二、E2E 用户流程测试（Playwright）

### 2.1 安装 Playwright

```bash
pnpm add -Dw @playwright/test
npx playwright install chromium
```

创建 `playwright.config.ts`：
```typescript
import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: './e2e',
  timeout: 60000,
  use: {
    baseURL: 'http://localhost:5173',
    actionTimeout: 10000,
  },
  webServer: [
    { command: 'pnpm --filter @lcw-doc/server start:dev', port: 3000, reuseExistingServer: true },
    { command: 'pnpm --filter @lcw-doc/web dev', port: 5173, reuseExistingServer: true },
  ],
})
```

### 2.2 E2E 测试用例 - 按用户流程组织

#### 流程1：新用户注册到创建文档（P0）

| 用例ID | 测试步骤 | 预期结果 |
|---|---|---|
| E2E-001 | 访问 `/`，未登录状态 | 自动跳转到 `/account/login` |
| E2E-002 | 在登录页点击"立即注册"，输入用户名+密码，点击注册 | Toast 提示"注册成功"，自动切回登录模式 |
| E2E-003 | 注册后输入凭据，点击登录 | Toast 提示"登录成功"，跳转到 `/doc` |
| E2E-004 | 登录后首页显示空状态 | 显示"暂无文档"引导 |
| E2E-005 | 点击"新建文档"按钮 | 创建文档，自动跳转到编辑页 |
| E2E-006 | 在编辑页输入标题和内容 | 标题和内容正确显示，状态栏显示"已保存" |
| E2E-007 | 返回首页 | 新文档出现在卡片列表中 |

#### 流程2：文档编辑与保存（P0）

| 用例ID | 测试步骤 | 预期结果 |
|---|---|---|
| E2E-008 | 在编辑器中输入文本 | 内容实时显示，保存状态从"保存中"变为"已保存" |
| E2E-009 | 修改文档标题 | 标题更新，面包屑同步更新 |
| E2E-010 | 点击 emoji 选择器，选择新 emoji | 文档 emoji 更新 |
| E2E-011 | 点击"添加封面" | 随机添加一张封面图 |
| E2E-012 | 悬停封面，点击"移除封面" | 封面消失 |
| E2E-013 | 刷新页面 | 内容不丢失，与刷新前一致 |

#### 流程3：分享文档给外部用户（P1）

| 用例ID | 测试步骤 | 预期结果 |
|---|---|---|
| E2E-014 | 在编辑页点击"分享"按钮 | 弹出分享面板 |
| E2E-015 | 选择"可查看"权限，点击"创建分享链接" | 生成分享链接，显示在列表中 |
| E2E-016 | 点击复制链接按钮 | 链接复制到剪贴板，图标变为绿色勾 |
| E2E-017 | 创建带密码的分享链接 | 链接创建成功 |
| E2E-018 | 创建带过期时间的分享链接 | 链接创建成功，显示过期时间 |
| E2E-019 | 在隐身窗口打开分享链接（无密码） | 显示文档内容，顶部有"只读"标签 |
| E2E-020 | 在隐身窗口打开带密码的分享链接 | 显示密码输入框 |
| E2E-021 | 输入错误密码 | 显示"密码错误，请重试" |
| E2E-022 | 输入正确密码 | 显示文档内容 |
| E2E-023 | 打开已过期的分享链接 | 显示"分享链接已过期" |
| E2E-024 | 打开不存在的分享链接 | 显示"分享链接不存在或无效" |
| E2E-025 | 删除分享链接 | 链接从列表中消失，再访问返回无效 |

#### 流程4：协作者邀请与权限（P1）

| 用例ID | 测试步骤 | 预期结果 |
|---|---|---|
| E2E-026 | 点击"协作者"按钮 | 弹出协作者面板，显示"暂无协作者" |
| E2E-027 | 输入其他用户名，选择"编辑者"角色，点击邀请 | 协作者出现在列表中 |
| E2E-028 | 被邀请者登录，查看通知 | 收到协作邀请通知 |
| E2E-029 | 被邀请者点击通知跳转到文档 | 可以编辑文档 |
| E2E-030 | 将协作者角色改为"查看者" | 角色更新，文档变为只读 |
| E2E-031 | 移除协作者 | 协作者从列表消失，被移除者无法再访问 |
| E2E-032 | 尝试添加自己为协作者 | 提示"不能将自己添加为协作者" |
| E2E-033 | 尝试添加不存在的用户 | 提示用户不存在 |

#### 流程5：版本管理（P1）

| 用例ID | 测试步骤 | 预期结果 |
|---|---|---|
| E2E-034 | 点击"版本历史"按钮 | 弹出版本面板 |
| E2E-035 | 点击"保存当前版本" | 新版本出现在列表中 |
| E2E-036 | 修改文档内容，保存另一个版本 | 两个版本都出现在列表中 |
| E2E-037 | 左键选版本A，右键选版本B，点击"对比" | 显示两个版本的差异 |
| E2E-038 | 选择历史版本，点击"恢复到此版本" | 弹出确认对话框 |
| E2E-039 | 确认恢复 | 文档内容恢复到历史版本，自动创建备份版本 |
| E2E-040 | 删除一个版本 | 版本从列表中消失 |

#### 流程6：评论功能（P1）

| 用例ID | 测试步骤 | 预期结果 |
|---|---|---|
| E2E-041 | 点击"评论"按钮 | 弹出评论面板 |
| E2E-042 | 在输入框输入评论内容，点击"发表评论" | 评论出现在列表中 |
| E2E-043 | 点击评论的"回复"按钮，输入回复 | 回复显示在评论下方 |
| E2E-044 | 点击"标记已解决" | 评论变为已解决状态（灰色+删除线） |
| E2E-045 | 点击"删除" | 评论被删除 |

#### 流程7：文档组织与检索（P2）

| 用例ID | 测试步骤 | 预期结果 |
|---|---|---|
| E2E-046 | 在侧边栏点击"新建文件夹" | 创建文件夹，出现在侧边栏 |
| E2E-047 | 在文档卡片三点菜单中选择"标签" | 显示标签子菜单 |
| E2E-048 | 创建新标签（输入名称+选择颜色） | 标签创建成功，自动添加到文档 |
| E2E-049 | 添加已有标签到文档 | 标签显示在卡片上 |
| E2E-050 | 按 Cmd+K 打开搜索 | 搜索对话框弹出 |
| E2E-051 | 输入搜索关键词 | 显示匹配的搜索结果 |
| E2E-052 | 点击搜索结果 | 跳转到对应文档 |
| E2E-053 | 点击文档卡片三点菜单中的"收藏" | 文档变为收藏状态 |
| E2E-054 | 再次点击"收藏" | 取消收藏 |
| E2E-055 | 点击"删除" | 文档移入回收站 |
| E2E-056 | 在侧边栏展开回收站 | 显示已删除的文档 |
| E2E-057 | 点击"恢复" | 文档恢复正常 |
| E2E-058 | 点击"永久删除" | 文档彻底删除 |

#### 流程8：文档图谱（P2）

| 用例ID | 测试步骤 | 预期结果 |
|---|---|---|
| E2E-059 | 访问文档图谱页 | 显示文档关系图谱 |
| E2E-060 | 双击节点 | 跳转到对应文档 |
| E2E-061 | 无文档时访问图谱 | 显示"暂无文档"空状态 |

#### 流程9：导出功能（P2）

| 用例ID | 测试步骤 | 预期结果 |
|---|---|---|
| E2E-062 | 点击"导出"，选择 Markdown | 下载 .md 文件 |
| E2E-063 | 选择 HTML 导出 | 下载 .html 文件 |
| E2E-064 | 选择 Word 导出 | 下载 .docx 文件 |
| E2E-065 | 选择 PDF 导出 | 下载 .pdf 文件 |
| E2E-066 | 选择纯文本导出 | 下载 .txt 文件 |

#### 流程10：AI 辅助写作（P2）

| 用例ID | 测试步骤 | 预期结果 |
|---|---|---|
| E2E-067 | 点击右下角 AI 助手按钮 | 打开聊天窗口 |
| E2E-068 | 输入问题，发送 | AI 流式回复 |
| E2E-069 | 点击"插入文档" | AI 回复内容插入编辑器 |
| E2E-070 | 选中文本，点击 AI 菜单中的"续写" | AI 续写内容插入 |

#### 流程11：通知系统（P2）

| 用例ID | 测试步骤 | 预期结果 |
|---|---|---|
| E2E-071 | 被添加为协作者后查看通知 | 铃铛显示未读数 |
| E2E-072 | 点击通知 | 跳转到对应文档，通知标记已读 |
| E2E-073 | 点击"全部标记已读" | 所有通知变为已读 |

#### 流程12：Markdown 上传（P2）

| 用例ID | 测试步骤 | 预期结果 |
|---|---|---|
| E2E-074 | 点击"上传 Markdown"，选择 .md 文件 | 显示预览（文件名、行数、标题） |
| E2E-075 | 点击确认上传 | 创建文档并跳转 |
| E2E-076 | 上传非 .md 文件 | 提示"仅支持 .md 格式文件" |
| E2E-077 | 上传超过 5MB 的文件 | 提示"文件大小超过限制" |

#### 流程13：权限边界测试（P1）

| 用例ID | 测试步骤 | 预期结果 |
|---|---|---|
| E2E-078 | 查看者尝试编辑文档 | 编辑器不可编辑，显示"只读模式"提示 |
| E2E-079 | 评论者尝试编辑文档 | 编辑器不可编辑，显示"评论模式"提示 |
| E2E-080 | 评论者创建评论 | 评论成功创建 |
| E2E-081 | 非所有者尝试删除文档 | 三点菜单中无"删除"选项 |
| E2E-082 | 非所有者尝试管理协作者 | 协作者面板无"邀请"功能 |
| E2E-083 | 分享链接的"可编辑"权限用户编辑文档 | 可以编辑 |
| E2E-084 | 未登录用户访问分享链接 | 显示文档内容 + "登录以协作"按钮 |

#### 流程14：离线与重连（P1）

| 用例ID | 测试步骤 | 预期结果 |
|---|---|---|
| E2E-085 | 断开网络连接 | 状态栏显示"离线模式（本地已保存）" |
| E2E-086 | 离线状态下编辑文档 | 内容保存到本地 IndexedDB |
| E2E-087 | 恢复网络连接 | 状态栏变为"已同步"，内容同步到服务器 |

#### 流程15：登出与重登录（P0）

| 用例ID | 测试步骤 | 预期结果 |
|---|---|---|
| E2E-088 | 点击用户头像，点击"退出登录" | 跳转到登录页 |
| E2E-089 | 重新登录 | 跳转到首页，文档列表正确显示 |

---

## 三、API 黑盒测试补充用例

> 现有 126 个 API 测试主要覆盖正常路径，以下补充**边界场景**和**错误路径**。

### 3.1 认证模块补充

| 用例ID | 测试描述 | 请求 | 预期 |
|---|---|---|---|
| API-AUTH-001 | 登录后 token 有效期验证 | 用登录返回的 token 访问 /currentUser | 成功 |
| API-AUTH-002 | 登出后 token 是否失效 | 登出后用原 token 访问 /currentUser | 取决于实现（JWT 无状态则仍有效） |
| API-AUTH-003 | 注册用户名边界 - 恰好3字符 | POST /user/register { username: "abc", password: "123456" } | 201 |
| API-AUTH-004 | 注册用户名边界 - 恰好20字符 | POST /user/register { username: "a"*20, password: "123456" } | 201 |
| API-AUTH-005 | 注册密码边界 - 恰好6字符 | POST /user/register { username: "test", password: "123456" } | 201 |
| API-AUTH-006 | 注册密码边界 - 恰好50字符 | POST /user/register { username: "test", password: "a"*50 } | 201 |
| API-AUTH-007 | 登录 - 用户名含空格 | POST /auth/login { username: "test user", password: "xxx" } | 400 或 401 |
| API-AUTH-008 | 登录 - 密码含特殊字符 | POST /auth/login { username: "test", password: "p@ss!w0rd#" } | 正常处理 |

### 3.2 页面模块补充

| 用例ID | 测试描述 | 请求 | 预期 |
|---|---|---|---|
| API-PAGE-001 | 创建页面 - emoji 为空字符串 | POST /page { emoji: "", title: "Test" } | 取决于验证 |
| API-PAGE-002 | 创建页面 - title 为空字符串 | POST /page { emoji: "📄", title: "" } | 取决于验证 |
| API-PAGE-003 | 更新页面 - coverImage 为 null | PUT /page { pageId, coverImage: null } | 200，封面被移除 |
| API-PAGE-004 | 更新页面 - coverImage 为无效 URL | PUT /page { pageId, coverImage: "not-a-url" } | 取决于验证 |
| API-PAGE-005 | 搜索 - 特殊字符 | GET /page/search?q=<script>alert(1)</script> | 不报错，返回空或安全结果 |
| API-PAGE-006 | 搜索 - 超长查询 | GET /page/search?q=aaaa...(1000字符) | 不报错 |
| API-PAGE-007 | 收藏切换 - 不存在的页面 | PUT /page/nonexistent/favorite | 404 |
| API-PAGE-008 | 恢复 - 未删除的页面 | POST /page/pageId/restore | 取决于实现 |
| API-PAGE-009 | 永久删除 - 未在回收站的页面 | DELETE /page/pageId/permanent | 取决于实现 |
| API-PAGE-010 | 软删除后列表不显示 | DELETE /page { pageId } 后 GET /page | 已删除页面不出现在列表中 |
| API-PAGE-011 | 软删除后回收站显示 | DELETE /page { pageId } 后 GET /page/trash | 已删除页面出现在回收站 |

### 3.3 分享模块补充

| 用例ID | 测试描述 | 请求 | 预期 |
|---|---|---|---|
| API-SHARE-001 | 创建分享 - 无效权限值 | POST /share { pageId, permission: "admin" } | 400 |
| API-SHARE-002 | 创建分享 - 过去的时间作为过期时间 | POST /share { pageId, permission: "view", expiresAt: "2020-01-01" } | 取决于验证 |
| API-SHARE-003 | 创建分享 - 非所有者创建 | 用户B对用户A的文档 POST /share | 403 |
| API-SHARE-004 | 同一页面创建多个分享 | 连续 POST /share { pageId, permission: "view" } 两次 | 两个分享都创建成功 |
| API-SHARE-005 | 访问分享 - 过期分享 | GET /share/expiredId/content | 410 Gone |
| API-SHARE-006 | 访问分享 - 密码正确 | GET /share/id/info?password=correct | 200 |
| API-SHARE-007 | 删除分享 - 非所有者删除 | 用户B删除用户A的分享 | 403 |

### 3.4 协作者模块补充

| 用例ID | 测试描述 | 请求 | 预期 |
|---|---|---|---|
| API-COLLAB-001 | 添加自己为协作者 | POST /page/pageId/collaborator { username: "当前用户", role: "editor" } | 400 |
| API-COLLAB-002 | 重复添加同一协作者 | 连续两次 POST /page/pageId/collaborator | 第二次更新角色 |
| API-COLLAB-003 | 非所有者添加协作者 | 用户B对用户A的文档添加协作者 | 403 |
| API-COLLAB-004 | 更新不存在的协作者 | PUT /collaborator/nonexistent { role: "editor" } | 404 |

### 3.5 版本模块补充

| 用例ID | 测试描述 | 请求 | 预期 |
|---|---|---|---|
| API-VER-001 | 创建版本 - 不存在的页面 | POST /page/nonexistent/version | 404 |
| API-VER-002 | 版本对比 - 相同版本 | GET /page/pageId/version/v1/diff/v1 | 差异为空 |
| API-VER-003 | 回滚 - 不存在的页面 | POST /page/nonexistent/version/v1/rollback | 404 |

### 3.6 评论模块补充

| 用例ID | 测试描述 | 请求 | 预期 |
|---|---|---|---|
| API-CMT-001 | 创建评论 - 空内容 | POST /page/pageId/comment { pageId, content: "" } | 400 |
| API-CMT-002 | 创建评论 - 超长内容 | POST /page/pageId/comment { pageId, content: "a"*10000 } | 取决于验证 |
| API-CMT-003 | 回复不存在的评论 | POST /comment/nonexistent/reply { parentId, content: "test" } | 404 |
| API-CMT-004 | 解决已解决的评论 | PUT /comment/resolvedId/resolve | 幂等，200 |

### 3.7 文件上传补充

| 用例ID | 测试描述 | 请求 | 预期 |
|---|---|---|---|
| API-UPLOAD-001 | 上传非图片文件 | POST /upload (attach .exe) | 取决于验证 |
| API-UPLOAD-002 | 上传空文件 | POST /upload (attach 0 byte file) | 取决于验证 |
| API-UPLOAD-003 | 上传文件名含特殊字符 | POST /upload (attach "测试<file>.txt") | 正常处理 |

### 3.8 标签模块补充

| 用例ID | 测试描述 | 请求 | 预期 |
|---|---|---|---|
| API-TAG-001 | 创建同名标签 | POST /tag { name: "重复" } 两次 | 取决于实现 |
| API-TAG-002 | 删除标签后页面标签关联 | DELETE /tag/tagId 后 GET /page/pageId/tags | 标签不再出现 |
| API-TAG-003 | 重复添加页面标签 | POST /page-tag { pageId, tagId } 两次 | 第二次 409 或幂等 |

---

## 四、UI 交互测试补充

> 现有前端测试只验证了渲染，以下补充**用户交互**测试。

### 4.1 登录页交互测试

| 用例ID | 测试描述 | 操作 | 预期 |
|---|---|---|---|
| UI-INT-001 | 登录表单提交后按钮禁用 | 输入凭据，点击登录 | 按钮变为"处理中..."且禁用 |
| UI-INT-002 | 登录失败后可重新提交 | 输入错误密码提交，再输入正确密码 | 第二次可以正常提交 |
| UI-INT-003 | 密码显示/隐藏切换 | 点击密码输入框的眼睛图标 | 密码在明文和密文之间切换 |
| UI-INT-004 | 注册成功后自动切回登录 | 注册成功后 | 表单切换到登录模式 |

### 4.2 首页文档列表交互测试

| 用例ID | 测试描述 | 操作 | 预期 |
|---|---|---|---|
| UI-INT-005 | 三点菜单打开/关闭 | 点击三点按钮 | 下拉菜单出现；点击其他区域菜单关闭 |
| UI-INT-006 | 封面子菜单交互 | 悬停"封面"菜单项 | 子菜单展开，显示6张封面图 |
| UI-INT-007 | 选择封面图 | 点击某张封面图 | 卡片显示该封面图 |
| UI-INT-008 | 移除封面 | 点击"移除封面" | 封面消失，恢复为 emoji 显示 |
| UI-INT-009 | 标签子菜单交互 | 悬停"标签"菜单项 | 子菜单展开，显示已有标签列表 |
| UI-INT-010 | 添加已有标签 | 点击某个标签 | 标签添加到文档，卡片显示标签 |
| UI-INT-011 | 创建新标签 | 输入名称+选择颜色+点击创建 | 新标签创建并添加到文档 |
| UI-INT-012 | 删除文档确认 | 点击"删除" | 文档从列表消失，移入回收站 |
| UI-INT-013 | 卡片点击跳转 | 点击文档卡片 | 跳转到编辑页 |

### 4.3 编辑页交互测试

| 用例ID | 测试描述 | 操作 | 预期 |
|---|---|---|---|
| UI-INT-014 | 标题编辑 | 点击标题区域，修改文字 | 标题更新 |
| UI-INT-015 | 保存状态变化 | 编辑内容后等待 | 状态从"保存中"变为"已保存" |
| UI-INT-016 | 分享面板打开/关闭 | 点击分享按钮 | Popover 弹出/关闭 |
| UI-INT-017 | 创建分享链接 | 在分享面板选择权限+创建 | 链接出现在列表中 |
| UI-INT-018 | 复制分享链接 | 点击复制按钮 | 图标变为绿色勾 |
| UI-INT-019 | 版本面板打开/关闭 | 点击版本历史按钮 | 面板打开/关闭 |
| UI-INT-020 | 保存版本 | 点击"保存当前版本" | 新版本出现在列表 |
| UI-INT-021 | 评论面板交互 | 点击评论按钮 | 面板打开，显示评论列表 |
| UI-INT-022 | 发表评论 | 输入评论+点击发表 | 评论出现在列表中 |

### 4.4 侧边栏交互测试

| 用例ID | 测试描述 | 操作 | 预期 |
|---|---|---|---|
| UI-INT-023 | 搜索对话框 | 按 Cmd+K | 搜索对话框弹出 |
| UI-INT-024 | 搜索结果点击 | 输入关键词+点击结果 | 跳转到对应文档 |
| UI-INT-025 | 回收站展开/折叠 | 点击回收站 | 展开显示已删除文档 |
| UI-INT-026 | 恢复文档 | 点击恢复按钮 | 文档恢复，从回收站消失 |
| UI-INT-027 | 永久删除文档 | 点击永久删除 | 文档彻底删除 |

---

## 五、安全测试补充

| 用例ID | 测试描述 | 攻击向量 | 预期 |
|---|---|---|---|
| SEC-031 | 分享链接暴力破解密码 | 对有密码的分享连续尝试不同密码 | 应有速率限制 |
| SEC-032 | WebSocket 未认证连接 | 不带 token 连接 WebSocket | 连接被拒绝 |
| SEC-033 | WebSocket 伪造 shareId | 用伪造的 shareId 连接 | 连接被拒绝 |
| SEC-034 | 文件上传恶意文件 | 上传 .html 或 .svg 文件（含 XSS） | 文件被拒绝或消毒 |
| SEC-035 | 批量枚举分享链接 | 遍历 shareId 格式 | 应有速率限制 |
| SEC-036 | JWT 无过期时间 | 检查 JWT payload | 应有 exp 字段 |
| SEC-037 | 并发编辑冲突 | 两个用户同时编辑同一段落 | Yjs CRDT 自动合并，不丢数据 |

---

## 六、实施步骤

### 阶段 1：搭建 Playwright E2E 测试环境（步骤 1-2）

1. **安装 Playwright 并创建配置文件**
   - `pnpm add -Dw @playwright/test`
   - `npx playwright install chromium`
   - 创建 `playwright.config.ts`
   - 创建 `e2e/helpers.ts`（登录辅助、页面对象）

2. **创建 E2E 测试辅助工具**
   - `e2e/helpers.ts`：`login(page, username, password)`、`createTestDocument(page)`、`navigateToDoc(page, docId)` 等
   - `e2e/page-objects/`：LoginPage、DocListPage、DocPage、SharePage 等 Page Object

### 阶段 2：P0 核心流程 E2E 测试（步骤 3-5）

3. **编写认证流程 E2E 测试**（E2E-001 ~ E2E-007）
   - `e2e/auth.spec.ts`
4. **编写文档编辑 E2E 测试**（E2E-008 ~ E2E-013）
   - `e2e/doc-edit.spec.ts`
5. **编写登出重登录 E2E 测试**（E2E-088 ~ E2E-089）
   - 合并到 `e2e/auth.spec.ts`

### 阶段 3：P1 重要功能 E2E 测试（步骤 6-9）

6. **编写分享功能 E2E 测试**（E2E-014 ~ E2E-025）
   - `e2e/share.spec.ts`
7. **编写协作者权限 E2E 测试**（E2E-026 ~ E2E-033）
   - `e2e/collaborator.spec.ts`
8. **编写版本管理 E2E 测试**（E2E-034 ~ E2E-040）
   - `e2e/version.spec.ts`
9. **编写评论功能 E2E 测试**（E2E-041 ~ E2E-045）
   - `e2e/comment.spec.ts`

### 阶段 4：P2 一般功能 E2E 测试（步骤 10-12）

10. **编写文档组织与检索 E2E 测试**（E2E-046 ~ E2E-058）
    - `e2e/doc-organize.spec.ts`
11. **编写导出、AI、通知 E2E 测试**（E2E-059 ~ E2E-073）
    - `e2e/export-ai-notification.spec.ts`
12. **编写 Markdown 上传 E2E 测试**（E2E-074 ~ E2E-077）
    - `e2e/markdown-upload.spec.ts`

### 阶段 5：API 黑盒补充测试（步骤 13-14）

13. **编写 API 边界场景测试**（API-AUTH ~ API-TAG）
    - `apps/server/src/test/api-boundary/auth-boundary.spec.ts`
    - `apps/server/src/test/api-boundary/page-boundary.spec.ts`
    - `apps/server/src/test/api-boundary/share-boundary.spec.ts`
    - `apps/server/src/test/api-boundary/collaborator-boundary.spec.ts`
    - `apps/server/src/test/api-boundary/version-boundary.spec.ts`
    - `apps/server/src/test/api-boundary/comment-boundary.spec.ts`
    - `apps/server/src/test/api-boundary/upload-boundary.spec.ts`
    - `apps/server/src/test/api-boundary/tag-boundary.spec.ts`

14. **编写安全测试补充**（SEC-031 ~ SEC-037）
    - `apps/server/src/test/security/advanced.security.spec.ts`

### 阶段 6：UI 交互补充测试（步骤 15-16）

15. **编写前端 UI 交互测试**（UI-INT-001 ~ UI-INT-027）
    - `apps/web/src/test/interactions/login-interaction.test.tsx`
    - `apps/web/src/test/interactions/doclist-interaction.test.tsx`
    - `apps/web/src/test/interactions/doc-interaction.test.tsx`
    - `apps/web/src/test/interactions/sidebar-interaction.test.tsx`

16. **运行全部测试，修复失败用例**

---

## 七、测试文件结构

```
e2e/
  helpers.ts                         # E2E 测试辅助函数
  page-objects/
    login.page.ts                    # 登录页 Page Object
    doclist.page.ts                  # 首页 Page Object
    doc.page.ts                      # 编辑页 Page Object
    share.page.ts                    # 分享页 Page Object
  auth.spec.ts                       # 认证流程 E2E
  doc-edit.spec.ts                   # 文档编辑 E2E
  share.spec.ts                      # 分享功能 E2E
  collaborator.spec.ts               # 协作者权限 E2E
  version.spec.ts                    # 版本管理 E2E
  comment.spec.ts                    # 评论功能 E2E
  doc-organize.spec.ts               # 文档组织检索 E2E
  export-ai-notification.spec.ts     # 导出/AI/通知 E2E
  markdown-upload.spec.ts            # Markdown 上传 E2E

apps/server/src/test/
  api-boundary/
    auth-boundary.spec.ts            # 认证边界测试
    page-boundary.spec.ts            # 页面边界测试
    share-boundary.spec.ts           # 分享边界测试
    collaborator-boundary.spec.ts    # 协作者边界测试
    version-boundary.spec.ts         # 版本边界测试
    comment-boundary.spec.ts         # 评论边界测试
    upload-boundary.spec.ts          # 上传边界测试
    tag-boundary.spec.ts             # 标签边界测试
  security/
    advanced.security.spec.ts        # 高级安全测试

apps/web/src/test/
  interactions/
    login-interaction.test.tsx       # 登录交互测试
    doclist-interaction.test.tsx     # 首页交互测试
    doc-interaction.test.tsx         # 编辑页交互测试
    sidebar-interaction.test.tsx     # 侧边栏交互测试
```

---

## 八、测试用例统计

| 类别 | 用例数 | 优先级 |
|---|---|---|
| E2E 用户流程测试 | 89 | P0-P2 |
| API 黑盒补充测试 | 38 | P1-P2 |
| UI 交互补充测试 | 27 | P1-P2 |
| 安全测试补充 | 7 | P1 |
| **总计** | **161** | - |

加上现有 173 个测试用例，项目将达到 **334 个测试用例**。
