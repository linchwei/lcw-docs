/**
 * 学习路径 Agent
 *
 * 使用 LangGraph 的 createReactAgent 创建学习路径规划 Agent。
 * 根据用户的学习目标和当前知识水平，生成个性化的学习路径和推荐文档。
 *
 * 特点：
 * - 单轮执行，无对话记忆（不使用 Checkpointer）
 * - 中等温度（0.5）在学习路径规划中适度发挥创造性，
 *   使推荐路径更灵活多样，同时保持合理性
 * - 禁用流式输出（streaming: false），直接返回完整结果
 * - 使用两个工具：跨文档检索、关联文档查询，
 *   以发现文档间的学习依赖关系和推荐顺序
 *
 * 与其他 Agent 的区别：
 * - knowledge.graph.ts：知识问答，面向具体问题的回答
 * - learning-path.graph.ts（本文件）：学习路径规划，面向系统性学习指导
 * - 本 Agent 侧重于文档间的学习依赖关系，而非单文档内容理解
 * - 温度略高（0.5），因为学习路径规划需要一定的创造性
 *
 * 工作流：
 * 学习目标 → Agent 分析 → 调用跨文档/关联工具 → 生成学习路径（含推荐顺序和文档列表）
 *
 * @module graphs/learning-path
 */
import { createReactAgent } from '@langchain/langgraph/prebuilt'

import { LlmFactory } from '../llm/llm.factory'
import { LEARNING_PATH_PROMPT } from '../prompts/knowledge.prompt'
import { searchCrossDocuments, getRelatedDocuments } from '../tools/knowledge.tools'

/**
 * 创建学习路径 Agent
 *
 * @param llmFactory - LLM 工厂，用于创建 ChatModel 实例
 * @returns 编译好的 LangGraph Agent，可直接调用 invoke()
 */
export function createLearningPathGraph(llmFactory: LlmFactory) {
    const llm = llmFactory.create({ temperature: 0.5, streaming: false })

    return createReactAgent({
        llm,
        prompt: LEARNING_PATH_PROMPT,
        tools: [searchCrossDocuments, getRelatedDocuments],
    })
}
