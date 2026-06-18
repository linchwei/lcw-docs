/**
 * AI 控制器（重构版）
 *
 * 新增多个端点支持不同的 AI Agent 工作流：
 * - POST /ai/chat: 通用对话（带文档工具的 Agent）
 * - POST /ai/summary: 文档摘要
 * - POST /ai/outline: 大纲生成
 * - POST /ai/rewrite: 文档改写
 * - POST /ai/resume: 恢复中断的 Agent
 *
 * 所有端点返回 SSE 流式响应。
 * 统一使用 setupSSEHeaders() 设置响应头，
 * 统一使用 AsyncGenerator 遍历模式写入 SSE 数据。
 *
 * @module ai/controller
 */
import { Body, Controller, Delete, Get, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { SkipThrottle } from '@nestjs/throttler'
import type { Response } from 'express'

import { ZodValidationPipe } from '../../pipes/zod-validation.pipe'
import {
    AutoTagDto,
    autoTagSchema,
    ChatDto,
    chatSchema,
    CreateBookmarkDto,
    createBookmarkSchema,
    IndexDocumentDto,
    indexDocumentSchema,
    KnowledgeChatDto,
    knowledgeChatSchema,
    KnowledgeGlobalSearchDto,
    knowledgeGlobalSearchSchema,
    KnowledgeGraphDto,
    knowledgeGraphSchema,
    KnowledgeIndexDto,
    knowledgeIndexSchema,
    LearningPathDto,
    learningPathSchema,
    OutlineDto,
    outlineSchema,
    ResumeDto,
    resumeSchema,
    RewriteDto,
    rewriteSchema,
    SaveKnowledgeCardDto,
    saveKnowledgeCardSchema,
    SearchBookmarksDto,
    searchBookmarksSchema,
    SemanticSearchDto,
    semanticSearchSchema,
    SmartSummaryDto,
    smartSummarySchema,
    SummaryDto,
    summarySchema,
} from './ai.dto'
import { AiService } from './ai.service'
import { KnowledgeBookmarkService } from './knowledge/knowledge-bookmark.service'
import { RagService } from './rag/rag.service'

@ApiTags('AI 助手')
@ApiBearerAuth('jwt')
@Controller('ai')
@UseGuards(AuthGuard('jwt'))
@SkipThrottle({ short: true, medium: true, long: true })
export class AiController {
    constructor(
        private readonly aiService: AiService,
        private readonly ragService: RagService,
        private readonly bookmarkService: KnowledgeBookmarkService
    ) {}

    /**
     * 通用 SSE 流式响应
     *
     * 监听客户端连接断开事件，提前终止迭代避免资源泄漏。
     */
    private streamSSE(res: Response, stream: AsyncGenerator<string>) {
        this.setupSSEHeaders(res)

        let aborted = false
        const req = res.req!

        req.on('close', () => {
            aborted = true
        })
        ;(async () => {
            try {
                for await (const chunk of stream) {
                    if (aborted) break
                    res.write(chunk)
                }
            } catch (error: unknown) {
                if (!aborted) {
                    res.write(`data: ${JSON.stringify({ error: error instanceof Error ? error.message : 'AI 服务异常' })}\n\n`)
                }
            }

            res.end()
        })()
    }

    /**
     * 通用对话（带文档工具的 Agent）
     *
     * 支持文档读取工具（大纲、章节、选区、搜索）
     * 和文档写入工具（插入、更新、删除，需 Diff 审批）。
     */
    @Post('chat')
    async chat(@Body(new ZodValidationPipe(chatSchema)) body: ChatDto, @Res() res: Response) {
        this.streamSSE(res, this.aiService.chatStream(body))
    }

    /**
     * 文档摘要
     *
     * 接收文档全文内容，返回摘要。
     * 内部使用分块摘要 + 合并 + 精炼的工作流。
     */
    @Post('summary')
    async summary(@Body(new ZodValidationPipe(summarySchema)) body: SummaryDto, @Res() res: Response) {
        this.streamSSE(res, this.aiService.summaryStream(body))
    }

    /**
     * 大纲生成
     *
     * 接收主题和要求，生成大纲后中断等待审批。
     * 前端收到 interrupt 事件后展示大纲编辑界面。
     */
    @Post('outline')
    async outline(@Body(new ZodValidationPipe(outlineSchema)) body: OutlineDto, @Res() res: Response) {
        this.streamSSE(res, this.aiService.outlineStream(body))
    }

    /**
     * 文档改写
     *
     * 接收选区内容和改写指令，生成改写后中断等待审批。
     * 前端收到 interrupt 事件后展示 Diff 预览界面。
     */
    @Post('rewrite')
    async rewrite(@Body(new ZodValidationPipe(rewriteSchema)) body: RewriteDto, @Res() res: Response) {
        this.streamSSE(res, this.aiService.rewriteStream(body))
    }

    /**
     * 恢复中断的 Agent（Human-in-the-Loop）
     *
     * 用户审批后，调用此端点恢复 Agent 执行。
     * threadId 用于定位暂停的 Agent 状态。
     */
    @Post('resume')
    async resume(@Body(new ZodValidationPipe(resumeSchema)) body: ResumeDto, @Res() res: Response) {
        this.streamSSE(res, this.aiService.resumeAgent(body))
    }

    /**
     * RAG 文档索引
     *
     * 将文档内容分块、生成嵌入向量并存储到 pgvector。
     * 前端在文档保存后调用此端点触发异步索引。
     * 索引是幂等的：重复调用会先删除旧分块再重新索引。
     */
    @Post('rag/index')
    async indexDocument(@Body(new ZodValidationPipe(indexDocumentSchema)) body: IndexDocumentDto) {
        if (!this.ragService.isAvailable()) {
            return { success: false, message: 'RAG 服务不可用（Embedding API 或 pgvector 未配置）' }
        }

        // 异步索引，不阻塞响应
        this.ragService.indexDocument(body.pageId, body.blocks).catch(() => {
            // 索引失败已在 RagService 内部记录日志
        })

        return { success: true, message: '文档索引已触发' }
    }

    /**
     * RAG 语义搜索
     *
     * 基于向量相似度的语义搜索，可找到意思相近但用词不同的内容。
     * 返回按相似度降序排列的文档分块列表。
     */
    @Post('rag/search')
    async semanticSearch(@Body(new ZodValidationPipe(semanticSearchSchema)) body: SemanticSearchDto) {
        if (!this.ragService.isAvailable()) {
            return { success: false, message: 'RAG 服务不可用', results: [] }
        }

        const results = await this.ragService.retrieve(body.query, {
            topK: body.topK ?? 5,
            minScore: body.minScore ?? 0.5,
            pageId: body.pageId,
        })

        return { success: true, results }
    }

    // ─── 知识库端点 ───

    /**
     * 知识库问答（SSE 流式响应）
     *
     * 支持跨文档搜索的 AI 问答，
     * 根据搜索范围（当前文档/全部文档）检索相关内容后生成回答。
     */
    @Post('knowledge/chat')
    async knowledgeChat(@Body(new ZodValidationPipe(knowledgeChatSchema)) body: KnowledgeChatDto, @Req() req: any, @Res() res: Response) {
        this.streamSSE(res, this.aiService.knowledgeChatStream(body, req.user.id))
    }

    /**
     * 查询知识库索引状态
     *
     * 返回指定文档的索引状态（是否已索引、分块数量等）。
     */
    @Get('knowledge/status/:pageId')
    async getKnowledgeStatus(@Param('pageId') pageId: string) {
        return this.aiService.getKnowledgeStatus(pageId)
    }

    /**
     * 触发知识库索引
     *
     * 将文档内容分块、生成嵌入向量并存储到 pgvector，
     * 供知识库问答和语义搜索使用。
     */
    @Post('knowledge/index')
    async indexForKnowledge(@Body(new ZodValidationPipe(knowledgeIndexSchema)) body: KnowledgeIndexDto) {
        return this.aiService.indexForKnowledge(body as { pageId: string; blocks: any[] })
    }

    /**
     * 清除文档索引
     *
     * 删除指定文档的所有分块和向量数据。
     */
    @Delete('knowledge/index/:pageId')
    async clearIndex(@Param('pageId') pageId: string) {
        return this.aiService.clearIndex(pageId)
    }

    /**
     * 自动标签生成
     *
     * 基于文档内容自动生成标签，便于分类和检索。
     */
    @Post('knowledge/auto-tag')
    async autoTag(@Body(new ZodValidationPipe(autoTagSchema)) body: AutoTagDto) {
        return this.aiService.autoTag(body)
    }

    /**
     * 知识图谱生成
     *
     * 基于文档内容生成知识图谱，展示概念之间的关系。
     */
    @Post('knowledge/graph')
    async generateKnowledgeGraph(@Body(new ZodValidationPipe(knowledgeGraphSchema)) body: KnowledgeGraphDto) {
        return this.aiService.generateKnowledgeGraph(body)
    }

    /**
     * 保存知识卡片
     *
     * 将 AI 生成的知识卡片保存到用户的收藏中。
     */
    @Post('knowledge/save-card')
    async saveKnowledgeCard(@Body(new ZodValidationPipe(saveKnowledgeCardSchema)) body: SaveKnowledgeCardDto, @Req() req: any) {
        return this.aiService.saveKnowledgeCard(body, req.user.id)
    }

    /**
     * 智能摘要生成
     *
     * 基于文档内容和上下文生成结构化摘要。
     */
    @Post('knowledge/smart-summary')
    async smartSummary(@Body(new ZodValidationPipe(smartSummarySchema)) body: SmartSummaryDto) {
        return this.aiService.smartSummary(body)
    }

    /**
     * 学习路径推荐
     *
     * 基于文档内容推荐学习路径，帮助用户系统化学习。
     */
    @Post('knowledge/learning-path')
    async generateLearningPath(@Body(new ZodValidationPipe(learningPathSchema)) body: LearningPathDto, @Req() req: any) {
        return this.aiService.generateLearningPath(body, req.user.id)
    }

    /**
     * 查询关联文档
     *
     * 基于向量相似度查找与指定文档相关联的其他文档。
     */
    @Get('knowledge/related/:pageId')
    async getRelatedDocuments(@Param('pageId') pageId: string, @Query() query: any, @Req() req: any) {
        return this.aiService.getRelatedDocuments({ pageId, topK: parseInt(query.topK) || 5 }, req.user.id)
    }

    /**
     * 知识库全局搜索
     *
     * 跨文档的语义搜索，返回按相似度排序的结果。
     */
    @Post('knowledge/global-search')
    async knowledgeGlobalSearch(@Body(new ZodValidationPipe(knowledgeGlobalSearchSchema)) body: KnowledgeGlobalSearchDto, @Req() req: any) {
        return this.aiService.knowledgeGlobalSearch(body, req.user.id)
    }

    /**
     * 搜索知识收藏
     *
     * 根据关键词搜索当前用户的知识收藏。
     * 注意：此路由必须在 @Post('knowledge/bookmark') 之前定义，
     * 否则 /bookmark/search 会被 /bookmark 路由先匹配到。
     */
    @Post('knowledge/bookmark/search')
    async searchBookmarks(@Body(new ZodValidationPipe(searchBookmarksSchema)) body: SearchBookmarksDto, @Req() req: any) {
        return this.bookmarkService.search({ userId: req.user.id, query: body.query })
    }

    /**
     * 创建知识收藏
     *
     * 收藏文档中的知识片段，支持关联问题和对话线程。
     */
    @Post('knowledge/bookmark')
    async createBookmark(@Body(new ZodValidationPipe(createBookmarkSchema)) body: CreateBookmarkDto, @Req() req: any) {
        return this.bookmarkService.create({
            ...body,
            userId: req.user.id,
        } as Parameters<typeof this.bookmarkService.create>[0])
    }

    /**
     * 查询知识收藏列表
     *
     * 分页返回当前用户的知识收藏列表。
     */
    @Get('knowledge/bookmarks')
    async listBookmarks(@Query() query: any, @Req() req: any) {
        return this.bookmarkService.list({
            userId: req.user.id,
            page: parseInt(query.page) || 1,
            pageSize: parseInt(query.pageSize) || 20,
        })
    }

    /**
     * 删除知识收藏
     *
     * 根据收藏 ID 删除指定的知识收藏。
     */
    @Delete('knowledge/bookmark/:id')
    async deleteBookmark(@Param('id') id: string, @Req() req: any) {
        return this.bookmarkService.delete({ bookmarkId: parseInt(id), userId: req.user.id })
    }

    /**
     * 查询对话线程列表
     *
     * 分页返回当前用户的对话线程列表。
     */
    @Get('knowledge/threads')
    async listThreads(@Query() query: any, @Req() req: any) {
        return this.aiService.listThreads(req.user.id, parseInt(query.page) || 1, parseInt(query.pageSize) || 20)
    }

    /**
     * 删除对话线程
     *
     * 根据线程 ID 删除指定的对话线程及其历史记录。
     */
    @Delete('knowledge/thread/:threadId')
    async deleteThread(@Param('threadId') threadId: string, @Req() _req: any) {
        return this.aiService.deleteThread(threadId)
    }

    /**
     * 设置 SSE 响应头
     *
     * 统一设置所有 AI 端点的 SSE 响应头，
     * 确保正确的流式传输行为。
     *
     * - Content-Type: text/event-stream — SSE 标准格式
     * - Cache-Control: no-cache — 禁止缓存
     * - Connection: keep-alive — 保持连接
     * - X-Accel-Buffering: no — 禁止 Nginx 缓冲
     */
    private setupSSEHeaders(res: Response) {
        res.setHeader('Content-Type', 'text/event-stream')
        res.setHeader('Cache-Control', 'no-cache')
        res.setHeader('Connection', 'keep-alive')
        res.setHeader('X-Accel-Buffering', 'no')
        res.flushHeaders()
    }
}
