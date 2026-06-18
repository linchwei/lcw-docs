/**
 * 知识问答 Agent
 *
 * 使用 LangGraph 的 createReactAgent 创建知识库问答 Agent。
 * 这是 Knowledge AI Assistant 功能的核心交互入口，支持：
 * - 基于知识库的智能问答（通过搜索、文档结构、跨文档检索等工具）
 * - 多轮对话（通过 Checkpointer 持久化对话状态）
 * - 流式输出（streaming: true），实时返回 AI 回复
 *
 * 与其他 Agent 的区别：
 * - chat.graph.ts：通用对话 Agent，面向文档编辑场景
 * - knowledge.graph.ts（本文件）：知识问答 Agent，面向知识检索与问答场景
 * - auto-tag.graph.ts：自动标签 Agent，单轮、无对话记忆
 * - knowledge-graph.graph.ts：知识图谱可视化 Agent，单轮、无对话记忆
 * - smart-summary.graph.ts：智能摘要 Agent，单轮、无对话记忆
 * - learning-path.graph.ts：学习路径 Agent，单轮、无对话记忆
 *
 * 工作流：
 * 用户消息 → Agent 思考 → 调用知识工具（可选）→ 生成回复 → SSE 流式输出
 *
 * @module graphs/knowledge
 */
import { MemorySaver } from '@langchain/langgraph'
import { createReactAgent } from '@langchain/langgraph/prebuilt'
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres'

import { LlmFactory } from '../llm/llm.factory'
import { KNOWLEDGE_SYSTEM_PROMPT } from '../prompts/knowledge.prompt'
import { knowledgeTools } from '../tools/knowledge.tools'

/**
 * 创建知识问答 Agent
 *
 * @param llmFactory - LLM 工厂，用于创建 ChatModel 实例
 * @param checkpointer - 可选的 PostgresSaver，传入则启用对话持久化；
 *                       为 null 时降级为 MemorySaver（内存存储，重启丢失）
 * @returns 编译好的 LangGraph Agent，可直接调用 invoke() 或 streamEvents()
 */
export function createKnowledgeGraph(llmFactory: LlmFactory, checkpointer?: PostgresSaver | null) {
    const llm = llmFactory.create({ streaming: true })

    // 如果没有 PostgresSaver，降级为 MemorySaver（内存存储，重启丢失）
    const saver = checkpointer ?? new MemorySaver()

    return createReactAgent({
        llm,
        checkpointer: saver,
        prompt: KNOWLEDGE_SYSTEM_PROMPT,
        tools: knowledgeTools,
    })
}
