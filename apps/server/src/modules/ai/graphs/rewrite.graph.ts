/**
 * 文档改写 Agent
 *
 * 参考 Cursor 的 Diff 审批模式：
 * 用户选区 + 改写指令 → 生成改写 → Diff 预览 → 人类审批 → 应用/拒绝
 *
 * 工作流：
 * ```
 * START → generateRewrite → approveRewrite（中断等待审批）→ END
 * ```
 *
 * Human-in-the-Loop 机制：
 * - 使用 LangGraph interruptBefore 在 approveRewrite 节点前暂停
 * - 前端收到中断信号后展示 Diff 预览
 * - 用户点击"接受"或"拒绝"后调用 POST /api/ai/resume
 *
 * Diff 算法：
 * - 当前使用简单的逐行对比（keep/add/remove）
 * - 后续可升级为 Myers diff 算法，提供更精确的差异对比
 *
 * @module graphs/rewrite
 */
import { BaseMessage } from '@langchain/core/messages'
import { Annotation, END, START, StateGraph } from '@langchain/langgraph'
import { messagesStateReducer } from '@langchain/langgraph'
import { MemorySaver } from '@langchain/langgraph'
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres'

import { LlmFactory } from '../llm/llm.factory'
import { REWRITE_PROMPT } from '../prompts/rewrite.prompt'

/**
 * 改写 Agent 状态定义
 *
 * 状态流转：
 * selectedContent + instruction → rewrittenContent + diff → (审批)
 */
const RewriteState = Annotation.Root({
    /** 对话消息历史 */
    messages: Annotation<BaseMessage[]>({ reducer: messagesStateReducer }),

    /** 用户选中的原始内容 */
    selectedContent: Annotation<string>,

    /** 选区上下文（前后 block 的内容） */
    context: Annotation<string>,

    /** 用户的改写指令（如"润色"、"简化"、"翻译"等） */
    instruction: Annotation<string>,

    /** 改写后的内容 */
    rewrittenContent: Annotation<string>,

    /** Diff 信息（供前端展示差异对比） */
    diff: Annotation<Array<{ type: 'add' | 'remove' | 'keep'; content: string }>>({
        reducer: (_, newVal) => newVal,
        default: () => [],
    }),

    /** 是否已被用户审批 */
    approved: Annotation<boolean>({
        reducer: (_, newVal) => newVal,
        default: () => false,
    }),
})

/**
 * 节点 1：生成改写
 *
 * 根据用户的改写指令和上下文，调用 LLM 生成改写内容。
 * 同时生成简单的逐行 Diff，供前端展示差异对比。
 * 使用中等温度（0.5）平衡创造性和准确性。
 */
async function generateRewrite(state: typeof RewriteState.State, llmFactory: LlmFactory) {
    const llm = llmFactory.create({ temperature: 0.5 })

    const prompt = REWRITE_PROMPT.replace('{selectedContent}', state.selectedContent)
        .replace('{instruction}', state.instruction)
        .replace('{context}', state.context || '无上下文')

    const response = await llm.invoke(prompt)
    const rewritten = typeof response.content === 'string' ? response.content : String(response.content)

    // 生成简单 Diff（逐行对比）
    const oldLines = state.selectedContent.split('\n')
    const newLines = rewritten.split('\n')
    const diff: Array<{ type: 'add' | 'remove' | 'keep'; content: string }> = []

    // 简单的逐行 Diff 算法
    // TODO: 后续升级为 Myers diff 算法，提供更精确的差异对比
    const maxLen = Math.max(oldLines.length, newLines.length)
    for (let i = 0; i < maxLen; i++) {
        const oldLine = oldLines[i]
        const newLine = newLines[i]
        if (oldLine === newLine) {
            // 行内容相同，标记为 keep
            diff.push({ type: 'keep', content: oldLine })
        } else {
            // 行内容不同，标记旧行为 remove，新行为 add
            if (oldLine !== undefined) diff.push({ type: 'remove', content: oldLine })
            if (newLine !== undefined) diff.push({ type: 'add', content: newLine })
        }
    }

    return { rewrittenContent: rewritten, diff }
}

/**
 * 节点 2：审批改写（中断等待审批）
 *
 * compile 时添加 interruptBefore: ['approveRewrite']
 * 使 Graph 在此节点前暂停，等待用户审批。
 * 前端收到 interrupt 事件后展示 Diff 预览界面。
 */
async function approveRewrite(_state: typeof RewriteState.State) {
    return { approved: true }
}

/**
 * 创建改写 Agent
 *
 * @param llmFactory - LLM 工厂
 * @param checkpointer - 可选的 Checkpointer，null 时降级为 MemorySaver
 * @returns 编译好的 LangGraph StateGraph，带 interruptBefore: ['approveRewrite']
 */
export function createRewriteGraph(llmFactory: LlmFactory, checkpointer?: PostgresSaver | null) {
    const saver = checkpointer ?? new MemorySaver()

    return new StateGraph(RewriteState)
        .addNode('generateRewrite', state => generateRewrite(state, llmFactory))
        .addNode('approveRewrite', approveRewrite)
        .addEdge(START, 'generateRewrite')
        .addEdge('generateRewrite', 'approveRewrite')
        .addEdge('approveRewrite', END)
        .compile({ checkpointer: saver, interruptBefore: ['approveRewrite'] })
}
