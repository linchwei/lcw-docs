/**
 * RAG 核心服务
 *
 * 编排 RAG（检索增强生成）的完整流水线：
 *   索引流程：文档内容 → 分块 → 嵌入 → 向量存储
 *   检索流程：用户查询 → 查询向量化 → 相似度检索 → 上下文格式化
 *
 * 设计原则：
 *   - 异步索引：文档保存时异步触发索引，不阻塞保存响应
 *   - 降级策略：任何步骤失败（Embedding API 不可用、pgvector 未就绪），
 *     自动降级为关键词搜索，保证搜索功能始终可用
 *   - 增量索引：文档更新时先删除旧分块再重新索引
 *
 * 使用方式：
 *   // 索引文档（在文档保存时调用）
 *   await ragService.indexDocument(pageId, blocks)
 *
 *   // 语义检索（在 AI Agent 搜索时调用）
 *   const results = await ragService.retrieve(query)
 *
 *   // 检索并格式化为 LLM 上下文
 *   const context = await ragService.retrieveAndFormat(query)
 *
 * @module rag/service
 */
import { Injectable, Logger } from '@nestjs/common'

import { DocumentChunker } from './chunker/document.chunker'
import { ChunkingConfig } from './chunker/chunker.types'
import { EmbeddingService } from './embedding/embedding.service'
import { DocumentChunkRepository } from './vector/document-chunk.repository'
import { VectorSearchOptions, VectorSearchResult } from './vector/vector.types'
import { VectorStore } from './vector/vector.store'
import { VectorSetupService } from './vector/vector.setup'

/** Block 数据结构（与 DocumentContext.blocks 对齐，字段均为必填） */
interface BlockData {
    id: string
    type: string
    content: string
    level?: number
}

/** 从 DTO 转换的 Block 数据（字段可能为可选，需提供默认值） */
interface BlockInput {
    id?: string
    type?: string
    content?: string
    level?: number
}

/** 知识库索引状态 */
interface KnowledgeIndexStatus {
    /** 是否已索引 */
    isIndexed: boolean
    /** 总分块数 */
    totalChunks: number
    /** 已嵌入分块数 */
    embeddedChunks: number
    /** 未嵌入分块数 */
    unembeddedChunks: number
    /** 最后索引时间（近似值，基于最大 ID） */
    lastIndexedAt: Date | null
}

@Injectable()
export class RagService {
    private readonly logger = new Logger(RagService.name)

    constructor(
        private chunker: DocumentChunker,
        private embeddingService: EmbeddingService,
        private vectorStore: VectorStore,
        private vectorSetup: VectorSetupService,
        private chunkRepo: DocumentChunkRepository,
    ) {}

    /**
     * 索引文档：分块 → 嵌入 → 存储
     *
     * 完整的文档索引流水线。在文档保存/更新时调用。
     * 更新文档时先删除旧分块，再重新索引，确保数据一致性。
     *
     * @param pageId - 文档 pageId
     * @param blocks - 文档 block 列表（字段可为可选，内部会填充默认值）
     * @param chunkingConfig - 可选的分块配置
     */
    async indexDocument(
        pageId: string,
        blocks: BlockInput[],
        chunkingConfig?: Partial<ChunkingConfig>,
    ): Promise<void> {
        // 前置检查：Embedding 服务和 pgvector 必须可用
        if (!this.embeddingService.isAvailable()) {
            this.logger.warn('Embedding 服务不可用，跳过文档索引')
            return
        }

        if (!this.vectorSetup.getIsReady()) {
            this.logger.warn('pgvector 未就绪，跳过文档索引')
            return
        }

        try {
            // 将可选字段转为必填（提供默认值）
            const normalizedBlocks: BlockData[] = blocks.map(b => ({
                id: b.id || '',
                type: b.type || 'paragraph',
                content: b.content || '',
                level: b.level,
            })).filter(b => b.content.length > 0)

            // 1. 删除旧分块（增量索引：先删后建）
            await this.vectorStore.deleteByPageId(pageId)

            // 2. 分块
            const chunks = this.chunker.chunkDocument(pageId, normalizedBlocks, chunkingConfig)
            if (chunks.length === 0) {
                this.logger.log(`文档 ${pageId} 无有效内容，跳过索引`)
                return
            }

            // 3. 批量嵌入
            const texts = chunks.map(c => c.content)
            const embeddings = await this.embeddingService.embedDocuments(texts)

            if (embeddings.length === 0) {
                this.logger.warn(`文档 ${pageId} 嵌入生成失败，跳过存储`)
                return
            }

            // 4. 存储
            await this.vectorStore.storeChunks(chunks, embeddings)

            this.logger.log(`文档 ${pageId} 索引完成: ${chunks.length} 个分块`)
        } catch (error) {
            this.logger.error(
                `文档索引失败 ${pageId}: ${error instanceof Error ? error.message : error}`,
            )
            // 索引失败不影响文档保存，只记录错误
        }
    }

