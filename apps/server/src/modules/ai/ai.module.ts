/**
 * AI 模块定义
 *
 * 注册 AI 模块的所有 providers 和 controllers。
 *
 * Providers：
 * - AiService: AI Agent 编排服务（核心）
 * - LlmFactory: LLM 模型工厂（多提供商支持）
 * - PostgresCheckpointerService: 对话状态持久化服务
 *
 * Controllers：
 * - AiController: AI 端点（chat/summary/outline/rewrite/resume）
 *
 * Imports：
 * - RagModule: RAG 检索增强生成（语义搜索）
 *
 * Exports：
 * - AiService: 供其他模块调用 AI 功能
 * - LlmFactory: 供其他模块创建 LLM 实例
 *
 * @module ai/module
 */
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { PostgresCheckpointerService } from './checkpointer/postgres.checkpointer'
import { LlmFactory } from './llm/llm.factory'
import { AiController } from './ai.controller'
import { AiService } from './ai.service'
import { RagModule } from './rag/rag.module'

@Module({
    imports: [ConfigModule, RagModule],
    controllers: [AiController],
    providers: [
        AiService,
        LlmFactory,
        PostgresCheckpointerService,
    ],
    exports: [AiService, LlmFactory],
})
export class AiModule {}
