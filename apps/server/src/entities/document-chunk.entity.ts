/**
 * 文档分块实体
 *
 * 用于 RAG（检索增强生成）的文档分块存储。
 * 将文档按语义单元拆分为多个 chunk，每个 chunk 生成 Embedding 向量，
 * 支持基于 pgvector 的语义相似度搜索。
 *
 * 数据流：
 *   文档内容 → DocumentChunker 分块 → EmbeddingService 生成向量 → VectorStore 存储
 *   用户查询 → EmbeddingService 生成查询向量 → VectorStore 相似度检索 → LLM 上下文注入
 *
 * 注意：
 *   embedding 列（vector 类型）由 VectorSetupService 通过原始 SQL 添加，
 *   因为 TypeORM 不原生支持 pgvector 的 vector 列类型。
 *   向量相关的读写操作均通过 VectorStore 使用原始 SQL 完成。
 *
 * @module entities/document-chunk
 */
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity({
    name: 'document_chunks',
})
export class DocumentChunkEntity {
    constructor(partial: Partial<DocumentChunkEntity>) {
        Object.assign(this, partial)
    }

    @PrimaryGeneratedColumn()
    id: number

    /** 关联 PageEntity.pageId，标识分块所属文档 */
    @Column({ type: 'varchar', length: 80 })
    pageId: string

    /** 来源 block ID，用于定位分块在文档中的位置 */
    @Column({ type: 'varchar', length: 80 })
    blockId: string

    /** 分块文本内容 */
    @Column({ type: 'text' })
    content: string

    /** 分块序号，同一 block 可能被拆分为多个 chunk，按序号排列 */
    @Column({ type: 'int', default: 0 })
    chunkIndex: number

    /** 分块在原文中的起始字符偏移 */
    @Column({ type: 'int', default: 0 })
    startOffset: number

    /** 分块在原文中的结束字符偏移 */
    @Column({ type: 'int', default: 0 })
    endOffset: number

    /**
     * Embedding 向量（1536 维，OpenAI text-embedding-3-small）
     *
     * 此列由 VectorSetupService 通过原始 SQL 创建：
     *   ALTER TABLE document_chunks ADD COLUMN embedding vector(1536);
     *
     * TypeORM 不原生支持 vector 列类型，因此此处不使用 @Column 装饰器。
     * 向量的读写操作通过 VectorStore 使用原始 SQL 完成。
     */
    embedding?: number[] | null

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date
}
