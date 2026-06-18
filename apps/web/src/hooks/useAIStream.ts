/**
 * useAIStream Hook
 *
 * 统一处理 AI SSE 流式响应的 React Hook。
 * 抽取了 4 个组件中重复的 SSE 解析逻辑，
 * 同时支持旧格式（DeepSeek 兼容）和新格式（LangGraph Agent 事件）。
 *
 * 使用方式：
 * ```tsx
 * const { content, isGenerating, interrupt, startStream, cancel } = useAIStream()
 *
 * // 发起请求
 * await startStream(async (signal) => {
 *   const response = await chatWithAgent(messages, context, threadId, signal)
 *   return response
 * })
 *
 * // 读取状态
 * console.log(content)       // 累积的文本内容
 * console.log(isGenerating)  // 是否正在生成
 * console.log(interrupt)     // 中断事件数据（如大纲审批、Diff 预览）
 * ```
 *
 * @module hooks/useAIStream
 */
import { useCallback, useRef, useState } from 'react'

import { InterruptEventData, ParsedSSEEvent, readSSEStream } from '@/services/ai'

/** Agent 工作流步骤状态 */
export interface AgentStepInfo {
    /** 步骤名称 */
    step: string
    /** 步骤状态 */
    status: 'running' | 'completed' | 'error'
}

/** Diff 操作项 */
export interface DiffItem {
    /** 操作类型 */
    type: 'insert_blocks' | 'update_block' | 'delete_block'
    /** 目标 block ID */
    blockId?: string
    /** 操作数据 */
    data: Record<string, any>
}

/** useAIStream 返回值 */
export interface UseAIStreamReturn {
    /** 累积的文本内容 */
    content: string
    /** 是否正在生成 */
    isGenerating: boolean
    /** 中断事件数据（大纲审批 / Diff 预览） */
    interrupt: InterruptEventData | null
    /** Agent 工作流步骤状态 */
    agentSteps: AgentStepInfo[]
    /** Diff 操作列表 */
    diffs: DiffItem[]
    /** 发起流式请求，返回累积的文本内容 */
    startStream: (fetcher: (signal: AbortSignal) => Promise<Response>) => Promise<string>
    /** 取消当前请求 */
    cancel: () => void
    /** 重置所有状态 */
    reset: () => void
}

/** useAIStream 参数 */
export interface UseAIStreamOptions {
    /** 流结束回调，接收 done 事件数据（可能包含 threadId 等） */
    onDone?: (data: Record<string, any>) => void
}

/**
 * 统一的 AI SSE 流式响应 Hook
 *
 * @returns UseAIStreamReturn
 */
export function useAIStream(options?: UseAIStreamOptions): UseAIStreamReturn {
    const [content, setContent] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)
    const [interrupt, setInterrupt] = useState<InterruptEventData | null>(null)
    const [agentSteps, setAgentSteps] = useState<AgentStepInfo[]>([])
    const [diffs, setDiffs] = useState<DiffItem[]>([])

    // 使用 ref 保存 AbortController，避免闭包问题
    const abortRef = useRef<AbortController | null>(null)
    // 使用 ref 保存累积内容，避免频繁 setState 导致的性能问题
    const contentRef = useRef('')

    // 使用 ref 保存 onDone 回调，避免 handleEvent 闭包问题
    const onDoneRef = useRef(options?.onDone)
    onDoneRef.current = options?.onDone

    /**
     * 处理解析后的 SSE 事件
     */
    const handleEvent = useCallback((event: ParsedSSEEvent) => {
        switch (event.type) {
            case 'content': {
                // 文本内容流：累积到 content
                const text = event.data.content || ''
                if (text) {
                    contentRef.current += text
                    setContent(contentRef.current)
                }
                break
            }

            case 'agent_status': {
                // Agent 步骤状态更新
                setAgentSteps(prev => {
                    // 如果该步骤已存在，更新状态；否则新增
                    const idx = prev.findIndex(s => s.step === event.data.step)
                    if (idx >= 0) {
                        const updated = [...prev]
                        updated[idx] = { step: event.data.step, status: event.data.status }
                        return updated
                    }
                    return [...prev, { step: event.data.step, status: event.data.status }]
                })
                break
            }

            case 'tool_call': {
                // 工具调用事件：如果是写入操作，添加到 diffs 列表
                const toolData = event.data
                if (toolData.tool === 'diff_preview' || toolData.result) {
                    try {
                        const parsed = typeof toolData.result === 'string' ? JSON.parse(toolData.result) : toolData.result
                        if (parsed?.type === 'update_block' || parsed?.type === 'insert_blocks' || parsed?.type === 'delete_block') {
                            setDiffs(prev => [
                                ...prev,
                                {
                                    type: parsed.type,
                                    blockId: parsed.blockId,
                                    data: parsed,
                                },
                            ])
                        }
                    } catch {
                        // 非 JSON 结果，忽略
                    }
                }
                break
            }

            case 'interrupt': {
                // 中断事件：设置中断数据，前端展示审批界面
                setInterrupt(event.data as InterruptEventData)
                break
            }

            case 'diff': {
                // Diff 事件：添加到 diffs 列表
                setDiffs(prev => [
                    ...prev,
                    {
                        type: 'update_block',
                        blockId: event.data.blockId,
                        data: event.data,
                    },
                ])
                break
            }

            case 'done': {
                // 流结束，调用 onDone 回调传递事件数据（如 threadId）
                if (onDoneRef.current && event.data) {
                    onDoneRef.current(event.data)
                }
                break
            }
        }
    }, [])

    /**
     * 发起流式请求
     *
     * @param fetcher - 请求函数，接收 AbortSignal，返回 Response
     */
    const startStream = useCallback(
        async (fetcher: (signal: AbortSignal) => Promise<Response>): Promise<string> => {
            // 重置状态
            contentRef.current = ''
            setContent('')
            setInterrupt(null)
            setAgentSteps([])
            setDiffs([])
            setIsGenerating(true)

            const controller = new AbortController()
            abortRef.current = controller

            try {
                const response = await fetcher(controller.signal)
                if (!response.ok) {
                    throw new Error(`请求失败: ${response.status}`)
                }

                const reader = response.body?.getReader()
                if (!reader) throw new Error('无法读取响应流')

                await readSSEStream(reader, handleEvent)
            } catch (err: unknown) {
                // AbortError 是用户主动取消，不需要报错
                if (err instanceof Error && err.name !== 'AbortError') {
                    console.error('AI stream error:', err)
                    contentRef.current += `\n\n[错误] ${err.message}`
                    setContent(contentRef.current)
                }
            } finally {
                setIsGenerating(false)
                abortRef.current = null
            }

            // 返回累积的完整内容（从 ref 读取，避免闭包陷阱）
            return contentRef.current
        },
        [handleEvent]
    )

    /** 取消当前请求 */
    const cancel = useCallback(() => {
        abortRef.current?.abort()
        setIsGenerating(false)
    }, [])

    /** 重置所有状态 */
    const reset = useCallback(() => {
        contentRef.current = ''
        setContent('')
        setIsGenerating(false)
        setInterrupt(null)
        setAgentSteps([])
        setDiffs([])
        abortRef.current?.abort()
    }, [])

    return {
        content,
        isGenerating,
        interrupt,
        agentSteps,
        diffs,
        startStream,
        cancel,
        reset,
    }
}
