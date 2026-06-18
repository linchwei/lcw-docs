/**
 * AI 服务（扩展版）
 *
 * 在原有 chatWithAI 基础上，新增 LangGraph Agent 端点的调用函数。
 * 同时新增结构化上下文类型定义和 SSE 事件解析工具。
 *
 * 新增功能：
 * - chatWithAgent(): 通用对话（带文档工具的 Agent）
 * - generateSummary(): 文档摘要
 * - generateOutline(): 大纲生成
 * - rewriteContent(): 文档改写
 * - resumeAgent(): 恢复中断的 Agent
 * - parseSSEEvent(): 统一解析 SSE 事件
 * - extractStructuredContextFromEditor(): 从编辑器提取结构化上下文
 *
 * @module services/ai
 */

// ============================================================
// 基础类型定义
// ============================================================

/** 对话消息 */
export interface ChatMessage {
    role: 'system' | 'user' | 'assistant'
    content: string
}

/** 对话选项（旧接口，保留向后兼容） */
export interface ChatOptions {
    context?: string
    systemPrompt?: string
}

// ============================================================
// 结构化上下文类型
// ============================================================

/**
 * 文档结构化上下文
 *
 * 前端从编辑器提取的文档结构信息，传给后端 Agent 使用。
 * 替代原有的全文拼接方式，采用分层策略减少 Token 消耗。
 *
 * 数据来源：前端从编辑器实时提取
 */
export interface StructuredContext {
    /** 文档大纲：标题层级和 blockId 映射 */
    outline: Array<{
        level: number
        text: string
        blockId: string
    }>
    /** 文档所有 block 的扁平列表 */
    blocks: Array<{
        id: string
        type: string
        content: string
        level?: number
    }>
    /** 用户选区信息（可选） */
    selection?: {
        /** 选中的文本 */
        text: string
        /** 选区所在 blockId */
        blockId: string
        /** 选区前文（前 2 个 block） */
        before: string
        /** 选区后文（后 2 个 block） */
        after: string
    }
}

// ============================================================
// SSE 事件类型
// ============================================================

/** SSE 事件类型枚举，与后端 sse-formatter.ts 保持一致 */
export type SSEEventType = 'content' | 'agent_status' | 'tool_call' | 'interrupt' | 'diff' | 'done'

/** Agent 状态事件的步骤状态 */
export type AgentStepStatus = 'running' | 'completed' | 'error'

/** 解析后的 SSE 事件 */
export interface ParsedSSEEvent {
    /** 事件类型 */
    type: SSEEventType
    /** 事件数据 */
    data: Record<string, any>
}

/** 中断事件数据 */
export interface InterruptEventData {
    /** 中断的步骤名称 */
    step: string
    /** 对话线程 ID，用于恢复执行 */
    threadId: string
    /** 大纲数据（outline 中断时） */
    outline?: Array<{ title: string; description: string }>
    /** 改写数据（rewrite 中断时） */
    rewrittenContent?: string
    /** Diff 数据 */
    diff?: { oldContent: string; newContent: string }
}

/** Diff 事件数据 */
export interface DiffEventData {
    /** 被修改的 block ID */
    blockId: string
    /** 原始内容 */
    oldContent: string
    /** 新内容 */
    newContent: string
}

// ============================================================
// 通用请求辅助
// ============================================================

/** 获取认证 headers */
function getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('token')
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
}

// ============================================================
// 旧接口（向后兼容）
// ============================================================

/**
 * 通用对话（旧接口，直接透传到 DeepSeek API）
 *
 * 保留此函数确保现有组件无需修改即可工作。
 * 新组件建议使用 chatWithAgent() 替代。
 *
 * @param messages - 对话消息列表
 * @param signal - AbortSignal，用于取消请求
 * @param options - 对话选项（上下文、系统提示词）
 * @returns Response 对象，需手动解析 SSE 流
 */
export async function chatWithAI(messages: ChatMessage[], signal?: AbortSignal, options?: ChatOptions): Promise<Response> {
    const finalMessages = [...messages]

    if (options?.systemPrompt) {
        const systemIdx = finalMessages.findIndex(m => m.role === 'system')
        if (systemIdx >= 0) {
            finalMessages[systemIdx] = { ...finalMessages[systemIdx], content: options.systemPrompt }
        } else {
            finalMessages.unshift({ role: 'system', content: options.systemPrompt })
        }
    }

    if (options?.context) {
        const systemIdx = finalMessages.findIndex(m => m.role === 'system')
        if (systemIdx >= 0) {
            finalMessages[systemIdx] = {
                ...finalMessages[systemIdx],
                content: finalMessages[systemIdx].content + '\n\n当前文档内容：\n' + options.context,
            }
        } else {
            finalMessages.unshift({ role: 'system', content: '当前文档内容：\n' + options.context })
        }
    }

    const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ messages: finalMessages }),
        ...(signal ? { signal } : {}),
    })

    return response
}

