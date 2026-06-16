/**
 * 向量存储类型定义
 *
 * 定义向量存储的搜索结果和搜索选项类型。
 * 向量存储使用 pgvector 扩展，基于余弦相似度进行语义检索。
 *
 * @module rag/vector/types
 */

/** 向量搜索结果 */
export interface VectorSearchResult {
    /** 分块 ID */
    chunkId: number
    /** 所属文档 pageId */
    pageId: string
    /** 来源 block ID */
    blockId: string
    /** 分块文本内容 */
    content: string
    /** 相似度分数 (0-1)，越高表示与查询越相关 */
    score: number
    /** 分块序号 */
    chunkIndex: number
}

/** 向量搜索选项 */
export interface VectorSearchOptions {
    /** 返回结果数量上限，默认 5 */
    topK: number
    /** 最低相似度阈值 (0-1)，低于此阈值的结果会被过滤，默认 0.5 */
    minScore: number
    /** 限定搜索范围到特定文档，不传则搜索所有文档 */
    pageId?: string
}

/** 默认搜索选项 */
export const DEFAULT_SEARCH_OPTIONS: VectorSearchOptions = {
    topK: 5,
    minScore: 0.5,
}
