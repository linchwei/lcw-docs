/**
 * 知识图谱可视化 Agent
 *
 * 使用 LangGraph 的 createReactAgent 创建知识图谱生成 Agent。
 * 根据用户查询生成知识图谱的结构化数据，用于前端可视化展示文档间的关联关系。
 *
 * 特点：
 * - 单轮执行，无对话记忆（不使用 Checkpointer）
 * - 低温度（0.3）确保图谱结构输出稳定、确定性高
 * - 禁用流式输出（streaming: false），直接返回完整结果
 * - 使用四个工具：搜索、文档结构、索引块列表、跨文档检索，
 *   以全面理解文档间的关系并构建图谱
 *
 * 与其他 Agent 的区别：
 * - knowledge.graph.ts：知识问答 Agent，多轮对话，面向问答场景
 * - knowledge-graph.graph.ts（本文件）：知识图谱 Agent，单轮执行，面向图谱可视化场景
 * - 本 Agent 需要理解文档间的关联关系，因此使用了最多的工具（4个）
 *
 * 工作流：
 * 用户查询 → Agent 分析 → 调用检索/结构工具 → 生成图谱结构化数据（节点+边）
 *
 * @module graphs/knowledge-graph
 */
import { createReactAgent } from '@langchain/langgraph/prebuilt'

import { LlmFactory } from '../llm/llm.factory'
import { KNOWLEDGE_GRAPH_PROMPT } from '../prompts/knowledge.prompt'
import { searchKnowledge, getDocumentStructure, listIndexedChunks, searchCrossDocuments } from '../tools/knowledge.tools'

/**
 * 创建知识图谱可视化 Agent
 *
 * @param llmFactory - LLM 工厂，用于创建 ChatModel 实例
 * @returns 编译好的 LangGraph Agent，可直接调用 invoke()
 */
export function createKnowledgeGraphGraph(llmFactory: LlmFactory) {
    const llm = llmFactory.create({ temperature: 0.3, streaming: false })

    return createReactAgent({
        llm,
        prompt: KNOWLEDGE_GRAPH_PROMPT,
        tools: [searchKnowledge, getDocumentStructure, listIndexedChunks, searchCrossDocuments],
    })
}
