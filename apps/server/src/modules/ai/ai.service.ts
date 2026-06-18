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
import { nanoid } from 'nanoid'
import { Injectable, Inject, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PostgresqlPersistence } from 'y-postgresql'
import { DataSource } from 'typeorm'
import * as Y from 'yjs'

import { PostgresCheckpointerService } from './checkpointer/postgres.checkpointer'
import { HumanMessage, AIMessage, SystemMessage, BaseMessage } from '@langchain/core/messages'
import { formatStructuredContext, StructuredContext } from './context/structured-context'
import { createChatGraph } from './graphs/chat.graph'
import { createOutlineGraph } from './graphs/outline.graph'
import { createRewriteGraph } from './graphs/rewrite.graph'
import { createSummaryGraph } from './graphs/summary.graph'
import { LlmFactory } from './llm/llm.factory'
import { RagService } from './rag/rag.service'
import {
    formatAgentStatusEvent,
    formatContentEvent,
    formatDoneEvent,
    formatInterruptEvent,
    formatToolCallEvent,
} from './sse/sse-formatter'
import { ChatDto, ChatMessage, OutlineDto, ResumeDto, RewriteDto, SummaryDto, KnowledgeChatDto, AutoTagDto, KnowledgeGraphDto, SaveKnowledgeCardDto, SmartSummaryDto, LearningPathDto, RelatedDocumentsDto, KnowledgeGlobalSearchDto } from './ai.dto'
import { createKnowledgeGraph } from './graphs/knowledge.graph'
import { createAutoTagGraph } from './graphs/auto-tag.graph'
import { createKnowledgeGraphGraph } from './graphs/knowledge-graph.graph'
import { createSmartSummaryGraph } from './graphs/smart-summary.graph'
import { createLearningPathGraph } from './graphs/learning-path.graph'
import { KnowledgeBookmarkService } from './knowledge/knowledge-bookmark.service'
import { PageService } from '../page/page.service'
import { UserEntity } from '../../entities/user.entity'
import { docs } from '../../fundamentals/yjs-postgresql/utils'

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name)

    constructor(
        private readonly configService: ConfigService,
        private readonly llmFactory: LlmFactory,
        private readonly checkpointerService: PostgresCheckpointerService,
        private readonly ragService: RagService,
        private readonly bookmarkService: KnowledgeBookmarkService,
        private readonly pageService: PageService,
        @Inject('YJS_POSTGRESQL_ADAPTER') private readonly yjsPostgresqlAdapter: PostgresqlPersistence,
        private readonly dataSource: DataSource,
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
        // 构建 configurable，包含文档上下文、线程 ID 和 RAG 服务
        // PostgresSaver 要求 thread_id 不能为 null，未提供时自动生成
        const configurable: Record<string, any> = {
            thread_id: dto.threadId || `thread-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            ragService: this.ragService,
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

    /**
     * 知识库问答（SSE 流式）
     *
     * 使用知识库 Agent 处理对话，支持 RAG 检索增强生成。
     * 流式输出通过 SSE 格式转换层统一格式。
     *
     * @param dto - 知识库问答请求参数
     * @returns AsyncGenerator，每次 yield 一段 SSE 格式的文本
     */
    async *knowledgeChatStream(dto: KnowledgeChatDto, userId: number): AsyncGenerator<string> {
        const graph = createKnowledgeGraph(this.llmFactory, this.checkpointerService.getCheckpointer())
        const threadId = dto.threadId || `knowledge-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        const configurable: Record<string, any> = {
            thread_id: threadId,
            ragService: this.ragService,
            pageId: dto.pageId,
            userId,
            context: dto.context,
            scope: dto.scope,
        }
        // 转换消息格式
        const messages = dto.messages.map(m => ({ type: m.role === 'user' ? 'human' : m.role === 'assistant' ? 'ai' : 'system', content: m.content }))
        // 注入上下文到 system message
        if (dto.context) {
            const contextText = formatStructuredContext(dto.context as StructuredContext)
            const systemIdx = messages.findIndex(m => m.type === 'system')
            if (systemIdx >= 0) {
                messages[systemIdx] = { ...messages[systemIdx], content: messages[systemIdx].content + '\n\n' + contextText }
            } else {
                messages.unshift({ type: 'system', content: contextText })
            }
        }
        try {
            const stream = await graph.streamEvents({ messages }, { configurable, version: 'v2' })
            for await (const event of stream) {
                // 与 chatStream 相同的事件处理逻辑
                const { event: eventType, data, name } = event
                if (eventType === 'on_chat_model_stream') {
                    const chunk = data?.chunk
                    if (chunk?.content && typeof chunk.content === 'string') {
                        yield formatContentEvent(chunk.content)
                    }
                } else if (eventType === 'on_tool_start') {
                    yield formatAgentStatusEvent(name, 'running')
                } else if (eventType === 'on_tool_end') {
                    yield formatAgentStatusEvent(name, 'completed')
                }
            }
            yield formatDoneEvent(threadId)
        } catch (error) {
            this.logger.error(`知识库问答失败: ${error instanceof Error ? error.message : error}`)
            yield formatDoneEvent(threadId)
        }
    }

    /**
     * 获取知识库索引状态
     *
     * @param pageId - 页面 ID
     * @returns 索引状态信息
     */
    async getKnowledgeStatus(pageId: string) {
        return this.ragService.getIndexStatus(pageId)
    }

    /**
     * 为知识库建立索引
     *
     * @param dto - 索引请求参数（包含页面 ID 和文档块）
     * @returns 操作结果
     */
    async indexForKnowledge(dto: { pageId: string; blocks: any[] }) {
        await this.ragService.indexDocument(dto.pageId, dto.blocks)
        return { success: true }
    }

    /**
     * 清除指定文档的索引数据
     *
     * 删除文档关联的所有分块和向量数据。
     *
     * @param pageId - 文档页面 ID
     * @returns 操作结果
     */
    async clearIndex(pageId: string) {
        return this.ragService.clearPageIndex(pageId)
    }

    /**
     * 自动标签生成
     *
     * 使用自动标签 Agent 分析文档并生成标签建议。
     * 非流式，直接返回标签结果。
     *
     * @param dto - 自动标签请求参数
     * @returns 标签建议结果
     */
    async autoTag(dto: AutoTagDto) {
        const graph = createAutoTagGraph(this.llmFactory)
        const configurable = { ragService: this.ragService, pageId: dto.pageId, context: dto.context }
        const result = await graph.invoke(
            { messages: [{ role: 'user', content: '请分析这篇文档并生成标签建议' }] },
            { configurable },
        )
        const rawContent = result.messages[result.messages.length - 1].content
        const content = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent)
        try {
            const jsonMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
            const jsonStr = jsonMatch ? jsonMatch[1].trim() : content
            return JSON.parse(jsonStr)
        } catch {
            return { tags: [], suggestedFolder: '', summary: content }
        }
    }

    /**
     * 生成知识图谱
     *
     * 使用知识图谱 Agent 分析文档并生成实体关系图谱。
     * 非流式，直接返回图谱数据。
     *
     * @param dto - 知识图谱请求参数
     * @returns 知识图谱数据（实体、关系、Mermaid 图）
     */
    async generateKnowledgeGraph(dto: KnowledgeGraphDto) {
        const graph = createKnowledgeGraphGraph(this.llmFactory)
        const configurable = { ragService: this.ragService, pageId: dto.pageId, context: dto.context }
        const result = await graph.invoke(
            { messages: [{ role: 'user', content: '请分析这篇文档并生成知识图谱' }] },
            { configurable },
        )
        const rawContent = result.messages[result.messages.length - 1].content
        const content = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent)
        try {
            // LLM 可能返回 markdown 代码块包裹的 JSON，需要提取
            const jsonMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
            const jsonStr = jsonMatch ? jsonMatch[1].trim() : content
            return JSON.parse(jsonStr)
        } catch {
            this.logger.warn(`知识图谱 JSON 解析失败，原始内容: ${content.substring(0, 200)}`)
            return { entities: [], relations: [], mermaid: '' }
        }
    }

    /**
     * 保存知识卡片
     *
     * 创建新页面作为知识卡片，将内容写入文档。
     *
     * @param dto - 知识卡片保存参数
     * @param userId - 用户 ID
     * @returns 创建的页面 ID
     */
    async saveKnowledgeCard(dto: SaveKnowledgeCardDto, userId: number) {
        const pageId = 'page' + nanoid(6)
        const user = new UserEntity()
        user.id = userId
        const page = await this.pageService.create({
            pageId,
            title: dto.title,
            emoji: '🃏',
            user,
            folderId: dto.folderId,
        })

        // 将 content 写入 Yjs 文档
        await this.writeContentToYjsDoc(page.pageId, dto.content)

        return { pageId: page.pageId }
    }

    /**
     * 将文本内容写入 Yjs 文档
     *
     * 创建或获取 Yjs 文档，将纯文本内容作为段落写入 XmlFragment。
     * 处理内存中和持久化两种情况。
     *
     * @param pageId - 页面 ID
     * @param content - 要写入的文本内容
     */
    private async writeContentToYjsDoc(pageId: string, content: string) {
        const docName = `doc-yjs-${pageId}`
        const fragmentKey = `document-store-${pageId}`

        let doc: Y.Doc
        let needsPersist = false

        const existingDoc = docs.get(docName)
        if (existingDoc) {
            doc = existingDoc
        } else {
            doc = await this.yjsPostgresqlAdapter.getYDoc(docName)
            needsPersist = true
        }

        const fragment = doc.getXmlFragment(fragmentKey)

        doc.transact(() => {
            // 清空现有内容
            while (fragment.length > 0) {
                fragment.delete(0)
            }

            // 将文本按段落分割并写入
            const paragraphs = content.split('\n').filter(p => p.trim() !== '')
            for (const paragraph of paragraphs) {
                const paragraphNode = new Y.XmlElement('paragraph')
                const textNode = new Y.XmlText()
                textNode.insert(0, paragraph)
                paragraphNode.push([textNode])
                fragment.push([paragraphNode])
            }
        }, 'save-knowledge-card')

        // 如果文档不在内存中，需要手动持久化
        if (needsPersist) {
            const update = Y.encodeStateAsUpdate(doc)
            await this.yjsPostgresqlAdapter.storeUpdate(docName, update)
        }
    }

    /**
     * 智能摘要
     *
     * 使用智能摘要 Agent 生成文档的结构化摘要，
     * 包含关键要点、核心结论和建议行动。
     * 非流式，直接返回摘要结果。
     *
     * @param dto - 智能摘要请求参数
     * @returns 结构化摘要结果
     */
    async smartSummary(dto: SmartSummaryDto) {
        const graph = createSmartSummaryGraph(this.llmFactory)
        const configurable = { ragService: this.ragService, pageId: dto.pageId, context: dto.context }
        const result = await graph.invoke(
            { messages: [{ role: 'user', content: '请生成这篇文档的智能摘要' }] },
            { configurable },
        )
        const rawContent = result.messages[result.messages.length - 1].content
        const content = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent)
        try {
            const jsonMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
            const jsonStr = jsonMatch ? jsonMatch[1].trim() : content
            return JSON.parse(jsonStr)
        } catch {
            return { keyPoints: [], coreConclusion: content, suggestedActions: [], readingTime: '' }
        }
    }

    /**
     * 生成学习路径
     *
     * 使用学习路径 Agent 基于当前文档推荐学习路径。
     * 非流式，直接返回学习路径。
     *
     * @param dto - 学习路径请求参数
     * @param userId - 用户 ID
     * @returns 学习路径数据
     */
    async generateLearningPath(dto: LearningPathDto, userId: number) {
        const graph = createLearningPathGraph(this.llmFactory)
        const configurable = { ragService: this.ragService, pageId: dto.pageId, userId, context: dto.context }
        const result = await graph.invoke(
            { messages: [{ role: 'user', content: '请基于当前文档推荐学习路径' }] },
            { configurable },
        )
        const rawContent = result.messages[result.messages.length - 1].content
        const content = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent)
        try {
            const jsonMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
            const jsonStr = jsonMatch ? jsonMatch[1].trim() : content
            return JSON.parse(jsonStr)
        } catch {
            return { path: [] }
        }
    }

    /**
     * 获取相关文档
     *
     * 基于当前文档内容检索其他相关文档，
     * 自动过滤当前文档并按页面 ID 去重。
     *
     * @param dto - 相关文档请求参数
     * @param userId - 用户 ID
     * @returns 相关文档列表
     */
    async getRelatedDocuments(dto: RelatedDocumentsDto, userId: number) {
        // 获取当前文档的代表性内容
        const chunks = await this.ragService.retrieve('', { pageId: dto.pageId, topK: 3, minScore: 0 })
        if (!chunks.length) return []
        // 用当前文档内容搜索其他文档
        const queryText = chunks.map(c => c.content).join(' ').slice(0, 500)
        const results = await this.ragService.retrieve(queryText, { topK: dto.topK, minScore: 0.6 })
        // 过滤当前文档 + 按 pageId 去重
        const seen = new Set<string>([dto.pageId])
        return results
            .filter(r => !seen.has(r.pageId) && seen.add(r.pageId))
            .map(r => ({ pageId: r.pageId, score: r.score, matchedContent: r.content.slice(0, 200) }))
    }

    /**
     * 知识库全局搜索
     *
     * 在所有已索引的文档中搜索匹配内容。
     *
     * @param dto - 全局搜索请求参数
     * @param userId - 用户 ID
     * @returns 搜索结果列表
     */
    async knowledgeGlobalSearch(dto: KnowledgeGlobalSearchDto, userId: number) {
        const results = await this.ragService.retrieve(dto.query, { topK: dto.topK, minScore: dto.minScore })
        return results.map(r => ({ pageId: r.pageId, blockId: r.blockId, content: r.content, score: r.score }))
    }

    /**
     * 获取对话线程列表
     *
     * 查询用户的对话线程列表，支持分页。
     * TODO: 实现 PostgresSaver 的 thread 查询。
     *
     * @param userId - 用户 ID
     * @param page - 页码（默认 1）
     * @param pageSize - 每页数量（默认 20）
     * @returns 线程列表和总数
     */
    async listThreads(userId: number, page: number = 1, pageSize: number = 20) {
        const checkpointer = this.checkpointerService.getCheckpointer()
        if (!checkpointer) {
            return { items: [], total: 0 }
        }

        try {
            // 直接查询 checkpoints 表获取线程列表
            // 注意：LangGraph 的 checkpoints 表不存储 userId，
            // 当前通过 thread_id 前缀 "knowledge-" 过滤知识库线程
            const countResult = await this.dataSource.query(
                `SELECT COUNT(DISTINCT thread_id) as total FROM checkpoints WHERE thread_id LIKE 'knowledge-%'`,
            )
            const total = Number(countResult[0]?.total || 0)

            const offset = (page - 1) * pageSize
            const rows = await this.dataSource.query(
                `SELECT DISTINCT thread_id, MAX(created_at) as last_active
                 FROM checkpoints
                 WHERE thread_id LIKE 'knowledge-%'
                 GROUP BY thread_id
                 ORDER BY last_active DESC
                 LIMIT $1 OFFSET $2`,
                [pageSize, offset],
            )

            const items = rows.map((row: any) => ({
                threadId: row.thread_id,
                lastActive: row.last_active,
            }))

            return { items, total }
        } catch (error) {
            this.logger.warn(`查询线程列表失败: ${error instanceof Error ? error.message : error}`)
            return { items: [], total: 0 }
        }
    }

    /**
     * 删除对话线程
     *
     * 从 checkpoints 相关表中删除指定线程的所有数据。
     *
     * @param threadId - 线程 ID
     */
    async deleteThread(threadId: string) {
        try {
            await Promise.all([
                this.dataSource.query(`DELETE FROM checkpoints WHERE thread_id = $1`, [threadId]),
                this.dataSource.query(`DELETE FROM checkpoint_blobs WHERE thread_id = $1`, [threadId]),
                this.dataSource.query(`DELETE FROM checkpoint_writes WHERE thread_id = $1`, [threadId]),
            ])
            return { success: true }
        } catch (error) {
            this.logger.warn(`删除线程失败: ${error instanceof Error ? error.message : error}`)
            return { success: false }
        }
    }
}
