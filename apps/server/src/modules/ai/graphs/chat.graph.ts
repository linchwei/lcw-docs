/**
 * 通用对话 Agent
 *
 * 使用 LangGraph 的 createReactAgent 创建带文档工具的对话 Agent。
 * 这是用户与 AI 交互的主要入口，支持：
 * - 文档阅读（通过读取工具：大纲、章节、选区、搜索）
 * - 文档修改建议（通过写入工具，需用户 Diff 审批后执行）
 * - 多轮对话（通过 Checkpointer 持久化对话状态）
 *
 * 工作流：
 * 用户消息 → Agent 思考 → 调用工具（可选）→ 生成回复 → SSE 流式输出
 *
 * @module graphs/chat
 */
import { MemorySaver } from '@langchain/langgraph'
import { createReactAgent } from '@langchain/langgraph/prebuilt'
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres'

import { LlmFactory } from '../llm/llm.factory'
import { CHAT_SYSTEM_PROMPT } from '../prompts/chat.prompt'
import { documentReadTools } from '../tools/document.tools'
import { editorWriteTools } from '../tools/editor.tools'

/**
 * 创建通用对话 Agent
 *
 * @param llmFactory - LLM 工厂，用于创建 ChatModel 实例
 * @param checkpointer - 可选的 PostgresSaver，传入则启用对话持久化；
 *                       为 null 时降级为 MemorySaver（内存存储，重启丢失）
 * @returns 编译好的 LangGraph Agent，可直接调用 invoke() 或 streamEvents()
 */
export function createChatGraph(llmFactory: LlmFactory, checkpointer?: PostgresSaver | null) {
    const llm = llmFactory.create()

    // 如果没有 PostgresSaver，降级为 MemorySaver（内存存储，重启丢失）
    const saver = checkpointer ?? new MemorySaver()

    return createReactAgent({
        llm,
        checkpointer: saver,
        prompt: CHAT_SYSTEM_PROMPT,
        tools: [...documentReadTools, ...editorWriteTools],
    })
}
