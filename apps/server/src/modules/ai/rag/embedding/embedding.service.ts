/**
 * Embedding 生成服务
 *
 * 将文本转换为向量表示，用于语义搜索。
 * 支持两种提供商（均兼容 OpenAI API 格式）：
 *   - 阿里云百炼（DashScope）：默认，中文效果最佳，价格极低
 *   - OpenAI：海外场景
 *
 * 核心方法：
 *   - embedQuery(): 将用户查询转换为向量（单条）
 *   - embedDocuments(): 将文档分块批量转换为向量（批量）
 *
 * 配置方式（.env）：
 *   EMBEDDING_PROVIDER=dashscope     # 提供商：dashscope 或 openai
 *   EMBEDDING_API_KEY=sk-xxx         # 对应提供商的 API Key
 *   EMBEDDING_MODEL=text-embedding-v3 # 模型名称
 *   EMBEDDING_DIMENSIONS=1024        # 向量维度
 *
 * 降级策略：
 *   - API Key 未配置 → embedQuery/embedDocuments 返回空数组
 *   - 调用方应检查返回值长度，为空时降级为关键词搜索
 *
 * @module rag/embedding/service
 */
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { OpenAIEmbeddings } from '@langchain/openai'

import { DEFAULT_EMBEDDING_CONFIG, EmbeddingConfig, EmbeddingProvider, PROVIDER_DEFAULTS } from './embedding.types'

@Injectable()
export class EmbeddingService {
    private readonly logger = new Logger(EmbeddingService.name)

    /** LangChain OpenAIEmbeddings 实例 */
    private embeddings: OpenAIEmbeddings | null = null

    /** 当前配置 */
    private config: EmbeddingConfig

    constructor(private configService: ConfigService) {
        const provider = (this.configService.get<string>('EMBEDDING_PROVIDER') || 'dashscope') as EmbeddingProvider
        const providerDefaults = PROVIDER_DEFAULTS[provider] || PROVIDER_DEFAULTS.dashscope

        this.config = {
            provider,
            model: this.configService.get<string>('EMBEDDING_MODEL', providerDefaults.model),
            dimensions: this.configService.get<number>('EMBEDDING_DIMENSIONS', providerDefaults.dimensions),
            batchSize: DEFAULT_EMBEDDING_CONFIG.batchSize,
            baseURL: providerDefaults.baseURL,
        }

        this.initEmbeddings()
    }

    /**
     * 初始化 OpenAIEmbeddings 实例
     *
     * 根据提供商配置 baseURL：
     *   - dashscope → https://dashscope.aliyuncs.com/compatible-mode/v1
     *   - openai → https://api.openai.com/v1
     *
     * 优先使用 EMBEDDING_API_KEY（专用于 Embedding 的 Key），
     * 未配置时回退到 OPENAI_API_KEY（与 LLM 共享）。
     */
    private initEmbeddings() {
        const apiKey = this.configService.get<string>('EMBEDDING_API_KEY')
            || this.configService.get<string>('OPENAI_API_KEY')

        if (!apiKey) {
            this.logger.warn('EMBEDDING_API_KEY 和 OPENAI_API_KEY 均未配置，Embedding 服务不可用')
            return
        }

        this.embeddings = new OpenAIEmbeddings({
            model: this.config.model,
            openAIApiKey: apiKey,
            dimensions: this.config.dimensions,
            configuration: {
                baseURL: this.config.baseURL,
            },
        })

        this.logger.log(
            `Embedding 服务已初始化 (提供商: ${this.config.provider}, 模型: ${this.config.model}, 维度: ${this.config.dimensions}, 端点: ${this.config.baseURL})`,
        )
    }

    /**
     * 将查询文本转换为向量
     *
     * 用于语义搜索时将用户查询向量化。
     *
     * @param query - 用户查询文本
     * @returns 嵌入向量，服务不可用时返回空数组
     */
    async embedQuery(query: string): Promise<number[]> {
        if (!this.embeddings) {
            this.logger.warn('Embedding 服务不可用，返回空向量')
            return []
        }

        try {
            return await this.embeddings.embedQuery(query)
        } catch (error) {
            this.logger.error(`查询嵌入失败: ${error instanceof Error ? error.message : error}`)
            return []
        }
    }

    /**
     * 批量将文档文本转换为向量
     *
     * 用于文档索引时批量生成分块的嵌入向量。
     * 内部按 batchSize 分批调用 API，避免超过速率限制。
     *
     * 注意：阿里云百炼单次最多 10 条，OpenAI 单次最多 2048 条。
     *
     * @param texts - 待嵌入的文本数组
     * @returns 嵌入向量数组，与输入文本一一对应；服务不可用时返回空数组
     */
    async embedDocuments(texts: string[]): Promise<number[][]> {
        if (!this.embeddings || texts.length === 0) {
            this.logger.warn('Embedding 服务不可用或输入为空，返回空向量数组')
            return []
        }

        try {
            const allEmbeddings: number[][] = []

            for (let i = 0; i < texts.length; i += this.config.batchSize) {
                const batch = texts.slice(i, i + this.config.batchSize)
                const batchEmbeddings = await this.embeddings.embedDocuments(batch)
                allEmbeddings.push(...batchEmbeddings)
            }

            return allEmbeddings
        } catch (error) {
            this.logger.error(`文档嵌入失败: ${error instanceof Error ? error.message : error}`)
            return []
        }
    }

    /**
     * 检查 Embedding 服务是否可用
     *
     * @returns true 表示 API Key 已配置且服务可用
     */
    isAvailable(): boolean {
        return this.embeddings !== null
    }
}