// ============================================================
// 新接口（LangGraph Agent）
// ============================================================

/**
 * 通用对话（带文档工具的 Agent）
 *
 * 使用 LangGraph createReactAgent 处理对话，
 * Agent 可调用文档读写工具，支持流式输出。
 *
 * @param messages - 对话消息列表
 * @param context - 文档结构化上下文（可选）
 * @param threadId - 对话线程 ID（可选，用于持久化）
 * @param signal - AbortSignal
 * @returns Response 对象
 */
export async function chatWithAgent(
    messages: ChatMessage[],
    context?: StructuredContext,
    threadId?: string,
    signal?: AbortSignal
): Promise<Response> {
    return fetch('/api/ai/chat', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ messages, context, threadId }),
        ...(signal ? { signal } : {}),
    })
}

/**
 * 文档摘要
 *
 * 使用摘要 Agent 处理：分块 → 逐块摘要 → 合并 → 精炼
 *
 * @param documentContent - 文档全文内容
 * @param threadId - 对话线程 ID（可选）
 * @param signal - AbortSignal
 * @returns Response 对象
 */
export async function generateSummary(documentContent: string, threadId?: string, signal?: AbortSignal): Promise<Response> {
    return fetch('/api/ai/summary', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ documentContent, threadId }),
        ...(signal ? { signal } : {}),
    })
}

/**
 * 大纲生成
 *
 * 使用大纲 Agent 处理：生成大纲 → 中断等待审批 → 逐节展开
 * 返回的 SSE 流中包含 interrupt 事件，前端需展示大纲编辑界面。
 *
 * @param topic - 文档主题
 * @param requirements - 额外要求（可选）
 * @param threadId - 对话线程 ID（可选）
 * @param signal - AbortSignal
 * @returns Response 对象
 */
export async function generateOutline(topic: string, requirements?: string, threadId?: string, signal?: AbortSignal): Promise<Response> {
    return fetch('/api/ai/outline', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ topic, requirements, threadId }),
        ...(signal ? { signal } : {}),
    })
}

/**
 * 文档改写
 *
 * 使用改写 Agent 处理：生成改写 → Diff → 中断等待审批
 * 返回的 SSE 流中包含 interrupt 事件，前端需展示 Diff 预览界面。
 *
 * @param selectedContent - 选中的文本内容
 * @param instruction - 改写指令
 * @param context - 上下文信息（可选）
 * @param threadId - 对话线程 ID（可选）
 * @param signal - AbortSignal
 * @returns Response 对象
 */
export async function rewriteContent(
    selectedContent: string,
    instruction: string,
    context?: string,
    threadId?: string,
    signal?: AbortSignal
): Promise<Response> {
    return fetch('/api/ai/rewrite', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ selectedContent, instruction, context, threadId }),
        ...(signal ? { signal } : {}),
    })
}

/**
 * 恢复中断的 Agent
 *
 * Human-in-the-Loop 机制：用户审批后，调用此函数恢复 Agent 执行。
 *
 * @param threadId - 对话线程 ID
 * @param approved - 是否批准
 * @param feedback - 用户反馈（可选）
 * @param signal - AbortSignal
 * @returns Response 对象
 */
export async function resumeAgent(threadId: string, approved: boolean, feedback?: string, signal?: AbortSignal): Promise<Response> {
    return fetch('/api/ai/resume', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ threadId, approved, feedback }),
        ...(signal ? { signal } : {}),
    })
}

// ============================================================
// 知识库 API
// ============================================================

/**
 * 知识库问答（SSE 流式）
 *
 * 基于 RAG 索引的深度问答，支持当前文档和跨文档搜索。
 *
 * @param messages - 对话消息列表
 * @param pageId - 当前文档 ID
 * @param threadId - 对话线程 ID（可选）
 * @param signal - AbortSignal
 * @param context - 文档结构化上下文（可选）
 * @param scope - 搜索范围：'current'=当前文档, 'all'=全部文档
 * @returns Response 对象
 */
