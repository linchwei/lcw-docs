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

@Injectable()
export class RagService {
    private readonly logger = new Logger(RagService.name)

    constructor(
        private chunker: DocumentChunker,
        private embeddingService: EmbeddingService,
        private vectorStore: VectorStore,
        private vectorSetup: VectorSetupService,
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
     * 检查 RAG 服务是否可用
     *
     * @returns true 表示 Embedding 服务和 pgvector 均已就绪
     */
    isAvailable(): boolean {
        return this.embeddingService.isAvailable() && this.vectorSetup.getIsReady()
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
