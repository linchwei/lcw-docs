/**
 * pgvector 向量存储服务
 *
 * 基于 PostgreSQL pgvector 扩展实现向量存储和相似度搜索。
 * 所有向量相关的数据库操作通过 DocumentChunkRepository 完成，
 * 原始 SQL 已封装在 Repository 层，本服务只负责业务逻辑编排。
 *
 * 核心方法：
 *   - storeChunks(): 批量存储文档分块及其嵌入向量
 *   - similaritySearch(): 基于余弦相似度的语义搜索
 *   - deleteByPageId(): 删除文档的所有分块
 *   - getUnembeddedChunks(): 获取未生成向量的分块（用于批量补齐）
 *
 * @module rag/vector/store
 */
import { Injectable, Logger } from '@nestjs/common'

import { DocumentChunk } from '../chunker/chunker.types'
import { DocumentChunkRepository } from './document-chunk.repository'
import { VectorSetupService } from './vector.setup'
import { DEFAULT_SEARCH_OPTIONS, VectorSearchOptions, VectorSearchResult } from './vector.types'

@Injectable()
export class VectorStore {
    private readonly logger = new Logger(VectorStore.name)

    constructor(
        private chunkRepo: DocumentChunkRepository,
        private vectorSetup: VectorSetupService
    ) {}

    /**
     * 批量存储文档分块及其嵌入向量
     *
     * 将分块内容和对应的嵌入向量一起写入 document_chunks 表。
     * 使用参数化查询防止 SQL 注入，批量 INSERT 提升写入效率。
     *
     * @param chunks - 文档分块数组
     * @param embeddings - 与 chunks 一一对应的嵌入向量数组
     */
    async storeChunks(chunks: DocumentChunk[], embeddings: number[][]): Promise<void> {
        if (chunks.length === 0 || chunks.length !== embeddings.length) {
            this.logger.warn('分块和向量数量不匹配或为空，跳过存储')
            return
        }

        const insertData = chunks.map((chunk, i) => ({
            pageId: chunk.pageId,
            blockId: chunk.blockId,
            content: chunk.content,
            chunkIndex: chunk.chunkIndex,
            startOffset: chunk.startOffset,
            endOffset: chunk.endOffset,
            embedding: `[${embeddings[i].join(',')}]`,
        }))

        await this.chunkRepo.batchInsert(insertData)

        this.logger.log(`存储了 ${chunks.length} 个分块 (文档: ${chunks[0]?.pageId})`)
    }

    /**
     * 语义相似度搜索
     *
     * 在 pgvector 中搜索余弦相似度最高的文档分块。
     * 使用 HNSW 索引加速搜索，查询时设置 ef_search 控制精度。
     *
     * @param queryEmbedding - 查询文本的嵌入向量
     * @param options - 搜索选项（topK、minScore、pageId 过滤）
     * @returns 按相似度降序排列的搜索结果
     */
    async similaritySearch(queryEmbedding: number[], options?: Partial<VectorSearchOptions>): Promise<VectorSearchResult[]> {
        if (!this.vectorSetup.getIsReady()) {
            this.logger.warn('pgvector 未就绪，无法执行语义搜索')
            return []
        }

        if (!queryEmbedding || queryEmbedding.length === 0) {
            return []
        }

        const opts = { ...DEFAULT_SEARCH_OPTIONS, ...options }
        const vectorStr = `[${queryEmbedding.join(',')}]`

        // 设置 HNSW 搜索精度参数
        await this.chunkRepo.setHnswEfSearch(40)

        // 余弦相似度搜索
        const results = await this.chunkRepo.similaritySearch(vectorStr, opts.pageId || null, opts.minScore, opts.topK)

        return results.map((row: any) => ({
            chunkId: row.id,
            pageId: row.pageId,
            blockId: row.blockId,
            content: row.content,
            score: parseFloat(row.score),
            chunkIndex: row.chunkIndex,
        }))
    }

    /**
     * 删除文档的所有分块
     *
     * 在文档重新索引前调用，先删除旧分块再写入新分块。
     *
     * @param pageId - 文档 pageId
     */
    async deleteByPageId(pageId: string): Promise<void> {
        await this.chunkRepo.deleteByPageId(pageId)
        this.logger.log(`已删除文档 ${pageId} 的所有分块`)
    }

    /**
     * 获取未生成嵌入向量的分块
     *
     * 用于批量补齐：首次启用 RAG 时，已有分块可能没有向量。
     *
     * @param limit - 最大返回数量
     * @returns 未嵌入的分块数组
     */
    async getUnembeddedChunks(limit: number = 100): Promise<DocumentChunk[]> {
        const results = await this.chunkRepo.findUnembedded(limit)

        return results.map((row: any) => ({
            id: row.id,
            pageId: row.pageId,
            blockId: row.blockId,
            content: row.content,
            chunkIndex: row.chunkIndex,
            startOffset: row.startOffset,
            endOffset: row.endOffset,
        }))
    }

    /**
     * 更新单个分块的嵌入向量
     *
     * @param chunkId - 分块 ID
     * @param embedding - 嵌入向量
     */
    async updateEmbedding(chunkId: number, embedding: number[]): Promise<void> {
        const vectorStr = `[${embedding.join(',')}]`
        await this.chunkRepo.updateEmbedding(chunkId, vectorStr)
    }
}