export async function chatWithKnowledge(
    messages: ChatMessage[],
    pageId: string,
    threadId?: string,
    signal?: AbortSignal,
    context?: StructuredContext,
    scope: 'current' | 'all' = 'current'
): Promise<Response> {
    return fetch('/api/ai/knowledge/chat', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ messages, pageId, threadId, context, scope }),
        ...(signal ? { signal } : {}),
    })
}

/**
 * 获取文档索引状态
 *
 * @param pageId - 文档 ID
 * @returns 索引状态信息
 */
export async function getKnowledgeStatus(pageId: string): Promise<{
    isIndexed: boolean
    totalChunks: number
    embeddedChunks: number
    unembeddedChunks: number
    lastIndexedAt: string | null
}> {
    const res = await fetch(`/api/ai/knowledge/status/${pageId}`, { headers: getAuthHeaders(), cache: 'no-store' })
    return res.json()
}

/**
 * 触发文档索引
 *
 * @param pageId - 文档 ID
 * @param blocks - 文档 block 列表
 * @returns 索引结果
 */
export async function indexForKnowledge(
    pageId: string,
    blocks: Array<{ id: string; type: string; content: string; level?: number }>
): Promise<{ success: boolean }> {
    const res = await fetch('/api/ai/knowledge/index', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ pageId, blocks }),
    })
    return res.json()
}

/**
 * 自动标签生成
 *
 * AI 分析文档内容，生成标签建议和分类推荐。
 *
 * @param pageId - 文档 ID
 * @param context - 文档结构化上下文（可选）
 * @returns 标签建议结果
 */
export async function autoTag(
    pageId: string,
    context?: StructuredContext
): Promise<{
    tags: Array<{ name: string; color: string; confidence: number }>
    suggestedFolder: string
    summary: string
}> {
    const res = await fetch('/api/ai/knowledge/auto-tag', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ pageId, context }),
    })
    return res.json()
}

/**
 * 知识图谱生成
 *
 * @param pageId - 文档 ID
 * @param context - 文档结构化上下文（可选）
 * @returns 知识图谱数据
 */
export async function generateKnowledgeGraph(
    pageId: string,
    context?: StructuredContext
): Promise<{
    entities: Array<{ id: string; name: string; type: string }>
    relations: Array<{ source: string; target: string; label: string; type: string }>
    mermaid: string
}> {
    const res = await fetch('/api/ai/knowledge/graph', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ pageId, context }),
    })
    return res.json()
}

/**
 * 保存知识卡片
 *
 * 将问答结果保存为新文档。
 *
 * @param params - 保存参数
 * @returns 新创建的页面 ID
 */
export async function saveKnowledgeCard(params: {
    title: string
    content: string
    sourcePageId: string
    folderId?: string
    tags?: string[]
}): Promise<{ pageId: string }> {
    const res = await fetch('/api/ai/knowledge/save-card', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(params),
    })
    return res.json()
}

/**
 * 智能摘要生成
 *
 * AI 生成文档的结构化摘要，包含关键要点、核心结论和建议行动。
 *
 * @param pageId - 文档 ID
 * @param context - 文档结构化上下文（可选）
 * @returns 智能摘要结果
 */
export async function smartSummary(
    pageId: string,
    context?: StructuredContext
): Promise<{
    keyPoints: string[]
    coreConclusion: string
    suggestedActions: string[]
    readingTime: string
}> {
    const res = await fetch('/api/ai/knowledge/smart-summary', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ pageId, context }),
    })
    return res.json()
}

/**
 * 学习路径推荐
 *
 * AI 基于当前文档推荐相关文档的阅读顺序。
 *
 * @param pageId - 文档 ID
 * @param context - 文档结构化上下文（可选）
 * @returns 学习路径
 */
export async function generateLearningPath(
    pageId: string,
    context?: StructuredContext
): Promise<{
    path: Array<{ pageId: string; title: string; reason: string; order: number }>
}> {
    const res = await fetch('/api/ai/knowledge/learning-path', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ pageId, context }),
    })
    return res.json()
}

/**
 * 获取关联文档
 *
 * 发现与当前文档语义相关的其他文档。
 *
 * @param pageId - 文档 ID
 * @param topK - 返回数量上限（默认 5）
 * @returns 关联文档列表
 */
export async function getRelatedDocuments(
    pageId: string,
    topK: number = 5
): Promise<Array<{ pageId: string; score: number; matchedContent: string }>> {
    const res = await fetch(`/api/ai/knowledge/related/${pageId}?topK=${topK}`, {
        headers: getAuthHeaders(),
    })
    return res.json()
}

