/**
 * AI 服务（重构版）
 *
 * 从"DeepSeek API 透传"重构为"LangGraph Agent 编排服务"。
 *
 * 核心变化：
 * - 使用 LlmFactory 创建模型，支持多提供商（DeepSeek / OpenAI）
 * - 使用 LangGraph Agent 处理请求，支持工具调用
 * - 使用 PostgresCheckpointer 持久化对话状态
 * - 使用 SSE 格式转换层统一输出格式
 * - 保留 legacyChatStream() 作为降级方案
 *
 * 方法列表：
 * - chatStream(): 通用对话（带文档工具的 Agent）
 * - summaryStream(): 文档摘要（分块 → 摘要 → 合并 → 精炼）
 * - outlineStream(): 大纲生成（生成 → 审批 → 展开）
 * - rewriteStream(): 文档改写（改写 → Diff → 审批）
 * - resumeAgent(): 恢复中断的 Agent
 * - legacyChatStream(): 向后兼容的 DeepSeek API 透传
 *
 * @module ai/service
 */
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { PostgresCheckpointerService } from './checkpointer/postgres.checkpointer'
import { HumanMessage, AIMessage, SystemMessage, BaseMessage } from '@langchain/core/messages'
import { formatStructuredContext, StructuredContext } from './context/structured-context'
import { createChatGraph } from './graphs/chat.graph'
import { createOutlineGraph } from './graphs/outline.graph'
import { createRewriteGraph } from './graphs/rewrite.graph'
import { createSummaryGraph } from './graphs/summary.graph'
import { LlmFactory } from './llm/llm.factory'
import {
    formatAgentStatusEvent,
    formatContentEvent,
    formatDoneEvent,
    formatInterruptEvent,
    formatToolCallEvent,
} from './sse/sse-formatter'
import { ChatDto, ChatMessage, OutlineDto, ResumeDto, RewriteDto, SummaryDto } from './ai.dto'

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name)

    constructor(
        private readonly configService: ConfigService,
        private readonly llmFactory: LlmFactory,
        private readonly checkpointerService: PostgresCheckpointerService,
    ) {}

    /**
     * 通用对话（带文档工具的 Agent）
     *
     * 使用 createReactAgent 处理对话，
     * Agent 可调用文档读写工具。
     * 流式输出通过 SSE 格式转换层统一格式。
     *
     * @param dto - 对话请求参数
     * @returns AsyncGenerator，每次 yield 一段 SSE 格式的文本
     */
    async *chatStream(dto: ChatDto): AsyncGenerator<string> {
        // 构建 configurable，包含文档上下文和线程 ID
        // PostgresSaver 要求 thread_id 不能为 null，未提供时自动生成
        const configurable: Record<string, any> = {
            thread_id: dto.threadId || `thread-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        }
        if (dto.context) {
            configurable.context = dto.context
        }

        // 注入结构化上下文到 system message
        const messages = [...dto.messages]
        if (dto.context) {
            const contextText = formatStructuredContext(dto.context as StructuredContext)
            const systemIdx = messages.findIndex(m => m.role === 'system')
            if (systemIdx >= 0) {
                messages[systemIdx] = {
                    ...messages[systemIdx],
                    content: messages[systemIdx].content + '\n\n' + contextText,
                }
            } else {
                messages.unshift({ role: 'system', content: contextText })
            }
        }

        try {
            const checkpointer = this.checkpointerService.getCheckpointer()
            const graph = createChatGraph(this.llmFactory, checkpointer)

            // 将 ChatMessage[] 转换为 BaseMessage[]（LangGraph 要求的类型）
            // ChatMessage 使用 role 字段，LangChain 使用 type 字段，需要手动映射
            const baseMessages: BaseMessage[] = messages.map(m => {
                switch (m.role) {
                    case 'system': return new SystemMessage(m.content)
                    case 'assistant': return new AIMessage(m.content)
                    default: return new HumanMessage(m.content)
                }
            })

            // 使用 streamEvents 获取流式输出
            const stream = graph.streamEvents(
                { messages: baseMessages },
                { configurable, version: 'v2' },
            )

            for await (const event of stream) {
                // 处理 LLM 输出事件：文本内容流
                if (event.event === 'on_chat_model_stream') {
                    const chunk = event.data?.chunk
                    if (chunk?.content && typeof chunk.content === 'string') {
                        yield formatContentEvent(chunk.content)
                    }
                }

                // 处理工具调用开始事件
                if (event.event === 'on_tool_start') {
                    yield formatAgentStatusEvent(event.name, 'running')
                }

                // 处理工具调用结束事件
                if (event.event === 'on_tool_end') {
                    const toolResult = event.data?.output
                    yield formatToolCallEvent(event.name, event.data?.input ?? {}, String(toolResult))

                    // 如果工具返回的是写入操作指令，解析并推送 diff 事件
                    try {
                        const parsed = JSON.parse(String(toolResult))
                        if (parsed.type === 'update_block' || parsed.type === 'insert_blocks' || parsed.type === 'delete_block') {
                            yield formatToolCallEvent('diff_preview', parsed)
                        }
                    } catch {
                        // 非 JSON 结果，忽略
                    }
                }
            }

            yield formatDoneEvent()
        } catch (error: unknown) {
            // LangGraph Agent 失败时，降级到 DeepSeek API 透传
            this.logger.warn('LangGraph Agent failed, falling back to legacy DeepSeek API', error)

            try {
                const response = await this.legacyChatStream(messages)
                if (!response.ok || !response.body) {
                    throw new Error(`DeepSeek API 请求失败: ${response.status}`)
                }

                // 透传 DeepSeek 原始 SSE 流
                const reader = response.body.getReader()
                const decoder = new TextDecoder()
                let doneYielded = false

                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break

                    const chunk = decoder.decode(value, { stream: true })
                    const lines = chunk.split('\n')
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const dataStr = line.slice(6).trim()
                            if (dataStr === '[DONE]') {
                                yield formatDoneEvent()
                                doneYielded = true
                                continue
                            }
                            try {
                                const data = JSON.parse(dataStr)
                                const content = data.choices?.[0]?.delta?.content
                                if (content) {
                                    yield formatContentEvent(content)
                                }
                            } catch {
                                // 跳过无法解析的行
                            }
                        }
                    }
                }

                if (!doneYielded) {
                    yield formatDoneEvent()
                }
            } catch (fallbackError: unknown) {
                this.logger.error('Both LangGraph and legacy API failed', fallbackError)
                yield formatContentEvent(`[错误] ${fallbackError instanceof Error ? fallbackError.message : 'AI 服务异常'}`)
                yield formatDoneEvent()
            }
        }
    }

    /**
     * 文档摘要
     *
     * 使用摘要 Agent 处理：分块 → 逐块摘要 → 合并 → 精炼
     * 非流式，直接返回最终摘要。
     *
     * @param dto - 摘要请求参数
     * @returns AsyncGenerator，yield 最终摘要的 SSE 文本
     */
    async *summaryStream(dto: SummaryDto): AsyncGenerator<string> {
        const checkpointer = this.checkpointerService.getCheckpointer()
        const graph = createSummaryGraph(this.llmFactory, checkpointer)

        const configurable: Record<string, any> = {}
        if (dto.threadId) {
            configurable.thread_id = dto.threadId
        }

        try {
            const result = await graph.invoke(
                { documentContent: dto.documentContent, messages: [] },
                { configurable },
            )

            // 返回最终摘要
            if (result.finalSummary) {
                yield formatContentEvent(result.finalSummary)
            }
            yield formatDoneEvent()
        } catch (error: unknown) {
            this.logger.error('Summary stream error', error)
            yield formatContentEvent(`[错误] ${error instanceof Error ? error.message : '摘要生成异常'}`)
            yield formatDoneEvent()
        }
    }

    /**
     * 大纲生成
     *
     * 使用大纲 Agent 处理：生成大纲 → 中断等待审批 → 逐节展开
     * 生成大纲后会在 approveOutline 节点前中断，
     * 前端收到 interrupt 事件后展示大纲编辑界面。
     *
     * @param dto - 大纲请求参数
     * @returns AsyncGenerator，yield 大纲的 SSE 文本（含 interrupt 事件）
     */
    async *outlineStream(dto: OutlineDto): AsyncGenerator<string> {
        const checkpointer = this.checkpointerService.getCheckpointer()
        const graph = createOutlineGraph(this.llmFactory, checkpointer)

        const threadId = dto.threadId || crypto.randomUUID()
        const configurable = { thread_id: threadId }

        try {
            const result = await graph.invoke(
                { topic: dto.topic, requirements: dto.requirements || '', messages: [] },
                { configurable },
            )

            // 如果被中断（等待审批），推送中断事件
            // LangGraph interruptBefore 会使 invoke 在中断点返回
            if (result.outline && result.outline.length > 0) {
                yield formatInterruptEvent('approveOutline', {
                    outline: result.outline,
                    flatOutline: result.flatOutline,
                }, threadId)
            }
            yield formatDoneEvent()
        } catch (error: unknown) {
            this.logger.error('Outline stream error', error)
            yield formatContentEvent(`[错误] ${error instanceof Error ? error.message : '大纲生成异常'}`)
            yield formatDoneEvent()
        }
    }

    /**
     * 文档改写
     *
     * 使用改写 Agent 处理：生成改写 → Diff → 中断等待审批
     * 生成改写后会在 approveRewrite 节点前中断，
     * 前端收到 interrupt 事件后展示 Diff 预览界面。
     *
     * @param dto - 改写请求参数
     * @returns AsyncGenerator，yield 改写结果的 SSE 文本（含 interrupt 事件）
     */
    async *rewriteStream(dto: RewriteDto): AsyncGenerator<string> {
        const checkpointer = this.checkpointerService.getCheckpointer()
        const graph = createRewriteGraph(this.llmFactory, checkpointer)

        const threadId = dto.threadId || crypto.randomUUID()
        const configurable = { thread_id: threadId }

        try {
            const result = await graph.invoke(
                {
                    selectedContent: dto.selectedContent,
                    instruction: dto.instruction,
                    context: dto.context || '',
                    messages: [],
                },
                { configurable },
            )

            // 推送改写结果和 Diff
            if (result.rewrittenContent) {
                yield formatInterruptEvent('approveRewrite', {
                    rewrittenContent: result.rewrittenContent,
                    diff: result.diff,
                }, threadId)
            }
            yield formatDoneEvent()
        } catch (error: unknown) {
            this.logger.error('Rewrite stream error', error)
            yield formatContentEvent(`[错误] ${error instanceof Error ? error.message : '改写生成异常'}`)
            yield formatDoneEvent()
        }
    }

    /**
     * 恢复中断的 Agent 执行
     *
     * Human-in-the-Loop 机制：用户审批后，调用此方法恢复 Agent 执行。
     * 根据 threadId 找到暂停的 Agent 状态，继续执行。
     *
     * @param dto - 恢复请求参数
     * @returns AsyncGenerator，yield 恢复后的 SSE 文本
     */
    async *resumeAgent(dto: ResumeDto): AsyncGenerator<string> {
        const checkpointer = this.checkpointerService.getCheckpointer()

        // 使用 chat graph 恢复（简化处理）
        const graph = createChatGraph(this.llmFactory, checkpointer)
        const configurable = { thread_id: dto.threadId }

        try {
            if (dto.approved) {
                // 用户批准，继续执行
                const stream = graph.streamEvents(
                    null, // 传入 null 表示从中断点继续
                    { configurable, version: 'v2' },
                )

                for await (const event of stream) {
                    if (event.event === 'on_chat_model_stream') {
                        const chunk = event.data?.chunk
                        if (chunk?.content && typeof chunk.content === 'string') {
                            yield formatContentEvent(chunk.content)
                        }
                    }
                }
            }

            yield formatDoneEvent()
        } catch (error: unknown) {
            this.logger.error('Resume agent error', error)
            yield formatContentEvent(`[错误] ${error instanceof Error ? error.message : '恢复执行异常'}`)
            yield formatDoneEvent()
        }
    }

    /**
     * 向后兼容的 DeepSeek API 透传
     *
     * 在 LangGraph 完全上线前，保留此方法作为降级方案。
     * 当 LangGraph Agent 出现问题时，可回退到直接调用 DeepSeek API。
     *
     * @param messages - 对话消息列表
     * @returns DeepSeek API 的原始 Response 对象
     * @throws 当 DEEPSEEK_API_KEY 未配置时抛出错误
     */
    async legacyChatStream(messages: ChatMessage[]) {
        const apiKey = this.configService.get<string>('DEEPSEEK_API_KEY')
        if (!apiKey) {
            throw new Error('DEEPSEEK_API_KEY is not configured')
        }

        const model = this.configService.get<string>('DEEPSEEK_MODEL') ?? 'deepseek-v4-flash'

        const response = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model,
                messages,
                stream: true,
            }),
        })

        return response
    }
}
