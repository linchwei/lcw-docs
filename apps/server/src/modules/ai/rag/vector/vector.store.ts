/**
 * pgvector 向量存储服务
 *
 * 基于 PostgreSQL pgvector 扩展实现向量存储和相似度搜索。
 * 所有向量相关的数据库操作均通过原始 SQL 完成，
 * 因为 TypeORM 不原生支持 pgvector 的 vector 列类型。
 *
 * 注意：TypeORM 默认使用 camelCase 列名（pageId, blockId 等），
 * 原始 SQL 中的列名必须与数据库实际列名一致。
 *
 * 核心方法：
 *   - storeChunks(): 批量存储文档分块及其嵌入向量
 *   - similaritySearch(): 基于余弦相似度的语义搜索
 *   - deleteByPageId(): 删除文档的所有分块
 *   - getUnembeddedChunks(): 获取未生成向量的分块（用于批量补齐）
 *
 * SQL 说明：
 *   - embedding <=> $1: pgvector 余弦距离操作符，值越小越相似
 *   - 1 - (embedding <=> $1): 转换为相似度分数，0-1 之间，越大越相似
 *   - HNSW 索引加速近似最近邻搜索
 *
 * @module rag/vector/store
 */
import { Injectable, Logger } from '@nestjs/common'
import { DataSource } from 'typeorm'

import { DocumentChunk } from '../chunker/chunker.types'
import { VectorSearchResult, VectorSearchOptions, DEFAULT_SEARCH_OPTIONS } from './vector.types'
import { VectorSetupService } from './vector.setup'

@Injectable()
export class VectorStore {
    private readonly logger = new Logger(VectorStore.name)

    constructor(
        private dataSource: DataSource,
        private vectorSetup: VectorSetupService,
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

        // 批量插入，使用多行 VALUES 减少数据库交互次数
        const BATCH_SIZE = 50
        for (let batch = 0; batch < chunks.length; batch += BATCH_SIZE) {
            const batchChunks = chunks.slice(batch, batch + BATCH_SIZE)
            const batchEmbeddings = embeddings.slice(batch, batch + BATCH_SIZE)

            const values: any[] = []
            const placeholders: string[] = []

            for (let i = 0; i < batchChunks.length; i++) {
                const chunk = batchChunks[i]
                const vectorStr = `[${batchEmbeddings[i].join(',')}]`
                const base = i * 7
                placeholders.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}::vector)`)
                values.push(chunk.pageId, chunk.blockId, chunk.content, chunk.chunkIndex, chunk.startOffset, chunk.endOffset, vectorStr)
            }

            await this.dataSource.query(
                `INSERT INTO document_chunks ("pageId", "blockId", content, "chunkIndex", "startOffset", "endOffset", embedding)
                 VALUES ${placeholders.join(', ')}`,
                values,
            )
        }

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
    async similaritySearch(
        queryEmbedding: number[],
        options?: Partial<VectorSearchOptions>,
    ): Promise<VectorSearchResult[]> {
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
        await this.dataSource.query('SET LOCAL hnsw.ef_search = 40')

        // 余弦相似度搜索
        // <=> 是余弦距离操作符，1 - cosine_distance 得到相似度分数
        const sql = `
            SELECT id, "pageId", "blockId", content, "chunkIndex",
                   1 - (embedding <=> $1::vector) AS score
            FROM document_chunks
            WHERE embedding IS NOT NULL
              AND ($2::varchar IS NULL OR "pageId" = $2)
              AND 1 - (embedding <=> $1::vector) >= $3
            ORDER BY embedding <=> $1::vector
            LIMIT $4
        `

        const results = await this.dataSource.query(sql, [
            vectorStr,
            opts.pageId || null,
            opts.minScore,
            opts.topK,
        ])

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
        await this.dataSource.query(
            'DELETE FROM document_chunks WHERE "pageId" = $1',
            [pageId],
        )
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
        const results = await this.dataSource.query(
            `SELECT id, "pageId", "blockId", content, "chunkIndex", "startOffset", "endOffset"
             FROM document_chunks
             WHERE embedding IS NULL
             ORDER BY id
             LIMIT $1`,
            [limit],
        )

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
        await this.dataSource.query(
            'UPDATE document_chunks SET embedding = $1::vector WHERE id = $2',
            [vectorStr, chunkId],
        )
    }
}
