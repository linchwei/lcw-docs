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
import { Body, Controller, Post, Res, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import type { Response } from 'express'

import { ZodValidationPipe } from '../../pipes/zod-validation.pipe'
import {
    ChatDto,
    chatSchema,
    IndexDocumentDto,
    indexDocumentSchema,
    OutlineDto,
    outlineSchema,
    ResumeDto,
    resumeSchema,
    RewriteDto,
    rewriteSchema,
    SemanticSearchDto,
    semanticSearchSchema,
    SummaryDto,
    summarySchema,
} from './ai.dto'
import { AiService } from './ai.service'
import { RagService } from './rag/rag.service'

@ApiTags('AI 助手')
@ApiBearerAuth('jwt')
@Controller('ai')
@UseGuards(AuthGuard('jwt'))
export class AiController {
    constructor(
        private readonly aiService: AiService,
        private readonly ragService: RagService,
    ) {}

    /**
     * 通用对话（带文档工具的 Agent）
     *
     * 支持文档读取工具（大纲、章节、选区、搜索）
     * 和文档写入工具（插入、更新、删除，需 Diff 审批）。
     */
    @Post('chat')
    async chat(
        @Body(new ZodValidationPipe(chatSchema)) body: ChatDto,
        @Res() res: Response,
    ) {
        this.setupSSEHeaders(res)

        try {
            for await (const chunk of this.aiService.chatStream(body)) {
                res.write(chunk)
            }
        } catch (error: unknown) {
            res.write(`data: ${JSON.stringify({ error: error instanceof Error ? error.message : 'AI 服务异常' })}\n\n`)
        }

        res.end()
    }

    /**
     * 文档摘要
     *
     * 接收文档全文内容，返回摘要。
     * 内部使用分块摘要 + 合并 + 精炼的工作流。
     */
    @Post('summary')
    async summary(
        @Body(new ZodValidationPipe(summarySchema)) body: SummaryDto,
        @Res() res: Response,
    ) {
        this.setupSSEHeaders(res)

        try {
            for await (const chunk of this.aiService.summaryStream(body)) {
                res.write(chunk)
            }
        } catch (error: unknown) {
            res.write(`data: ${JSON.stringify({ error: error instanceof Error ? error.message : 'AI 服务异常' })}\n\n`)
        }

        res.end()
    }

    /**
     * 大纲生成
     *
     * 接收主题和要求，生成大纲后中断等待审批。
     * 前端收到 interrupt 事件后展示大纲编辑界面。
     */
    @Post('outline')
    async outline(
        @Body(new ZodValidationPipe(outlineSchema)) body: OutlineDto,
        @Res() res: Response,
    ) {
        this.setupSSEHeaders(res)

        try {
            for await (const chunk of this.aiService.outlineStream(body)) {
                res.write(chunk)
            }
        } catch (error: unknown) {
            res.write(`data: ${JSON.stringify({ error: error instanceof Error ? error.message : 'AI 服务异常' })}\n\n`)
        }

        res.end()
    }

    /**
     * 文档改写
     *
     * 接收选区内容和改写指令，生成改写后中断等待审批。
     * 前端收到 interrupt 事件后展示 Diff 预览界面。
     */
    @Post('rewrite')
    async rewrite(
        @Body(new ZodValidationPipe(rewriteSchema)) body: RewriteDto,
        @Res() res: Response,
    ) {
        this.setupSSEHeaders(res)

        try {
            for await (const chunk of this.aiService.rewriteStream(body)) {
                res.write(chunk)
            }
        } catch (error: unknown) {
            res.write(`data: ${JSON.stringify({ error: error instanceof Error ? error.message : 'AI 服务异常' })}\n\n`)
        }

        res.end()
    }

    /**
     * 恢复中断的 Agent（Human-in-the-Loop）
     *
     * 用户审批后，调用此端点恢复 Agent 执行。
     * threadId 用于定位暂停的 Agent 状态。
     */
    @Post('resume')
    async resume(
        @Body(new ZodValidationPipe(resumeSchema)) body: ResumeDto,
        @Res() res: Response,
    ) {
        this.setupSSEHeaders(res)

        try {
            for await (const chunk of this.aiService.resumeAgent(body)) {
                res.write(chunk)
            }
        } catch (error: unknown) {
            res.write(`data: ${JSON.stringify({ error: error instanceof Error ? error.message : 'AI 服务异常' })}\n\n`)
        }

        res.end()
    }

    /**
     * RAG 文档索引
     *
     * 将文档内容分块、生成嵌入向量并存储到 pgvector。
     * 前端在文档保存后调用此端点触发异步索引。
     * 索引是幂等的：重复调用会先删除旧分块再重新索引。
     */
    @Post('rag/index')
    async indexDocument(
        @Body(new ZodValidationPipe(indexDocumentSchema)) body: IndexDocumentDto,
    ) {
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
    async semanticSearch(
        @Body(new ZodValidationPipe(semanticSearchSchema)) body: SemanticSearchDto,
    ) {
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
