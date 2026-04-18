# 继续增强功能 - 实施计划

## 当前状态

已完成：文档保存修复、输入规则补全、分享WS鉴权、文档导出、暗色模式、收藏/回收站/评论等。

## 下一批功能（按优先级排序）

### 第一批：安全加固（P0，PRD F-0201 剩余项）

| 编号 | 功能 | 修改文件 | 说明 |
|------|------|----------|------|
| S1 | JWT_SECRET 移除硬编码 fallback | `doc-yjs.gateway.ts`, `constants.ts` | 改为从 ConfigService 读取，无 fallback |
| S2 | Upload 端点添加 JWT 鉴权 | `upload.controller.ts` | 添加 `@UseGuards(AuthGuard('jwt'))` |
| S3 | AI 端点添加 JWT 鉴权 | `ai.controller.ts` | 添加 `@UseGuards(AuthGuard('jwt'))` |
| S4 | AI API Key 移除硬编码 | `ai.service.ts` | 改为从 ConfigService 读取，无 fallback |

### 第二批：编辑器体验增强

| 编号 | 功能 | 修改文件 | 说明 |
|------|------|----------|------|
| E1 | Yjs 协作模式 UndoManager | `DocEditor.tsx`, `packages/core` | 配置 Yjs UndoManager + trackedOrigins，使撤销/重做在协作模式下正常工作 |
| E2 | 文档内容同步状态指示 | `Doc/index.tsx` | 监听 WebsocketProvider 的 sync 状态，显示"同步中..."/"已同步" |
| E3 | 移动端响应式适配 | `Doc/index.tsx`, `DocOutline.tsx` | 编辑器区域响应式 padding，outline 在移动端隐藏 |

### 第三批：AI 增强（PRD F-0501 部分）

| 编号 | 功能 | 修改文件 | 说明 |
|------|------|----------|------|
| A1 | AI 请求携带文档上下文 | `ai.service.ts`, `BasicAIChatPanel.tsx` | 将当前文档内容作为 context 传给 Dify |
| A2 | 选区 AI 浮动菜单 | 新建 `SelectionAIMenu` 组件 | 选中文本后弹出 AI 操作菜单：续写、改写、翻译、总结 |

### 第四批：运维与基础设施

| 编号 | 功能 | 修改文件 | 说明 |
|------|------|----------|------|
| O1 | 健康检查端点 | 新建 `HealthModule` | `/api/health` 返回服务状态和数据库连接状态 |

## 实施步骤

### Step 1: 安全加固（4 个小改动，可并行）
1. 修改 `doc-yjs.gateway.ts`：将 `process.env.JWT_SECRET || 'secretKey'` 改为注入 ConfigService
2. 删除 `constants.ts`（已废弃的死代码，JWT secret 已通过 ConfigService 管理）
3. 修改 `upload.controller.ts`：添加 `@UseGuards(AuthGuard('jwt'))`
4. 修改 `ai.controller.ts`：添加 `@UseGuards(AuthGuard('jwt'))`
5. 修改 `ai.service.ts`：将 Dify API key 改为从 ConfigService 读取

### Step 2: 编辑器体验增强
1. 在 DocEditor 中配置 Yjs UndoManager，设置 trackedOrigins 使撤销/重做仅作用于本地操作
2. 在 Doc/index.tsx 中监听 WebsocketProvider 的 sync 事件，添加同步状态指示器
3. 修改编辑器区域和 outline 的响应式样式

### Step 3: AI 增强
1. 修改 AI 服务，接收前端传来的文档内容作为上下文
2. 修改 BasicAIChatPanel，在发送请求时附带当前文档内容
3. 创建 SelectionAIMenu 组件，监听编辑器选区变化，在选中文本时显示浮动菜单

### Step 4: 健康检查端点
1. 创建 HealthModule + HealthController
2. 实现 `/api/health` 端点，检查数据库连接

### Step 5: MCP 端到端测试
1. 测试安全加固：未登录用户无法上传文件、无法调用 AI
2. 测试撤销/重做在协作模式下正常工作
3. 测试同步状态指示器
4. 测试移动端响应式
5. 测试 AI 上下文感知
6. 测试选区 AI 菜单
7. 测试健康检查端点

## 不在本批范围内（延后）
- 版本历史（F-0303）：复杂度高，需要新建 entity/service/UI，单独规划
- i18n（F-1003）：工作量大（需提取所有 UI 字符串），延后
- 文档拖拽排序：需要引入 DnD 库，延后
- 行内评论锚定高亮：需要编辑器扩展支持，延后
- AI 对话历史持久化：需要新建数据模型，延后
