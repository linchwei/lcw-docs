/**
 * Embedding 类型定义
 *
 * 定义 Embedding 服务的配置和返回值类型。
 *
 * 支持两种 Embedding 提供商（均兼容 OpenAI API 格式）：
 *   1. 阿里云百炼（DashScope）：默认推荐，中文效果最佳
 *      - 端点: https://dashscope.aliyuncs.com/compatible-mode/v1
 *      - 模型: text-embedding-v4 (Qwen3-Embedding)
 *      - 维度: 1024（默认）/ 1536 / 2048
 *   2. OpenAI：海外场景
 *      - 端点: https://api.openai.com/v1（默认）
 *      - 模型: text-embedding-3-small
 *      - 维度: 1536
 *
 * @module rag/embedding/types
 */

/** Embedding 提供商类型 */
export type EmbeddingProvider = 'dashscope' | 'openai'

/** Embedding 模型配置 */
export interface EmbeddingConfig {
    /** 提供商：dashscope（阿里云百炼，默认）或 openai */
    provider: EmbeddingProvider
    /** 模型名称 */
    model: string
    /** 向量维度 */
    dimensions: number
    /** 批量嵌入大小，API 限制单次最多条数 */
    batchSize: number
    /** API 端点 baseURL（根据 provider 自动设置） */
    baseURL: string
}

/** 单条 Embedding 结果 */
export interface EmbeddingResult {
    /** 原始文本 */
    text: string
    /** 嵌入向量 */
    embedding: number[]
    /** 消耗的 token 数 */
    tokenCount: number
}

/** 各提供商的默认配置 */
export const PROVIDER_DEFAULTS: Record<EmbeddingProvider, Omit<EmbeddingConfig, 'provider' | 'batchSize'>> = {
    dashscope: {
        model: 'text-embedding-v3',
        dimensions: 1024,
        baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    },
    openai: {
        model: 'text-embedding-3-small',
        dimensions: 1536,
        baseURL: 'https://api.openai.com/v1',
    },
}

/** 默认 Embedding 配置（阿里云百炼） */
export const DEFAULT_EMBEDDING_CONFIG: EmbeddingConfig = {
    provider: 'dashscope',
    ...PROVIDER_DEFAULTS.dashscope,
    batchSize: 10,
}