/**
 * 知识库全局搜索
 *
 * 跨所有已索引文档的语义搜索。
 *
 * @param query - 搜索查询
 * @param topK - 返回数量上限（默认 10）
 * @param minScore - 最低相似度（默认 0.5）
 * @returns 搜索结果列表
 */
export async function knowledgeGlobalSearch(
    query: string,
    topK: number = 10,
    minScore: number = 0.5
): Promise<Array<{ pageId: string; blockId: string; content: string; score: number }>> {
    const res = await fetch('/api/ai/knowledge/global-search', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ query, topK, minScore }),
    })
    return res.json()
}

/**
 * 创建知识收藏
 *
 * @param params - 收藏参数
 * @returns 创建的收藏对象
 */
export async function createBookmark(params: {
    sourcePageId: string
    sourceBlockId?: string
    title: string
    content: string
    question?: string
    threadId?: string
}): Promise<any> {
    const res = await fetch('/api/ai/knowledge/bookmark', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(params),
    })
    return res.json()
}

/**
 * 获取收藏列表
 *
 * @param page - 页码（默认 1）
 * @param pageSize - 每页数量（默认 20）
 * @returns 分页收藏列表
 */
export async function listBookmarks(page: number = 1, pageSize: number = 20): Promise<{ items: any[]; total: number }> {
    const res = await fetch(`/api/ai/knowledge/bookmarks?page=${page}&pageSize=${pageSize}`, {
        headers: getAuthHeaders(),
    })
    return res.json()
}

/**
 * 删除收藏
 *
 * @param bookmarkId - 收藏 ID
 * @returns 删除结果
 */
