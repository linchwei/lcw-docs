/**
 * 大纲生成 Agent
 *
 * 实现大纲驱动写作模式：
 * 用户输入主题 → AI 生成大纲 → 用户审批/修改 → 逐节展开 → 用户逐节审批
 *
 * 工作流：
 * ```
 * START → generateOutline → approveOutline（中断等待审批）→ expandSection（循环）
 *                                                                    ↓
 *                                                            hasMoreSections?
 *                                                            ├─ 是 → expandSection（继续）
 *                                                            └─ 否 → done → END
 * ```
 *
 * Human-in-the-Loop 机制：
 * - 使用 LangGraph interruptBefore 在 approveOutline 节点前暂停
 * - 前端收到中断信号后展示大纲供用户编辑
 * - 用户确认后调用 POST /api/ai/resume 恢复执行
 * - Checkpointer 自动保存暂停状态，用户可关闭页面稍后继续
 *
 * @module graphs/outline
 */
import { Annotation, END, START, StateGraph } from '@langchain/langgraph'
import { BaseMessage } from '@langchain/core/messages'
import { messagesStateReducer } from '@langchain/langgraph'
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres'
import { MemorySaver } from '@langchain/langgraph'

import { LlmFactory } from '../llm/llm.factory'
import { GENERATE_OUTLINE_PROMPT, EXPAND_SECTION_PROMPT } from '../prompts/outline.prompt'

/** 大纲项结构（与前端 AIOutlineApproval 组件对应） */
interface OutlineItem {
    /** 章节标题 */
    title: string
    /** 章节描述 */
    description: string
    /** 标题层级（1 = H1, 2 = H2） */
    level: number
    /** 子章节列表 */
    children?: OutlineItem[]
}

/**
 * 大纲 Agent 状态定义
 *
 * 状态流转：
 * topic + requirements → outline → (审批) → flatOutline → sections（逐个追加）
 */
const OutlineState = Annotation.Root({
    /** 对话消息历史 */
    messages: Annotation<BaseMessage[]>({ reducer: messagesStateReducer }),

    /** 用户输入的文档主题 */
    topic: Annotation<string>,

    /** 用户的额外要求（可选） */
    requirements: Annotation<string>,

    /** AI 生成的大纲（树形结构） */
    outline: Annotation<OutlineItem[]>({
        reducer: (_, newVal) => newVal,
        default: () => [],
    }),

    /** 大纲是否已被用户审批 */
    approvedOutline: Annotation<boolean>({
        reducer: (_, newVal) => newVal,
        default: () => false,
    }),

    /** 逐节展开的内容（追加模式） */
    sections: Annotation<Array<{ title: string; content: string; blockId?: string }>>({
        reducer: (prev, newVal) => [...prev, ...newVal],
        default: () => [],
    }),

    /** 当前展开到第几个 section（从 0 开始） */
    currentSectionIndex: Annotation<number>({
        reducer: (_, newVal) => newVal,
        default: () => 0,
    }),

    /** 扁平化的大纲列表（用于逐节展开） */
    flatOutline: Annotation<Array<{ title: string; description: string; level: number }>>({
        reducer: (_, newVal) => newVal,
        default: () => [],
    }),
})

/**
 * 节点 1：生成大纲
 *
 * 根据用户输入的主题和要求，调用 LLM 生成结构化大纲。
 * LLM 返回 JSON 格式的大纲，解析后存储到状态中。
 * 同时将树形大纲扁平化，便于后续逐节展开。
 */
async function generateOutline(state: typeof OutlineState.State, llmFactory: LlmFactory) {
    const llm = llmFactory.create({ temperature: 0.7 })

    const requirementsText = state.requirements ? `\n额外要求：${state.requirements}` : ''
    const prompt = GENERATE_OUTLINE_PROMPT
        .replace('{topic}', state.topic)
        .replace('{requirements}', requirementsText)

    const response = await llm.invoke(prompt)
    const content = typeof response.content === 'string' ? response.content : String(response.content)

    try {
        // 提取 JSON 部分（可能被 markdown 代码块包裹）
        const jsonMatch = content.match(/\[[\s\S]*\]/)
        const outline: OutlineItem[] = jsonMatch ? JSON.parse(jsonMatch[0]) : []

        // 扁平化大纲，用于逐节展开
        const flatOutline: Array<{ title: string; description: string; level: number }> = []
        function flatten(items: OutlineItem[]) {
            for (const item of items) {
                flatOutline.push({ title: item.title, description: item.description, level: item.level })
                if (item.children) flatten(item.children)
            }
        }
        flatten(outline)

        return { outline, flatOutline }
    } catch {
        // JSON 解析失败，返回空大纲
        return { outline: [], flatOutline: [] }
    }
}

/**
 * 节点 2：审批大纲（此节点暂停，等待人类审批）
 *
 * compile 时添加 interruptBefore: ['approveOutline']
 * 使 Graph 在此节点前暂停，等待用户审批。
 * 前端收到 interrupt 事件后展示大纲编辑界面。
 */
async function approveOutline(state: typeof OutlineState.State) {
    return { approvedOutline: true }
}

/**
 * 节点 3：逐节展开
 *
 * 根据大纲逐个展开章节内容。
 * 每次调用展开一个 section，通过循环实现逐节展开。
 * 使用较高温度（0.7）使内容更丰富。
 */
async function expandSection(state: typeof OutlineState.State, llmFactory: LlmFactory) {
    const llm = llmFactory.create({ temperature: 0.7 })

    const section = state.flatOutline[state.currentSectionIndex]
    if (!section) {
        return { currentSectionIndex: state.currentSectionIndex }
    }

    const prompt = EXPAND_SECTION_PROMPT
        .replace('{title}', section.title)
        .replace('{description}', section.description)
        .replace('{topic}', state.topic)

    const response = await llm.invoke(prompt)
    const content = typeof response.content === 'string' ? response.content : String(response.content)

    return {
        sections: [{ title: section.title, content }],
        currentSectionIndex: state.currentSectionIndex + 1,
    }
}

/**
 * 条件边：是否还有未展开的 section
 *
 * 如果还有未展开的 section，继续循环；
 * 否则进入 done 节点结束。
 */
function hasMoreSections(state: typeof OutlineState.State) {
    return state.currentSectionIndex < state.flatOutline.length ? 'expand' : 'done'
}

/**
 * 创建大纲 Agent
 *
 * @param llmFactory - LLM 工厂
 * @param checkpointer - 可选的 Checkpointer，null 时降级为 MemorySaver
 * @returns 编译好的 LangGraph StateGraph，带 interruptBefore: ['approveOutline']
 */
export function createOutlineGraph(llmFactory: LlmFactory, checkpointer?: PostgresSaver | null) {
    const saver = checkpointer ?? new MemorySaver()

    return new StateGraph(OutlineState)
        .addNode('generateOutline', (state) => generateOutline(state, llmFactory))
        .addNode('approveOutline', approveOutline)
        .addNode('expandSection', (state) => expandSection(state, llmFactory))
        .addNode('done', (state) => state)
        .addEdge(START, 'generateOutline')
        .addEdge('generateOutline', 'approveOutline')
        .addEdge('approveOutline', 'expandSection')
        .addConditionalEdges('expandSection', hasMoreSections, {
            expand: 'expandSection',
            done: 'done',
        })
        .addEdge('done', END)
        .compile({ checkpointer: saver, interruptBefore: ['approveOutline'] })
}
