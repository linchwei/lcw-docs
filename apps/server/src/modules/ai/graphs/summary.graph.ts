/**
 * 文档摘要 Agent
 *
 * 使用 LangGraph StateGraph 实现多步骤文档摘要生成。
 * 支持长文档智能分块、逐块摘要、合并、自动精炼。
 *
 * 工作流：
 * ```
 * START → chunk（智能分块）→ summarize（逐块摘要）→ merge（合并摘要）
 *                                                      ↓
 *                                              needsRefinement?
 *                                              ├─ 否 → END
 *                                              └─ 是 → refine（精炼）→ END
 * ```
 *
 * 创新点：
 * - 按段落结构分块（而非固定长度），保持语义完整性
 * - 自动判断是否需要精炼（摘要超过 500 字时触发）
 * - 使用低温度（0.3）确保摘要质量稳定
 *
 * @module graphs/summary
 */
import { BaseMessage } from '@langchain/core/messages'
import { Annotation, END, START, StateGraph } from '@langchain/langgraph'
import { messagesStateReducer } from '@langchain/langgraph'
import { MemorySaver } from '@langchain/langgraph'
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres'

import { LlmFactory } from '../llm/llm.factory'
import { CHUNK_SUMMARY_PROMPT, MERGE_SUMMARIES_PROMPT, REFINE_SUMMARY_PROMPT } from '../prompts/summary.prompt'

/**
 * 摘要 Agent 状态定义
 *
 * 每个字段代表工作流中的一个状态变量，
 * LangGraph 会在节点间自动传递和更新。
 *
 * 状态流转：
 * documentContent → chunks → chunkSummaries → finalSummary → (可选) refined finalSummary
 */
const SummaryState = Annotation.Root({
    /** 对话消息历史（保留用于上下文） */
    messages: Annotation<BaseMessage[]>({ reducer: messagesStateReducer }),

    /** 待摘要的文档全文内容 */
    documentContent: Annotation<string>,

    /** 分块后的文档片段列表 */
    chunks: Annotation<string[]>({
        reducer: (_, newVal) => newVal,
        default: () => [],
    }),

    /** 各片段的摘要结果列表 */
    chunkSummaries: Annotation<string[]>({
        reducer: (_, newVal) => newVal,
        default: () => [],
    }),

    /** 最终合并的摘要 */
    finalSummary: Annotation<string>,

    /** 是否需要精炼（合并后摘要超过 500 字时为 true） */
    needsRefinement: Annotation<boolean>({
        reducer: (_, newVal) => newVal,
        default: () => false,
    }),
})

/**
 * 节点 1：智能分块
 *
 * 按双换行（段落级别）将文档拆分为语义完整的块，
 * 每块不超过 maxChars，避免截断段落。
 * 优先保持段落完整性，而非固定长度切分。
 */
async function chunkDocument(state: typeof SummaryState.State) {
    const content = state.documentContent
    const maxChars = 2000 // 每块最大字符数

    // 按双换行分块（段落级别）
    const paragraphs = content.split(/\n\n+/)
    const chunks: string[] = []
    let currentChunk = ''

    for (const para of paragraphs) {
        // 如果当前块 + 新段落不超过限制，合并
        if (currentChunk.length + para.length + 2 <= maxChars) {
            currentChunk += (currentChunk ? '\n\n' : '') + para
        } else {
            // 当前块已满，保存并开始新块
            if (currentChunk) chunks.push(currentChunk)
            currentChunk = para
        }
    }

    // 别忘了最后一个块
    if (currentChunk) chunks.push(currentChunk)

    return { chunks }
}

/**
 * 节点 2：逐块摘要
 *
 * 对每个 chunk 生成摘要。当前为串行处理，
 * 后续可升级为并行处理提升速度。
 * 使用低温度（0.3）确保摘要质量稳定。
 */
async function summarizeChunks(state: typeof SummaryState.State, llmFactory: LlmFactory) {
    const llm = llmFactory.create({ temperature: 0.3 })

    const summaries: string[] = []
    for (const chunk of state.chunks) {
        const prompt = CHUNK_SUMMARY_PROMPT.replace('{content}', chunk)
        const response = await llm.invoke(prompt)
        summaries.push(typeof response.content === 'string' ? response.content : String(response.content))
    }

    return { chunkSummaries: summaries }
}

/**
 * 节点 3：合并摘要
 *
 * 将各片段摘要合并为一份完整摘要，
 * 并判断是否需要精炼（超过 500 字则标记）。
 */
async function mergeSummaries(state: typeof SummaryState.State, llmFactory: LlmFactory) {
    const llm = llmFactory.create({ temperature: 0.3 })

    const prompt = MERGE_SUMMARIES_PROMPT.replace('{summaries}', state.chunkSummaries.join('\n\n'))
    const response = await llm.invoke(prompt)
    const merged = typeof response.content === 'string' ? response.content : String(response.content)

    return {
        finalSummary: merged,
        needsRefinement: merged.length > 500,
    }
}

/**
 * 节点 4：精炼摘要
 *
 * 如果合并后的摘要超过 500 字，触发精炼步骤，
 * 将摘要压缩到 300 字以内。
 */
async function refineSummary(state: typeof SummaryState.State, llmFactory: LlmFactory) {
    const llm = llmFactory.create({ temperature: 0.3 })

    const prompt = REFINE_SUMMARY_PROMPT.replace('{summary}', state.finalSummary)
    const response = await llm.invoke(prompt)
    const refined = typeof response.content === 'string' ? response.content : String(response.content)

    return {
        finalSummary: refined,
        needsRefinement: false,
    }
}

/**
 * 条件边：判断是否需要精炼
 *
 * 合并后摘要超过 500 字时需要精炼，
 * 否则直接结束。
 */
function shouldRefine(state: typeof SummaryState.State) {
    return state.needsRefinement ? 'refine' : END
}

/**
 * 创建摘要 Agent
 *
 * @param llmFactory - LLM 工厂
 * @param checkpointer - 可选的 Checkpointer，null 时降级为 MemorySaver
 * @returns 编译好的 LangGraph StateGraph
 */
export function createSummaryGraph(llmFactory: LlmFactory, checkpointer?: PostgresSaver | null) {
    const saver = checkpointer ?? new MemorySaver()

    return new StateGraph(SummaryState)
        .addNode('chunk', state => chunkDocument(state))
        .addNode('summarize', state => summarizeChunks(state, llmFactory))
        .addNode('merge', state => mergeSummaries(state, llmFactory))
        .addNode('refine', state => refineSummary(state, llmFactory))
        .addEdge(START, 'chunk')
        .addEdge('chunk', 'summarize')
        .addEdge('summarize', 'merge')
        .addConditionalEdges('merge', shouldRefine, {
            refine: 'refine',
            [END]: END,
        })
        .addEdge('refine', END)
        .compile({ checkpointer: saver })
}
