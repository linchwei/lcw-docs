# 文档分享与权限控制完善计划

## 问题分析

当前系统已有两套分享机制，但存在关键缺陷导致分享功能不完整：

### 已有功能
1. **分享链接** (SharePopover → ShareEntity) — 生成公开链接，支持 view/comment/edit 权限、密码保护、过期时间
2. **协作者** (CollaboratorPanel → CollaboratorEntity) — 通过用户名邀请已注册用户，支持 editor/viewer 角色

### 关键缺陷

| # | 缺陷 | 严重程度 | 说明 |
|---|------|---------|------|
| 1 | 协作者看不到共享文档 | 🔴 严重 | `PageService.list/fetch/recent` 仅返回 `user.id === userId` 的页面，协作者无法在页面列表中找到共享文档 |
| 2 | 协作者无法打开共享文档 | 🔴 严重 | `PageService.fetch()` 要求页面所有者才能获取，协作者访问 `/doc/:id` 会返回 404 |
| 3 | WebSocket 不强制执行权限 | 🔴 严重 | 所有 WebSocket 连接都有完整读写能力，`view` 权限的分享链接用户仍可通过 WS 修改文档 |
| 4 | 协作者角色未在编辑器中生效 | 🟡 中等 | Doc 页面编辑器始终可编辑，viewer 角色的协作者也能编辑内容 |
| 5 | 无"与我共享"页面列表 | 🟡 中等 | 前端侧边栏和首页没有"与我共享"分区 |
| 6 | 分享链接 comment 权限未实现 | 🟢 低 | ShareEntity 支持 comment 权限但无对应 UI 功能 |

---

## 实施计划

### 任务 1：后端 — PageService 支持协作者访问

**目标**：协作者可以通过 `GET /page/:pageId` 访问共享文档

**修改文件**：
- `apps/server/src/modules/page/page.service.ts`

**具体改动**：
1. `fetch()` 方法：先查页面是否存在（不限制 owner），再检查当前用户是否为 owner 或 collaborator
2. 新增 `checkPageAccess(userId, pageId)` 私有方法：返回 `{ page, role }` 其中 role 为 'owner' | 'editor' | 'viewer' | null
3. `list()` 方法：返回两部分数据 — `{ own: [...], shared: [...] }`，shared 来自 collaborator 表关联查询
4. `recent()` 方法：合并协作者可访问的页面

**关键逻辑**：
```typescript
async fetch(params: { pageId: string; userId: number }) {
    const page = await this.pageRepository.findOne({
        where: { pageId: params.pageId, isDeleted: false },
    })
    if (!page) throw new NotFoundException('page not found')

    const access = await this.checkPageAccess(params.userId, page)
    if (!access) throw new ForbiddenException('no access')

    return { ...page, role: access }
}

private async checkPageAccess(userId: number, page: PageEntity) {
    if (page.user.id === userId) return 'owner'
    const collaborator = await this.collaboratorRepository.findOne({
        where: { pageId: page.pageId, userId },
    })
    return collaborator ? collaborator.role : null
}
```

---

### 任务 2：后端 — 新增"与我共享"API

**目标**：提供独立的 API 获取共享给当前用户的页面列表

**修改文件**：
- `apps/server/src/modules/page/page.controller.ts` — 新增 `GET /page/shared` 端点
- `apps/server/src/modules/page/page.service.ts` — 新增 `shared()` 方法

**具体改动**：
1. `PageController` 新增 `@Get('shared')` 端点
2. `PageService.shared()` 查询当前用户作为 collaborator 的所有页面，返回页面信息 + 角色
3. 注意路由顺序：`shared` 必须在 `:pageId` 之前，否则会被当作 pageId

**返回格式**：
```json
{
  "data": [
    {
      "pageId": "xxx",
      "title": "共享文档",
      "emoji": "📄",
      "role": "editor",
      "ownerName": "lin",
      "updatedAt": "..."
    }
  ],
  "success": true
}
```

---

### 任务 3：后端 — WebSocket 权限强制执行

**目标**：在 WebSocket 层面强制执行分享链接的权限控制

**修改文件**：
- `apps/server/src/modules/doc-yjs/doc-yjs.gateway.ts`
- `apps/server/src/fundamentals/yjs-postgresql/utils.ts`

**具体改动**：

#### 3.1 网关传递权限信息
在 `doc-yjs.gateway.ts` 中，通过 `shareId` 连接时获取 `permission` 并传递给 `setupWSConnection`：

```typescript
else if (shareId) {
    const password = url.searchParams.get('password') || undefined
    this.shareService
        .access({ shareId, password })
        .then((shareInfo) => {
            const readOnly = shareInfo.permission !== 'edit'
            setupWSConnection(connection, request, { docName, readOnly })
        })
        .catch(() => {
            connection.close(4001, 'Invalid share link')
        })
    return
}
```

#### 3.2 JWT 用户也检查协作者角色
JWT 用户连接时，检查该用户对该文档的协作者角色：

