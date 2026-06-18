/**
 * 智能摘要 Agent
 *
 * 使用 LangGraph 的 createReactAgent 创建智能摘要生成 Agent。
 * 基于知识库内容生成高质量的文档摘要，支持多文档综合摘要。
 *
 * 特点：
 * - 单轮执行，无对话记忆（不使用 Checkpointer）
 * - 低温度（0.3）确保摘要输出稳定、准确性高
 * - 禁用流式输出（streaming: false），直接返回完整结果
 * - 使用三个工具：搜索、文档结构、索引块列表，
 *   以全面理解文档内容并生成准确摘要
 *
 * 与其他 Agent 的区别：
 * - summary.graph.ts：基于 StateGraph 的多步骤文档摘要，面向单文档分块摘要
 * - smart-summary.graph.ts（本文件）：基于知识库的智能摘要，面向多文档综合摘要
 * - 本 Agent 利用知识库检索能力，可以跨文档提取关键信息生成摘要
 *
 * 工作流：
 * 文档/主题 → Agent 分析 → 调用检索/结构工具 → 生成综合摘要
 *
 * @module graphs/smart-summary
 */
import { createReactAgent } from '@langchain/langgraph/prebuilt'

import { LlmFactory } from '../llm/llm.factory'
import { SMART_SUMMARY_PROMPT } from '../prompts/knowledge.prompt'
import { getDocumentStructure, listIndexedChunks, searchKnowledge } from '../tools/knowledge.tools'

/**
 * 创建智能摘要 Agent
 *
 * @param llmFactory - LLM 工厂，用于创建 ChatModel 实例
 * @returns 编译好的 LangGraph Agent，可直接调用 invoke()
 */
export function createSmartSummaryGraph(llmFactory: LlmFactory) {
    const llm = llmFactory.create({ temperature: 0.3, streaming: false })

    return createReactAgent({
        llm,
        prompt: SMART_SUMMARY_PROMPT,
        tools: [searchKnowledge, getDocumentStructure, listIndexedChunks],
    })
}