    /**
     * 语义检索：查询 → 向量化 → 相似度检索
     *
     * 返回与查询语义最相关的文档分块列表。
     *
     * @param query - 用户查询文本
     * @param options - 搜索选项（topK、minScore、pageId 过滤）
     * @returns 按相似度降序排列的搜索结果，服务不可用时返回空数组
     */
    async retrieve(query: string, options?: Partial<VectorSearchOptions>): Promise<VectorSearchResult[]> {
        // 前置检查
        if (!this.embeddingService.isAvailable() || !this.vectorSetup.getIsReady()) {
            this.logger.warn('RAG 服务不可用，返回空结果')
            return []
        }

        // 查询向量化
        const queryEmbedding = await this.embeddingService.embedQuery(query)
        if (queryEmbedding.length === 0) {
            this.logger.warn('查询向量化失败，返回空结果')
            return []
        }

        // 语义搜索
        return this.vectorStore.similaritySearch(queryEmbedding, options)
    }

    /**
     * 检索并格式化为 LLM 上下文
     *
     * 检索语义相关的文档分块，格式化为可直接注入 LLM Prompt 的文本。
     * 格式示例：
     *   [相关内容 1] (文档: abc123, 相似度: 0.89)
     *   这是检索到的文档内容...
     *
     * @param query - 用户查询文本
     * @param options - 搜索选项
     * @returns 格式化的上下文文本，无结果时返回提示信息
     */
    async retrieveAndFormat(query: string, options?: Partial<VectorSearchOptions>): Promise<string> {
        const results = await this.retrieve(query, options)

        if (results.length === 0) {
            return '未找到与查询语义相关的内容'
        }

        return results
            .map((r, i) => {
                const scoreStr = r.score.toFixed(2)
                const contentPreview = r.content.length > 300
                    ? r.content.slice(0, 300) + '...'
                    : r.content
                return `[相关内容 ${i + 1}] (文档: ${r.pageId}, 相似度: ${scoreStr})\n${contentPreview}`
            })
            .join('\n\n')
    }

    /**
     * 列出指定文档的分块（非语义搜索）
     *
     * 直接按 chunkIndex 排序查询分块，不需要向量化。
     * 用于需要列出/遍历分块的场景（如获取文档结构、分块列表），
     * 而非语义搜索场景。
     *
     * @param pageId - 文档 pageId
     * @param limit - 每页数量
     * @param offset - 偏移量
     * @returns 分块列表和总数，score 固定为 1（非相似度匹配）
     */
    async listChunks(pageId: string, limit: number, offset: number): Promise<{ items: VectorSearchResult[]; total: number }> {
        if (!this.vectorSetup.getIsReady()) {
            return { items: [], total: 0 }
        }
        const result = await this.chunkRepo.listChunksByPageId(pageId, limit, offset)
        return {
            items: result.items.map((row: any) => ({
                chunkId: row.id,
                pageId: row.pageId,
                blockId: row.blockId,
                content: row.content,
                score: 1,
                chunkIndex: row.chunkIndex,
            })),
            total: result.total,
        }
    }

    /**
     * 获取分块及其上下文（前后相邻分块）
     *
     * 直接按 chunkIndex 查询目标分块及其前后文，不需要向量化。
     * 用于查看分块详情时了解其上下文环境。
     *
     * @param chunkId - 目标分块 ID
     * @param contextBlocks - 前后各取的上下文分块数量
     */
    async getChunkWithContext(chunkId: number, contextBlocks: number): Promise<{
        chunk: VectorSearchResult
        before: VectorSearchResult[]
        after: VectorSearchResult[]
    }> {
        const result = await this.chunkRepo.getChunkWithContext(chunkId, contextBlocks)
        const mapRow = (row: any): VectorSearchResult => ({
            chunkId: row.id,
            pageId: row.pageId,
            blockId: row.blockId,
            content: row.content,
            score: 1,
            chunkIndex: row.chunkIndex,
        })
        return {
            chunk: mapRow(result.chunk),
            before: result.before.map(mapRow),
            after: result.after.map(mapRow),
        }
    }