```typescript
if (token) {
    try {
        const payload = jwt.verify(token, secret)
        const user = await this.userService.findOne(payload.sub)
        // 检查是否为页面 owner
        const page = await this.pageRepository.findOne({ where: { pageId: docName.replace('doc-yjs-', '') } })
        if (page && page.user.id !== user.id) {
            const collab = await this.collaboratorRepository.findOne({
                where: { pageId: page.pageId, userId: user.id }
            })
            if (!collab) {
                connection.close(4003, 'No access')
                return
            }
            const readOnly = collab.role === 'viewer'
            setupWSConnection(connection, request, { docName, readOnly })
            return
        }
    } catch {
        connection.close(4001, 'Invalid token')
        return
    }
}
```

#### 3.3 setupWSConnection 支持 readOnly 模式
修改 `utils.ts` 中的 `setupWSConnection` 和 `messageListener`：

- 新增 `readOnly` 参数
- `readOnly=true` 时，`messageListener` 只处理 `SyncStep1` 响应和 `awareness` 消息，忽略 `update` 类型的同步消息
- 具体实现：在 `syncProtocol.readSyncMessage` 处理后，检查消息类型，如果是 `MessageType.sync2` 或 `MessageType.update` 且 readOnly=true，则跳过

---

### 任务 4：前端 — Doc 页面根据协作者角色控制编辑

**目标**：viewer 角色的协作者在 Doc 页面看到只读编辑器

**修改文件**：
- `apps/web/src/pages/Doc/index.tsx`
- `apps/web/src/pages/Doc/DocEditor.tsx`

**具体改动**：

#### 4.1 Doc 页面获取用户角色
在 `Doc/index.tsx` 中，获取页面信息后判断当前用户的角色：
- 如果是 owner → editable
- 如果是 collaborator with editor role → editable
- 如果是 collaborator with viewer role → readOnly

从 `fetchPageDetail` 返回的数据中获取 `role` 字段（任务 1 已添加）。

#### 4.2 DocEditor 传递 editable 属性
`DocEditor.tsx` 新增 `editable` prop，传递给 `LcwDocView`：

```tsx
interface DocEditorProps {
    pageId: string
    doc: Y.Doc
    provider: WebsocketProvider
    onEditorReady: (editor: any) => void
    editable?: boolean  // 新增
}

// 渲染时
<LcwDocView editor={editor} editable={editable} theme={isDark ? 'dark' : 'light'} />
```

#### 4.3 Doc 页面传递角色
```tsx
<DocEditor
    key={page?.id}
    pageId={page.pageId}
    doc={doc}
    provider={provider}
    onEditorReady={handleEditorReady}
    editable={page?.role !== 'viewer'}
/>
```

---

### 任务 5：前端 — 侧边栏和首页添加"与我共享"分区

**目标**：用户可以在侧边栏和首页看到共享给自己的文档

**修改文件**：
- `apps/web/src/services/page.ts` — 新增 `fetchSharedPages()` API
- `apps/web/src/components/LayoutAside/Aside.tsx` — 侧边栏添加"与我共享"分区
- `apps/web/src/pages/DocList/index.tsx` — 首页添加"与我共享"卡片区域

**具体改动**：

#### 5.1 新增 API 服务
```typescript
export const fetchSharedPages = async () => {
    return await request.get('/page/shared')
}
```

#### 5.2 侧边栏
在"所有文档"和"回收站"之间添加"与我共享"分区：
- 图标：`Share2` (lucide)
- 显示共享文档列表，每个文档标注角色（编辑者/查看者）和所有者名称
- 点击跳转到 `/doc/:pageId`

#### 5.3 首页
在"全部文档"下方添加"与我共享"区域：
- 卡片展示共享文档
- 每张卡片标注角色和所有者
- 点击跳转到文档编辑页

---

### 任务 6：前端 — 分享页面体验优化

**目标**：优化分享链接访问页面的用户体验

**修改文件**：
- `apps/web/src/pages/Share/index.tsx`
- `apps/web/src/pages/Share/ShareDocEditor.tsx`

**具体改动**：

#### 6.1 分享页面顶部信息栏
在 SharePage 中添加顶部信息栏，显示：
- 文档标题
- 当前权限标签（只读/可编辑）
- "登录以编辑"按钮（如果当前是匿名用户且权限为 view，引导登录）

#### 6.2 ShareDocEditor 访客标识
将 `user.name` 从硬编码 "Visitor" 改为更友好的标识，如 "访客" + 随机颜色

---

### 任务 7：MCP 浏览器验证

**目标**：通过 MCP Chrome DevTools 验证所有功能正常工作

**验证项**：
1. 用户 A 分享文档给用户 B（通过协作者面板）
2. 用户 B 在侧边栏和首页看到"与我共享"文档
3. 用户 B 点击共享文档，能正常打开和编辑（editor 角色）
4. 用户 B 作为 viewer 角色打开文档，编辑器为只读
5. 分享链接 view 权限，通过 WebSocket 无法修改文档
6. 分享链接 edit 权限，可以正常编辑
7. 密码保护和过期时间功能正常

---

## 实施顺序

```
任务 1 (PageService 协作者访问)
  ↓
任务 2 (与我共享 API) + 任务 3 (WebSocket 权限)
  ↓
任务 4 (Doc 页面权限控制) + 任务 5 (侧边栏/首页共享分区)
  ↓
任务 6 (分享页面体验优化)
  ↓
任务 7 (MCP 验证)
```

任务 1 是基础，必须先完成。任务 2 和 3 可以并行。任务 4 和 5 依赖任务 1-2，可以并行。任务 6 独立优化。任务 7 最后验证。
