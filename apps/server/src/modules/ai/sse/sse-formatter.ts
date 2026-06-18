/**
 * SSE 格式转换层
 *
 * 将 LangGraph 的 streamEvents 输出转换为前端可解析的 SSE 格式。
 * 保持与现有 DeepSeek SSE 格式的兼容性，同时新增 Agent 事件类型。
 *
 * SSE 事件类型：
 * - content: 文本内容流（兼容现有 DeepSeek 格式）
 * - agent_status: Agent 工作流步骤状态（运行中/完成/错误）
 * - tool_call: 工具调用事件（含操作指令，如 insert_blocks）
 * - interrupt: Human-in-the-Loop 中断事件（需用户审批）
 * - diff: Diff 预览事件（改写对比）
 * - done: 流结束标记
 *
 * SSE 格式说明：
 * - 标准格式：`event: <type>\ndata: <json>\n\n`
 * - 兼容格式（content 类型）：`data: <json>\n\n`（与 DeepSeek 原始格式一致）
 * - 结束标记：`data: [DONE]\n\n`
 *
 * @module sse/formatter
 */

/** SSE 事件类型枚举 */
export type SSEEventType = 'content' | 'agent_status' | 'tool_call' | 'interrupt' | 'diff' | 'done'

/** SSE 事件数据结构 */
export interface SSEEvent {
    /** 事件类型 */
    type: SSEEventType
    /** 事件数据（JSON 对象） */
    data: Record<string, any>
}

/**
 * 格式化 SSE 事件为标准 SSE 文本格式
 *
 * SSE 标准格式：
 * ```
 * event: <event-type>
 * data: <json-data>
 *
 * ```
 *
 * @param event - SSE 事件对象
 * @returns 格式化后的 SSE 文本
 */
export function formatSSEEvent(event: SSEEvent): string {
    return `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`
}

/**
 * 格式化内容流事件（兼容现有 DeepSeek SSE 格式）
 *
 * 保持 `data: {"choices":[{"delta":{"content":"..."}}]}` 格式，
 * 确保前端现有 SSE 解析逻辑无需修改即可处理文本流。
 *
 * @param content - 增量文本内容
 * @returns 兼容 DeepSeek 格式的 SSE 文本
 */
export function formatContentEvent(content: string): string {
    return `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`
}

/**
 * 格式化 Agent 状态事件
 *
 * @param step - 当前步骤名称（如 "chunk", "summarize", "merge"）
 * @param status - 步骤状态：running（运行中）、completed（完成）、error（错误）
 * @returns SSE 文本
 */
export function formatAgentStatusEvent(step: string, status: 'running' | 'completed' | 'error'): string {
    return formatSSEEvent({ type: 'agent_status', data: { step, status } })
}

/**
 * 格式化工具调用事件
 *
 * 当 Agent 调用文档工具时，推送此事件到前端。
 * 前端可据此展示 Agent 正在执行的操作。
 *
 * @param tool - 工具名称（如 "get_document_outline", "insert_blocks"）
 * @param args - 工具调用参数
 * @param result - 工具返回结果（可选，调用结束后才有）
 * @returns SSE 文本
 */
export function formatToolCallEvent(tool: string, args: Record<string, any>, result?: string): string {
    return formatSSEEvent({ type: 'tool_call', data: { tool, args, result } })
}

/**
 * 格式化中断事件（Human-in-the-Loop）
 *
 * 当 Agent 在审批节点暂停时，推送此事件到前端。
 * 前端收到后展示审批界面（Diff 预览或大纲编辑）。
 *
 * @param step - 中断的步骤名称（如 "approveOutline", "approveRewrite"）
 * @param data - 中断相关数据（如大纲内容、改写 Diff）
 * @param threadId - 对话线程 ID，前端用于恢复执行
 * @returns SSE 文本
 */
export function formatInterruptEvent(step: string, data: Record<string, any>, threadId: string): string {
    return formatSSEEvent({ type: 'interrupt', data: { step, ...data, threadId } })
}

/**
 * 格式化 Diff 事件
 *
 * 当 Agent 生成文档修改建议时，推送此事件到前端。
 * 前端收到后展示 Diff 对比界面。
 *
 * @param blockId - 被修改的 block ID
 * @param oldContent - 原始内容
 * @param newContent - 新内容
 * @returns SSE 文本
 */
export function formatDiffEvent(blockId: string, oldContent: string, newContent: string): string {
    return formatSSEEvent({ type: 'diff', data: { blockId, oldContent, newContent } })
}

/**
 * 格式化流结束事件
 *
 * 所有 SSE 流必须以此事件结束。
 * 前端收到 [DONE] 后关闭流读取。
 * 如果提供 threadId，则使用标准 SSE 格式返回，前端可提取 threadId 用于对话持久化。
 *
 * @param threadId - 对话线程 ID（可选，知识库问答需要）
 * @returns SSE 文本
 */
export function formatDoneEvent(threadId?: string): string {
    if (threadId) {
        return formatSSEEvent({ type: 'done', data: { threadId } })
    }
    return 'data: [DONE]\n\n'
}
