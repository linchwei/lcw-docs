/**
 * RAG 模块定义
 *
 * 注册 RAG（检索增强生成）子模块的所有 providers。
 *
 * Providers：
 *   - VectorSetupService: pgvector 扩展初始化（启用扩展、添加 embedding 列、创建索引）
 *   - EmbeddingService: 文本向量化服务（OpenAI Embedding API）
 *   - DocumentChunker: 文档分块器（将文档拆分为语义单元）
 *   - VectorStore: 向量存储服务（pgvector 读写操作）
 *   - RagService: RAG 核心服务（索引 + 检索编排）
 *
 * Exports：
 *   - RagService: 供 AI 模块调用 RAG 功能
 *   - EmbeddingService: 供其他模块使用嵌入能力
 *
 * 依赖：
 *   - ConfigModule: 读取环境变量
 *   - TypeOrmModule: 数据库连接（DataSource）
 *
 * @module rag/module
 */
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'

import { DocumentChunkEntity } from '../../../entities/document-chunk.entity'
import { SystemConfigModule } from '../../system-config/system-config.module'
import { DocumentChunker } from './chunker/document.chunker'
import { EmbeddingService } from './embedding/embedding.service'
import { RagService } from './rag.service'
import { DocumentChunkRepository } from './vector/document-chunk.repository'
import { VectorSetupService } from './vector/vector.setup'
import { VectorStore } from './vector/vector.store'

@Module({
    imports: [ConfigModule, SystemConfigModule, TypeOrmModule.forFeature([DocumentChunkEntity])],
    providers: [DocumentChunkRepository, VectorSetupService, EmbeddingService, DocumentChunker, VectorStore, RagService],
    exports: [RagService, EmbeddingService],
})
export class RagModule {}
