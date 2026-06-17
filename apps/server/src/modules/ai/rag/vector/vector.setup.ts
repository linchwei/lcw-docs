/**
 * pgvector 扩展初始化服务
 *
 * 在 PostgreSQL 中启用 pgvector 扩展，并为 document_chunks 表添加
 * vector 类型的 embedding 列和 HNSW 索引。
 *
 * 初始化流程：
 *   1. 检测 pgvector 扩展是否已安装，未安装则执行 CREATE EXTENSION
 *   2. 检测 embedding 列是否存在，不存在则通过 ALTER TABLE 添加
 *   3. 检测 HNSW 索引是否存在，不存在则创建
 *
 * 降级策略：
 *   - 如果 pgvector 扩展不可用（PostgreSQL 未安装 pgvector 插件），
 *     isReady 为 false，RAG 功能降级为关键词搜索
 *   - 不阻塞服务启动，只记录警告日志
 *
 * @module rag/vector/vector-setup
 */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { DataSource } from 'typeorm'

import { PROVIDER_DEFAULTS, EmbeddingProvider } from '../embedding/embedding.types'
import { DocumentChunkRepository } from './document-chunk.repository'

/** 常量集中管理，与数据库保持同步 */
const TABLE_NAME = 'document_chunks'
const INDEX_NAME = 'document_chunks_embedding_idx'
const COLUMN_NAME = 'embedding'

@Injectable()
export class VectorSetupService implements OnModuleInit {
    private readonly logger = new Logger(VectorSetupService.name)

    /** pgvector 是否就绪，false 时 RAG 功能降级为关键词搜索 */
    private isReady = false

    /** 向量维度（从 Embedding 配置读取） */
    private dimensions: number

    constructor(
        private dataSource: DataSource,
        private configService: ConfigService,
    ) {
        const provider = (this.configService.get<string>('EMBEDDING_PROVIDER') || 'dashscope') as EmbeddingProvider
        const providerDefaults = PROVIDER_DEFAULTS[provider] || PROVIDER_DEFAULTS.dashscope
        this.dimensions = this.configService.get<number>('EMBEDDING_DIMENSIONS', providerDefaults.dimensions)
    }

    /**
     * 模块初始化时执行 pgvector 设置
     *
     * 依次执行：启用扩展 → 添加 embedding 列 → 创建 HNSW 索引
     * 任何步骤失败都不阻塞启动，只将 isReady 置为 false
     */
    async onModuleInit() {
        try {
            await this.enablePgvectorExtension()
            await this.addEmbeddingColumn()
            await this.createHnswIndex()
            this.isReady = true
            this.logger.log('pgvector 初始化完成，RAG 语义搜索已就绪')
        } catch (error) {
            this.logger.warn(
                `pgvector 初始化失败，RAG 功能将降级为关键词搜索: ${error instanceof Error ? error.message : error}`,
            )
            this.isReady = false
        }
    }

    /**
     * 获取 pgvector 就绪状态
     *
     * @returns true 表示向量搜索可用，false 表示应降级为关键词搜索
     */
    getIsReady(): boolean {
        return this.isReady
    }

    /**
     * 启用 pgvector 扩展
     *
     * 执行 SQL: CREATE EXTENSION IF NOT EXISTS vector
     * 需要 PostgreSQL超级用户权限或预安装 pgvector 插件
     */
    private async enablePgvectorExtension() {
        await this.dataSource.query('CREATE EXTENSION IF NOT EXISTS vector')
        this.logger.log('pgvector 扩展已启用')
    }

    /**
     * 为 document_chunks 表添加 embedding 列
     *
     * 使用 ALTER TABLE 添加 vector(1536) 类型的列，
     * 因为 TypeORM 不原生支持 vector 列类型，无法通过实体定义自动创建。
     *
     * 如果列已存在则跳过（通过检查 information_schema 判断）
     */
    private async addEmbeddingColumn() {
        // 检查 embedding 列是否已存在
        const result = await this.dataSource.query(
            `SELECT column_name FROM information_schema.columns
             WHERE table_name = $1 AND column_name = $2`,
            [TABLE_NAME, COLUMN_NAME],
        )

        if (result.length > 0) {
            this.logger.log('embedding 列已存在，跳过创建')
            return
        }

        // 白名单校验：确保 dimensions 是合法数字
        DocumentChunkRepository.validateDimensions(this.dimensions)

        // 添加 embedding 列：维度根据 Embedding 提供商配置决定
        await this.dataSource.query(
            `ALTER TABLE ${TABLE_NAME} ADD COLUMN ${COLUMN_NAME} vector(${this.dimensions})`,
        )
        this.logger.log(`embedding 列已创建 (vector(${this.dimensions}))`)
    }

    /**
     * 创建 HNSW 索引
     *
     * HNSW（Hierarchical Navigable Small World）是 pgvector 推荐的近似最近邻索引，
     * 适合高召回率场景，查询性能远优于精确搜索。
     *
     * 索引参数说明：
     *   - m = 16: 每个节点的最大连接数，影响索引大小和召回率
     *   - ef_construction = 64: 构建索引时的搜索宽度，越大构建越慢但索引质量越高
     *
     * 查询时可通过 SET hnsw.ef_search = 40 控制搜索精度和速度的平衡
     */
    private async createHnswIndex() {
        // 检查索引是否已存在
        const result = await this.dataSource.query(
            `SELECT indexname FROM pg_indexes
             WHERE tablename = $1 AND indexname = $2`,
            [TABLE_NAME, INDEX_NAME],
        )

        if (result.length > 0) {
            this.logger.log('HNSW 索引已存在，跳过创建')
            return
        }

        await this.dataSource.query(
            `CREATE INDEX ${INDEX_NAME} ON ${TABLE_NAME}
             USING hnsw (${COLUMN_NAME} vector_cosine_ops)
             WITH (m = 16, ef_construction = 64)`,
        )
        this.logger.log('HNSW 索引已创建')
    }
}
