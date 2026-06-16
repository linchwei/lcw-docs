/**
 * 文档分块类型定义
 *
 * 定义文档分块的数据结构和配置类型。
 * 分块是 RAG 流水线的第一步：将长文档拆分为适合 Embedding 的语义单元。
 *
 * @module rag/chunker/types
 */

/** 文档分块数据结构 */
export interface DocumentChunk {
    /** 数据库行 ID（从数据库查询时才有值） */
    id?: number
    /** 分块所属文档的 pageId */
    pageId: string
    /** 来源 block ID，用于定位分块在文档中的位置 */
    blockId: string
    /** 分块文本内容 */
    content: string
    /** 分块序号（同一文档内从 0 开始递增） */
    chunkIndex: number
    /** 分块在原文中的起始字符偏移 */
    startOffset: number
    /** 分块在原文中的结束字符偏移 */
    endOffset: number
}

/** 分块配置参数 */
export interface ChunkingConfig {
    /** 最大分块大小（字符数），超过此大小的 block 会被进一步拆分 */
    maxChunkSize: number
    /** 重叠大小（字符数），拆分时相邻 chunk 保留的重叠区域，防止边界信息丢失 */
    overlapSize: number
    /** 最小分块大小（字符数），短于此大小的相邻 block 会被合并 */
    minChunkSize: number
}

/** 默认分块配置 */
export const DEFAULT_CHUNKING_CONFIG: ChunkingConfig = {
    maxChunkSize: 500,
    overlapSize: 50,
    minChunkSize: 50,
}