export async function deleteBookmark(bookmarkId: number): Promise<{ success: boolean }> {
    const res = await fetch(`/api/ai/knowledge/bookmark/${bookmarkId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    })
    return res.json()
}

/**
 * 搜索收藏
 *
 * @param query - 搜索关键词
 * @returns 匹配的收藏列表
 */
export async function searchBookmarks(query: string): Promise<any[]> {
    const res = await fetch('/api/ai/knowledge/bookmark/search', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ query }),
    })
    return res.json()
}

/**
 * 获取对话历史线程列表
 *
 * @param page - 页码（默认 1）
 * @param pageSize - 每页数量（默认 20）
 * @returns 分页线程列表
 */
export async function listKnowledgeThreads(page: number = 1, pageSize: number = 20): Promise<{ items: any[]; total: number }> {
    const res = await fetch(`/api/ai/knowledge/threads?page=${page}&pageSize=${pageSize}`, {
        headers: getAuthHeaders(),
    })
    return res.json()
}

/**
 * 删除对话线程
 *
 * @param threadId - 线程 ID
 * @returns 删除结果
 */
export async function deleteKnowledgeThread(threadId: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/ai/knowledge/thread/${threadId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    })
    return res.json()
}

/**
 * 清除文档索引
 *
 * 删除指定文档的所有分块和向量数据。
 *
 * @param pageId - 文档页面 ID
 * @returns 操作结果
 */
export async function clearKnowledgeIndex(pageId: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/ai/knowledge/index/${pageId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    })
    if (!res.ok) {
        const error = await res.json().catch(() => ({ message: '清除索引失败' }))
        throw new Error(error.message || `HTTP ${res.status}`)
    }
    return res.json()
}

// ============================================================
// SSE 解析工具
// ============================================================

/**
 * 解析单行 SSE 数据
 *
 * 统一处理两种 SSE 格式：
 * 1. 标准格式：`event: <type>\ndata: <json>\n\n`
 * 2. 兼容格式（content 类型）：`data: <json>\n\n`（DeepSeek 原始格式）
 *
 * @param eventLine - event 行内容（如 "content"），可选
 * @param dataLine - data 行内容（JSON 字符串或 "[DONE]"）
 * @returns 解析后的事件对象，解析失败返回 null
 */
export function parseSSEEvent(eventLine: string | undefined, dataLine: string): ParsedSSEEvent | null {
    const dataStr = dataLine.trim()
    if (dataStr === '[DONE]') {
        return { type: 'done', data: {} }
    }

    try {
        const data = JSON.parse(dataStr)

        // 如果有 event 行，直接使用事件类型
        if (eventLine) {
            return { type: eventLine as SSEEventType, data }
        }

        // 没有 event 行，按旧格式解析（DeepSeek 兼容）
        // 旧格式：data: {"choices":[{"delta":{"content":"..."}}]}
        const content = data.choices?.[0]?.delta?.content
        if (content !== undefined) {
            return { type: 'content', data: { content } }
        }

        // 错误响应
        if (data.error) {
            return { type: 'content', data: { content: `[错误] ${data.error}` } }
        }

        return null
    } catch {
        return null
    }
}

/**
 * 从 ReadableStream 读取并解析 SSE 事件
 *
 * 封装了 SSE 流的读取、缓冲、分割和解析逻辑。
 * 每次解析出一个完整事件时调用 onEvent 回调。
 *
 * @param reader - ReadableStreamDefaultReader
 * @param onEvent - 事件回调函数
 * @returns Promise<void>，流读取完毕时 resolve
 */
export async function readSSEStream(
    reader: ReadableStreamDefaultReader<Uint8Array>,
    onEvent: (event: ParsedSSEEvent) => void
): Promise<void> {
    const decoder = new TextDecoder()
    let buffer = ''
    let currentEvent: string | undefined

    while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
            // 解析 event 行
            if (line.startsWith('event: ')) {
                currentEvent = line.slice(7).trim()
                continue
            }

            // 解析 data 行
            if (line.startsWith('data: ')) {
                const dataStr = line.slice(6)
                const event = parseSSEEvent(currentEvent, dataStr)
                if (event) {
                    onEvent(event)
                }
                currentEvent = undefined
                continue
            }

            // 空行表示事件结束，重置 currentEvent
            if (line.trim() === '') {
                currentEvent = undefined
            }
        }
    }
}

// ============================================================
// 编辑器上下文提取
// ============================================================

/**
 * 从编辑器提取结构化上下文
 *
 * 将编辑器的文档 Block 列表转换为 StructuredContext 格式，
 * 供 LangGraph Agent 的文档工具使用。
 *
 * 提取策略：
 * 1. 遍历所有 block，提取标题（heading）作为大纲
 * 2. 将所有 block 转为扁平列表
 * 3. 如果有选区，提取选区文本及上下文
 *
 * @param blocks - 编辑器的文档 Block 列表
 * @param selection - 当前选区信息（可选）
 * @returns StructuredContext 结构化上下文
 */
export function extractStructuredContextFromEditor(
    blocks: Array<{ id: string; type: string; content: any; props?: Record<string, any> }>,
    selection?: { text: string; blockId: string }
): StructuredContext {
    const outline: StructuredContext['outline'] = []
    const flatBlocks: StructuredContext['blocks'] = []

    for (const block of blocks) {
        // 提取标题作为大纲
        if (block.type === 'heading' && block.props?.level) {
            const text = extractTextFromBlockContent(block.content)
            outline.push({
                level: block.props.level as number,
                text,
                blockId: block.id,
            })
        }

        // 将所有 block 转为扁平列表
        flatBlocks.push({
            id: block.id,
            type: block.type,
            content: extractTextFromBlockContent(block.content),
            ...(block.props?.level ? { level: block.props.level as number } : {}),
        })
    }

    // 提取选区上下文
    let selectionContext: StructuredContext['selection']
    if (selection) {
        const blockIdx = flatBlocks.findIndex(b => b.id === selection.blockId)
        const before = flatBlocks
            .slice(Math.max(0, blockIdx - 2), blockIdx)
            .map(b => b.content)
            .join('\n')
        const after = flatBlocks
            .slice(blockIdx + 1, blockIdx + 3)
            .map(b => b.content)
            .join('\n')

        selectionContext = {
            text: selection.text,
            blockId: selection.blockId,
            before,
            after,
        }
    }

    return {
        outline,
        blocks: flatBlocks,
        ...(selectionContext ? { selection: selectionContext } : {}),
    }
}

/**
 * 从 block content 中提取纯文本
 *
 * block.content 可能是字符串或 InlineContent 数组，
 * 此函数统一提取纯文本内容。
 *
 * @param content - block 的 content 字段
 * @returns 纯文本字符串
 */
function extractTextFromBlockContent(content: any): string {
    if (typeof content === 'string') return content
    if (Array.isArray(content)) {
        return content
            .map((item: any) => {
                if (typeof item === 'string') return item
                if (item?.text) return item.text
                if (item?.content) return extractTextFromBlockContent(item.content)
                return ''
            })
            .join('')
    }
    return ''
}
