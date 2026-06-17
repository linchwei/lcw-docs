/**
 * 文档分块专用 Repository
 *
 * 封装 pgvector 相关的原始 SQL 操作，提供类型安全的专用方法。
 * 集中管理列名常量，与 DocumentChunkEntity 定义保持同步。
 *
 * 为什么使用原始 SQL：
 *   - pgvector 的 vector 列类型和 <=> 操作符不被 TypeORM 原生支持
 *   - 批量 INSERT 使用多行 VALUES 提升写入效率
 *   - 语义搜索需要 pgvector 专有的余弦距离计算
 *
 * 安全措施：
 *   - 所有用户输入通过参数化查询（$1, $2 占位符）传递
 *   - 列名使用常量管理，避免硬编码分散
 *   - dimensions 参数添加白名单校验
 *
 * @module rag/vector/repository
 */
import { Injectable, Logger } from '@nestjs/common'
import { DataSource } from 'typeorm'

/** 列名常量，与 DocumentChunkEntity 和数据库列名保持同步 */
const COL = {
    id: 'id',
    pageId: '"pageId"',
    blockId: '"blockId"',
    content: 'content',
    chunkIndex: '"chunkIndex"',
    startOffset: '"startOffset"',
    endOffset: '"endOffset"',
    embedding: 'embedding',
} as const

/** 表名常量 */
const TABLE = 'document_chunks'

/** 允许的向量维度范围 */
const MIN_DIMENSIONS = 1
const MAX_DIMENSIONS = 4096

export interface ChunkInsertData {
    pageId: string
    blockId: string
    content: string
    chunkIndex: number
    startOffset: number
    endOffset: number
    embedding: string
}

@Injectable()
export class DocumentChunkRepository {
    private readonly logger = new Logger(DocumentChunkRepository.name)

    constructor(private readonly dataSource: DataSource) {}

    /**
     * 批量插入文档分块及嵌入向量
     *
     * 使用多行 VALUES 减少数据库交互次数，参数化查询防止 SQL 注入。
     *
     * @param chunks - 分块数据数组（embedding 为向量字符串，如 "[0.1,0.2,...]"）
     */
    async batchInsert(chunks: ChunkInsertData[]): Promise<void> {
        if (chunks.length === 0) return

        const BATCH_SIZE = 50
        for (let batch = 0; batch < chunks.length; batch += BATCH_SIZE) {
            const batchChunks = chunks.slice(batch, batch + BATCH_SIZE)

            const values: any[] = []
            const placeholders: string[] = []

            for (let i = 0; i < batchChunks.length; i++) {
                const chunk = batchChunks[i]
                const base = i * 7
                placeholders.push(
                    `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}::vector)`,
                )
                values.push(chunk.pageId, chunk.blockId, chunk.content, chunk.chunkIndex, chunk.startOffset, chunk.endOffset, chunk.embedding)
            }

            await this.dataSource.query(
                `INSERT INTO ${TABLE} (${COL.pageId}, ${COL.blockId}, ${COL.content}, ${COL.chunkIndex}, ${COL.startOffset}, ${COL.endOffset}, ${COL.embedding})
                 VALUES ${placeholders.join(', ')}`,
                values,
            )
        }
    }

    /**
     * 设置 HNSW 搜索精度参数
     *
     * 必须在事务内调用，SET LOCAL 仅对当前事务生效。
     *
     * @param ef - 搜索精度值，越大越精确但越慢
     */
    async setHnswEfSearch(ef: number): Promise<void> {
        await this.dataSource.query('SET LOCAL hnsw.ef_search = $1', [ef])
    }

    /**
     * 基于余弦相似度的语义搜索
     *
     * 使用 pgvector 的 <=> 操作符计算余弦距离，
     * 通过 HNSW 索引加速近似最近邻搜索。
     *
     * @param vectorStr - 查询向量字符串，如 "[0.1,0.2,...]"
     * @param pageId - 限定搜索范围到特定文档，null 则搜索所有
     * @param minScore - 最低相似度阈值 (0-1)
     * @param topK - 返回结果数量上限
     */
    async similaritySearch(vectorStr: string, pageId: string | null, minScore: number, topK: number): Promise<any[]> {
        const sql = `
            SELECT ${COL.id}, ${COL.pageId}, ${COL.blockId}, ${COL.content}, ${COL.chunkIndex},
                   1 - (${COL.embedding} <=> $1::vector) AS score
            FROM ${TABLE}
            WHERE ${COL.embedding} IS NOT NULL
              AND ($2::varchar IS NULL OR ${COL.pageId} = $2)
              AND 1 - (${COL.embedding} <=> $1::vector) >= $3
            ORDER BY ${COL.embedding} <=> $1::vector
            LIMIT $4
        `

        return this.dataSource.query(sql, [vectorStr, pageId, minScore, topK])
    }

    /**
     * 按 pageId 删除文档的所有分块
     *
     * @param pageId - 文档 pageId
     */
    async deleteByPageId(pageId: string): Promise<void> {
        await this.dataSource.query(
            `DELETE FROM ${TABLE} WHERE ${COL.pageId} = $1`,
            [pageId],
        )
    }

    /**
     * 获取未生成嵌入向量的分块
     *
     * 用于批量补齐：首次启用 RAG 时，已有分块可能没有向量。
     *
     * @param limit - 最大返回数量
     */
    async findUnembedded(limit: number): Promise<any[]> {
        return this.dataSource.query(
            `SELECT ${COL.id}, ${COL.pageId}, ${COL.blockId}, ${COL.content}, ${COL.chunkIndex}, ${COL.startOffset}, ${COL.endOffset}
             FROM ${TABLE}
             WHERE ${COL.embedding} IS NULL
             ORDER BY ${COL.id}
             LIMIT $1`,
            [limit],
        )
    }

    /**
     * 更新单个分块的嵌入向量
     *
     * @param chunkId - 分块 ID
     * @param vectorStr - 向量字符串，如 "[0.1,0.2,...]"
     */
    async updateEmbedding(chunkId: number, vectorStr: string): Promise<void> {
        await this.dataSource.query(
            `UPDATE ${TABLE} SET ${COL.embedding} = $1::vector WHERE ${COL.id} = $2`,
            [vectorStr, chunkId],
        )
    }

    /**
     * 校验向量维度是否合法
     *
     * @param dimensions - 向量维度
     * @throws Error 如果维度不合法
     */
    static validateDimensions(dimensions: number): void {
        if (!Number.isInteger(dimensions) || dimensions < MIN_DIMENSIONS || dimensions > MAX_DIMENSIONS) {
            throw new Error(`Invalid embedding dimensions: ${dimensions}. Must be integer between ${MIN_DIMENSIONS} and ${MAX_DIMENSIONS}.`)
        }
    }
}
