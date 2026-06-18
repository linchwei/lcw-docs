/**
 * 自动标签 Agent
 *
 * 使用 LangGraph 的 createReactAgent 创建自动标签生成 Agent。
 * 根据文档内容自动生成合适的标签，用于知识库的分类和检索。
 *
 * 特点：
 * - 单轮执行，无对话记忆（不使用 Checkpointer）
 * - 低温度（0.3）确保标签输出稳定、确定性高
 * - 禁用流式输出（streaming: false），直接返回完整结果
 * - 通过搜索和文档结构工具辅助标签生成
 *
 * 与其他 Agent 的区别：
 * - knowledge.graph.ts：多轮知识问答，带对话记忆
 * - auto-tag.graph.ts（本文件）：单轮标签生成，无对话记忆
 * - 仅使用 searchKnowledge 和 getDocumentStructure 两个工具，
 *   因为标签生成只需要理解文档内容和结构，无需跨文档检索
 *
 * 工作流：
 * 文档内容 → Agent 分析 → 调用搜索/结构工具（可选）→ 生成标签列表
 *
 * @module graphs/auto-tag
 */
import { createReactAgent } from '@langchain/langgraph/prebuilt'

import { LlmFactory } from '../llm/llm.factory'
import { AUTO_TAG_PROMPT } from '../prompts/knowledge.prompt'
import { getDocumentStructure, searchKnowledge } from '../tools/knowledge.tools'

/**
 * 创建自动标签 Agent
 *
 * @param llmFactory - LLM 工厂，用于创建 ChatModel 实例
 * @returns 编译好的 LangGraph Agent，可直接调用 invoke()
 */
export function createAutoTagGraph(llmFactory: LlmFactory) {
    const llm = llmFactory.create({ temperature: 0.3, streaming: false })

    return createReactAgent({
        llm,
        prompt: AUTO_TAG_PROMPT,
        tools: [searchKnowledge, getDocumentStructure],
    })
}
