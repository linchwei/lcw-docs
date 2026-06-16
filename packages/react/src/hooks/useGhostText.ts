import { dismissGhostText, ghostTextPluginKey, LcwDocEditor, showGhostText, updateGhostText } from '@lcw-doc/core'
import { useEffect, useRef } from 'react'

const GHOST_TEXT_SYSTEM_PROMPT = `你是一个文本自动补全助手。根据用户当前正在写的内容，补全接下来的文字。要求：
1. 只输出补全内容，不要输出已有内容
2. 补全内容要自然、连贯，与上下文风格一致
3. 补全长度适中，通常1-2句话
4. 不要输出解释、标记或多余格式`

const DEBOUNCE_MS = 500

export function useGhostText(
    editor: LcwDocEditor<any, any, any> | null,
    chatFn: (messages: any[], signal?: AbortSignal, options?: any) => Promise<Response>
) {
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const abortRef = useRef<AbortController | null>(null)

    useEffect(() => {
        if (!editor) return

        const handleChange = () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current)
            }

            if (abortRef.current) {
                abortRef.current.abort()
                abortRef.current = null
            }

            dismissGhostText(editor._tiptapEditor)

            const { from } = editor._tiptapEditor.state.selection
            const $pos = editor._tiptapEditor.state.doc.resolve(from)
            const textBefore = $pos.parent.textBetween(
                Math.max(0, $pos.parentOffset - 200),
                $pos.parentOffset,
                '\n'
            )

            if (!textBefore.trim()) return

            timerRef.current = setTimeout(async () => {
                const controller = new AbortController()
                abortRef.current = controller

                try {
                    const response = await chatFn(
                        [{ role: 'user', content: textBefore }],
                        controller.signal,
                        { systemPrompt: GHOST_TEXT_SYSTEM_PROMPT }
                    )

                    if (!response.ok || !response.body) return

                    const reader = response.body.getReader()
                    const decoder = new TextDecoder()
                    let accumulated = ''
                    let buffer = ''

                    while (true) {
                        const { done, value } = await reader.read()
                        if (done) break

                        buffer += decoder.decode(value, { stream: true })
                        const lines = buffer.split('\n')
                        // 最后一行可能不完整（跨 chunk 分片），保留到下次处理
                        buffer = lines.pop() || ''

                        for (const line of lines) {
                            const trimmed = line.trim()

                            // 跳过空行和 event: 行（LangGraph Agent 会推送 agent_status 等事件类型）
                            if (!trimmed || trimmed.startsWith('event:')) continue

                            if (trimmed.startsWith('data:')) {
                                const data = trimmed.slice(5).trim()
                                if (data === '[DONE]') continue
                                try {
                                    const parsed = JSON.parse(data)
                                    // 兼容两种格式：DeepSeek 格式和标准 SSE 格式
                                    const content = parsed.choices?.[0]?.delta?.content
                                        || parsed.content
                                        || ''
                                    if (content) {
                                        accumulated += content
                                        if (!ghostTextPluginKey.getState(editor._tiptapEditor.state)) {
                                            showGhostText(editor._tiptapEditor, accumulated)
                                        } else {
                                            updateGhostText(editor._tiptapEditor, accumulated)
                                        }
                                    }
                                } catch {
                                    // 跳过非 JSON 行
                                }
                            }
                        }
                    }
                } catch (e: any) {
                    if (e.name !== 'AbortError') {
                        // silently ignore
                    }
                }
            }, DEBOUNCE_MS)
        }

        const unsubscribe = editor.onChange(handleChange)

        return () => {
            unsubscribe?.()
            if (timerRef.current) clearTimeout(timerRef.current)
            if (abortRef.current) abortRef.current.abort()
        }
    }, [editor, chatFn])
}
