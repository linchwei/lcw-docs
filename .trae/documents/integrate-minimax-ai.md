# MiniMax API 集成计划 — 让 AI 具备真正的功能

## 概述

将当前基于 Dify 的 AI 功能替换为 MiniMax API，使 AI 聊天和选区 AI 功能真正可用。

MiniMax API 兼容 OpenAI 格式，端点：`https://api.minimaxi.com/v1/text/chatcompletion_v2`

## 核心变更对比

| 项目 | Dify (当前) | MiniMax (目标) |
|------|------------|----------------|
| 端点 | `https://api.dify.ai/v1/chat-messages` | `https://api.minimaxi.com/v1/text/chatcompletion_v2` |
| 环境变量 | `DIFY_API_KEY` | `MINIMAX_API_KEY` |
| 请求格式 | `{ inputs, query, response_mode, user }` | `{ model, messages, stream }` |
| 流式内容字段 | `data.answer` | `choices[0].delta.content` |
| 会话追踪 | `data.conversation_id` (Dify 内置) | 前端自行维护 messages 历史 |
| 流式终止 | 无明确终止符 | `data: [DONE]` |
| 系统提示 | `inputs.document_context` | `messages[0].role = "system"` |

## 实施步骤

### 步骤 1：修改后端 `ai.service.ts`

**文件**: `apps/server/src/modules/ai/ai.service.ts`

- 将 `DIFY_API_KEY` 改为 `MINIMAX_API_KEY`
- 重写 `chatStream` 方法，使用 MiniMax 的 OpenAI 兼容格式：
  - 接收参数改为 `messages: Array<{role: string, content: string}>`
  - 构建请求体：`{ model: "MiniMax-M1", messages, stream: true }`
  - 请求头：`Authorization: Bearer {MINIMAX_API_KEY}`
  - 端点：`https://api.minimaxi.com/v1/text/chatcompletion_v2`
- 添加系统提示词，当有文档上下文时自动注入 system message

```typescript
async chatStream(messages: Array<{role: string, content: string}>) {
    const apiKey = this.configService.get<string>('MINIMAX_API_KEY')
    if (!apiKey) throw new Error('MINIMAX_API_KEY is not configured')

    const response = await fetch('https://api.minimaxi.com/v1/text/chatcompletion_v2', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'MiniMax-M1',
            messages,
            stream: true,
        }),
    })
    return response
}
```

### 步骤 2：修改后端 `ai.controller.ts`

**文件**: `apps/server/src/modules/ai/ai.controller.ts`

- 更新请求体接口：接收 `messages` 数组（包含完整的对话历史 + 系统提示）
- 保留流式转发逻辑不变（MiniMax 的 SSE 格式直接透传给前端）
- 更新错误处理以适配 MiniMax 的响应格式

```typescript
@Post('chat')
async chat(
    @Body() body: { messages: Array<{role: string, content: string}> },
    @Res() res: Response
) {
    const upstream = await this.aiService.chatStream(body.messages)
    // ... 流式转发逻辑保持不变
}
```

### 步骤 3：修改前端 `services/ai.ts`

**文件**: `apps/web/src/services/ai.ts`

- 将请求体从 `{ query, conversation_id, context }` 改为 `{ messages }`
- `messages` 由前端组件构建，包含 system prompt + 对话历史

```typescript
export async function chatWithAI(
    messages: Array<{role: string, content: string}>,
    signal?: AbortSignal
): Promise<Response> {
    const token = localStorage.getItem('token')
    const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { token } : {}),
        },
        body: JSON.stringify({ messages }),
        ...(signal ? { signal } : {}),
    })
    return response
}
```

### 步骤 4：修改前端 `BasicAIChatPanel.tsx`

**文件**: `apps/web/src/components/BasicAIChat/BasicAIChatPanel.tsx`

- **移除** `conversationId` 状态，改为维护 `messages` 对话历史数组
- **构建 messages**：每次发送时组装 `[systemPrompt, ...history, userMessage]`
- **更新流式解析器**：
  - `data.answer` → `choices[0].delta.content`
  - 处理 `data: [DONE]` 终止信号
  - 忽略 `choices[0].delta.content` 为 undefined 的情况（role-only chunks）
- **流式完成后**：将 assistant 回复追加到 messages 历史中

关键解析逻辑变更：
```typescript
// 旧 (Dify)
if (data.answer) {
    accumulated += data.answer
    setStreamContent(accumulated)
}
if (data.conversation_id) {
    setConversationId(data.conversation_id)
}

// 新 (MiniMax/OpenAI)
if (data.choices?.[0]?.delta?.content) {
    accumulated += data.choices[0].delta.content
    setStreamContent(accumulated)
}
// data: [DONE] 表示流结束
```

### 步骤 5：修改前端 `SelectionAIMenu/index.tsx`

**文件**: `apps/web/src/components/SelectionAIMenu/index.tsx`

- 更新流式解析器：`data.answer` → `choices[0].delta.content`
- 构建 messages 数组：`[{ role: "system", content: "你是文档编辑助手" }, { role: "user", content: prompt }]`
- 处理 `data: [DONE]` 终止信号

### 步骤 6：配置环境变量

- 在启动服务器时设置环境变量 `MINIMAX_API_KEY`
- 更新相关文档/配置说明

## 系统提示词设计

为 AI 聊天设计合理的系统提示词：

```
你是一个专业的文档编辑助手。你可以帮助用户撰写、改写、翻译和总结文档内容。
请用中文回复，保持专业和友好的语气。
当用户提供文档上下文时，请基于上下文内容进行回答。
```

当选区 AI 功能触发时，使用更具体的提示词（续写/改写/翻译/总结），这些已在 `aiActions` 数组中定义。

## 文件变更清单

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `apps/server/src/modules/ai/ai.service.ts` | 重写 | Dify → MiniMax API |
| `apps/server/src/modules/ai/ai.controller.ts` | 修改 | 请求体接口 + 流式转发 |
| `apps/web/src/services/ai.ts` | 重写 | messages 数组替代 query/conversation_id |
| `apps/web/src/components/BasicAIChat/BasicAIChatPanel.tsx` | 修改 | SSE 解析 + 对话历史管理 |
| `apps/web/src/components/SelectionAIMenu/index.tsx` | 修改 | SSE 解析 + messages 构建 |

## 测试计划

完成所有代码修改后，使用 MCP 浏览器工具进行真实功能测试：

1. **AI 聊天测试**：打开文档 → 点击 AI 聊天 → 输入问题 → 验证流式回复正常显示
2. **多轮对话测试**：连续发送多条消息 → 验证 AI 记住上下文
3. **选区 AI 测试**：选中文本 → 点击续写/改写/翻译/总结 → 验证结果插入文档
4. **文档上下文测试**：在有内容的文档中使用 AI → 验证 AI 能感知文档内容
5. **错误处理测试**：验证 API key 缺失时的错误提示