    /**
     * 检查 RAG 服务是否可用
     *
     * @returns true 表示 Embedding 服务和 pgvector 均已就绪
     */
    isAvailable(): boolean {
        return this.embeddingService.isAvailable() && this.vectorSetup.getIsReady()
    }

    /**
     * 获取指定文档的索引状态
     *
     * 返回文档的分块统计信息，包括是否已索引、总/已嵌入/未嵌入分块数。
     * pgvector 未就绪时返回默认空状态。
     *
     * @param pageId - 文档 pageId
     */
    async getIndexStatus(pageId: string): Promise<KnowledgeIndexStatus> {
        if (!this.vectorSetup.getIsReady()) {
            return { isIndexed: false, totalChunks: 0, embeddedChunks: 0, unembeddedChunks: 0, lastIndexedAt: null }
        }
        const stats = await this.chunkRepo.getChunkStatsByPageId(pageId)
        return {
            isIndexed: stats.total > 0,
            totalChunks: stats.total,
            embeddedChunks: stats.embedded,
            unembeddedChunks: stats.unembedded,
            lastIndexedAt: stats.lastIndexedAt,
        }
    }

    /**
     * 获取用户的索引统计信息
     *
     * 返回用户关联的已索引文档数、总分块数和已嵌入分块数。
     * pgvector 未就绪时返回默认空状态。
     *
     * @param userId - 用户 ID
     */
    async getUserIndexStats(userId: number): Promise<{ indexedPageCount: number; totalChunks: number; embeddedChunks: number }> {
        if (!this.vectorSetup.getIsReady()) {
            return { indexedPageCount: 0, totalChunks: 0, embeddedChunks: 0 }
        }
        const stats = await this.chunkRepo.getUserChunkStats(userId)
        return {
            indexedPageCount: stats.indexedPageIds.length,
            totalChunks: stats.totalChunks,
            embeddedChunks: stats.embeddedChunks,
        }
    }

    /**
     * 清除指定文档的索引数据
     *
     * 删除指定 pageId 关联的所有分块和向量数据。
     * pgvector 未就绪时直接返回成功。
     *
     * @param pageId - 文档页面 ID
     */
    async clearPageIndex(pageId: string): Promise<{ success: boolean }> {
        if (!this.vectorSetup.getIsReady()) {
            this.logger.warn('pgvector 未就绪，跳过清除索引')
            return { success: true }
        }
        try {
            await this.vectorStore.deleteByPageId(pageId)
            this.logger.log(`已清除文档 ${pageId} 的索引数据`)
            return { success: true }
        } catch (error) {
            this.logger.error(`清除文档 ${pageId} 索引失败:`, error)
            return { success: false }
        }
    }

    /**
     * 批量补齐未嵌入的分块
     *
     * 首次启用 RAG 时，已有分块可能没有向量。
     * 此方法批量获取未嵌入的分块，生成向量并更新。
     *
     * @param limit - 单次处理的分块数量上限
     * @returns 成功嵌入的分块数量
     */
    async backfillEmbeddings(limit: number = 100): Promise<number> {
        if (!this.embeddingService.isAvailable() || !this.vectorSetup.getIsReady()) {
            return 0
        }

        const chunks = await this.vectorStore.getUnembeddedChunks(limit)
        if (chunks.length === 0) {
            return 0
        }

        const texts = chunks.map(c => c.content)
        const embeddings = await this.embeddingService.embedDocuments(texts)

        if (embeddings.length === 0) {
            return 0
        }

        // 逐条更新向量
        let successCount = 0
        for (let i = 0; i < chunks.length; i++) {
            try {
                if (chunks[i].id != null) {
                    await this.vectorStore.updateEmbedding(chunks[i].id!, embeddings[i])
                    successCount++
                }
            } catch {
                // 单条更新失败不影响其他
            }
        }

        this.logger.log(`批量补齐完成: ${successCount}/${chunks.length}`)
        return successCount
    }
}
