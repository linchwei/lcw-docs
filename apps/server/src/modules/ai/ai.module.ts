/**
 * AI 模块定义
 *
 * 注册 AI 模块的所有 providers 和 controllers。
 *
 * Providers：
 * - AiService: AI Agent 编排服务（核心）
 * - LlmFactory: LLM 模型工厂（多提供商支持）
 * - PostgresCheckpointerService: 对话状态持久化服务
 * - KnowledgeBookmarkService: 知识书签管理服务
 *
 * Controllers：
 * - AiController: AI 端点（chat/summary/outline/rewrite/resume）
 *
 * Imports：
 * - ConfigModule: 配置模块
 * - RagModule: RAG 检索增强生成（语义搜索）
 * - TypeOrmModule: 知识书签实体注册
 *
 * Exports：
 * - AiService: 供其他模块调用 AI 功能
 * - LlmFactory: 供其他模块创建 LLM 实例
 *
 * @module ai/module
 */
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'

import { KnowledgeBookmarkEntity } from '../../entities/knowledge-bookmark.entity'
import { PageModule } from '../page/page.module'
import { PostgresCheckpointerService } from './checkpointer/postgres.checkpointer'
import { LlmFactory } from './llm/llm.factory'
import { AiController } from './ai.controller'
import { AiService } from './ai.service'
import { KnowledgeBookmarkService } from './knowledge/knowledge-bookmark.service'
import { RagModule } from './rag/rag.module'

@Module({
    imports: [ConfigModule, RagModule, PageModule, TypeOrmModule.forFeature([KnowledgeBookmarkEntity])],
    controllers: [AiController],
    providers: [
        AiService,
        LlmFactory,
        PostgresCheckpointerService,
        KnowledgeBookmarkService,
    ],
    exports: [AiService, LlmFactory],
})
export class AiModule {}
