import { chatWithAI, type ChatMessage } from '@/services'
import { createVueBlockSpec } from '@lcw-doc/vue'
import { defineComponent, h, ref } from 'vue'

export const AI = createVueBlockSpec(
    {
        type: 'ai',
        propSchema: {
            status: { default: 'idle', values: ['idle', 'generating', 'done', 'error'] },
            prompt: { default: '' },
        },
        content: 'none',
    },
    {
        render: defineComponent({
            props: ['block', 'editor', 'contentRef'],
            setup(props) {
                const inputValue = ref('')
                const streamContent = ref('')
                const error = ref('')
                const abortRef = ref<AbortController | null>(null)

                async function handleGenerate(promptText: string) {
                    if (!promptText.trim()) return

                    const editor = (props as any).editor
                    const blockId = (props as any).block.id

                    editor.updateBlock(blockId, {
                        type: 'ai',
                        props: { status: 'generating', prompt: promptText },
                    })
                    streamContent.value = ''
                    error.value = ''

                    const abortController = new AbortController()
                    abortRef.value = abortController

                    try {
                        const messages: ChatMessage[] = [
                            {
                                role: 'system',
                                content:
                                    '你是一个专业的文档编辑助手。请根据用户的要求处理文本内容，直接输出处理结果，不要添加多余的解释。',
                            },
                            { role: 'user', content: promptText },
                        ]

                        const response = await chatWithAI(messages, abortController.signal)
                        if (!response.ok) {
                            throw new Error(`AI 请求失败: ${response.status}`)
                        }

                        const reader = response.body?.getReader()
                        if (!reader) throw new Error('无法读取响应流')

                        const decoder = new TextDecoder()
                        let accumulated = ''
                        let sseBuffer = ''

                        while (true) {
                            const { done, value } = await reader.read()
                            if (done) break

                            sseBuffer += decoder.decode(value, { stream: true })
                            const lines = sseBuffer.split('\n')
                            sseBuffer = lines.pop() || ''

                            for (const line of lines) {
                                if (line.startsWith('data: ')) {
                                    const dataStr = line.slice(6).trim()
                                    if (dataStr === '[DONE]') continue
                                    try {
                                        const data = JSON.parse(dataStr)
                                        if (
                                            data.base_resp?.status_code &&
                                            data.base_resp.status_code !== 0
                                        ) {
                                            throw new Error(
                                                data.base_resp.status_msg || 'AI 服务错误',
                                            )
                                        }
                                        const content = data.choices?.[0]?.delta?.content
                                        if (content) {
                                            accumulated += content
                                            streamContent.value = accumulated
                                        }
                                    } catch (e: any) {
                                        if (e.message && !e.message.includes('JSON')) {
                                            throw e
                                        }
                                    }
                                }
                            }
                        }

                        editor.updateBlock(blockId, {
                            type: 'ai',
                            props: { status: 'done', prompt: promptText },
                        })
                    } catch (err: any) {
                        if (err.name !== 'AbortError') {
                            error.value = err.message || 'AI 生成失败'
                            editor.updateBlock(blockId, {
                                type: 'ai',
                                props: { status: 'error', prompt: promptText },
                            })
                        }
                    } finally {
                        abortRef.value = null
                    }
                }

                function handleStop() {
                    abortRef.value?.abort()
                    const editor = (props as any).editor
                    editor.updateBlock((props as any).block.id, {
                        type: 'ai',
                        props: { status: 'done' },
                    })
                }

                async function handleAccept() {
                    const editor = (props as any).editor
                    const content = streamContent.value || ''
                    try {
                        const blocks = await editor.tryParseMarkdownToBlocks(content)
                        editor.replaceBlocks([(props as any).block.id], blocks)
                    } catch {
                        editor.replaceBlocks([(props as any).block.id], [
                            {
                                type: 'paragraph',
                                content: content
                                    ? [{ type: 'text', text: content, styles: {} }]
                                    : undefined,
                            },
                        ])
                    }
                }

                function handleDiscard() {
                    const editor = (props as any).editor
                    editor.removeBlocks([(props as any).block.id])
                }

                function handleRegenerate() {
                    const editor = (props as any).editor
                    streamContent.value = ''
                    error.value = ''
                    editor.updateBlock((props as any).block.id, {
                        type: 'ai',
                        props: { status: 'idle' },
                    })
                }

                function handleRetry() {
                    const editor = (props as any).editor
                    const prompt = (props as any).block?.props?.prompt || ''
                    streamContent.value = ''
                    error.value = ''
                    if (prompt) {
                        handleGenerate(prompt)
                    } else {
                        editor.updateBlock((props as any).block.id, {
                            type: 'ai',
                            props: { status: 'idle' },
                        })
                    }
                }

                function handleKeyDown(e: KeyboardEvent) {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleGenerate(inputValue.value)
                    }
                }

                return () => {
                    const status = (props as any).block?.props?.status || 'idle'
                    const blockPrompt = (props as any).block?.props?.prompt || ''

                    return h(
                        'div',
                        {
                            style: {
                                border: '1px solid #e9e9e7',
                                borderRadius: '8px',
                                backgroundColor: '#f7f6f3',
                                overflow: 'hidden',
                            },
                        },
                        renderAIState(
                            status,
                            inputValue,
                            streamContent,
                            error,
                            blockPrompt,
                            {
                                handleGenerate,
                                handleStop,
                                handleAccept,
                                handleDiscard,
                                handleRegenerate,
                                handleRetry,
                                handleKeyDown,
                                inputValue,
                            },
                        ),
                    )
                }
            },
        }),
    },
)

function renderAIState(
    status: string,
    inputValue: { value: string },
    streamContent: { value: string },
    error: { value: string },
    blockPrompt: string,
    handlers: Record<string, any>,
) {
    const { handleGenerate, handleStop, handleAccept, handleDiscard, handleRegenerate, handleRetry, handleKeyDown } =
        handlers

    if (status === 'idle') {
        return h(
            'div',
            { style: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px' } },
            [
                h(
                    'span',
                    {
                        style: {
                            display: 'flex',
                            alignItems: 'center',
                            flexShrink: 0,
                            color: '#6B45FF',
                        },
                    },
                    '✨',
                ),
                h('input', {
                    type: 'text',
                    value: inputValue.value,
                    onInput: (e: any) => (inputValue.value = e.target.value),
                    onKeydown: handleKeyDown,
                    placeholder: '输入提示，AI 将为你生成内容...',
                    style: {
                        flex: 1,
                        border: 'none',
                        outline: 'none',
                        backgroundColor: 'transparent',
                        fontSize: '14px',
                        color: '#37352f',
                    },
                }),
                h(
                    'button',
                    {
                        onClick: () => handleGenerate(inputValue.value),
                        disabled: !inputValue.value.trim(),
                        style: {
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: inputValue.value.trim() ? '#6B45FF' : '#ebebea',
                            color: inputValue.value.trim() ? '#fff' : '#9b9a97',
                            cursor: inputValue.value.trim() ? 'pointer' : 'default',
                            transition: 'all 0.15s',
                        },
                    },
                    '→',
                ),
            ],
        )
    }

    if (status === 'generating') {
        return h('div', { style: { padding: '12px' } }, [
            h(
                'div',
                {
                    style: {
                        fontSize: '14px',
                        color: '#37352f',
                        lineHeight: '1.6',
                        whiteSpace: 'pre-wrap',
                    },
                },
                [
                    streamContent.value,
                    h('span', {
                        style: {
                            display: 'inline-block',
                            width: '2px',
                            height: '16px',
                            backgroundColor: '#6B45FF',
                            marginLeft: '2px',
                            verticalAlign: 'text-bottom',
                        },
                    }),
                ],
            ),
            h(
                'div',
                { style: { marginTop: '8px', display: 'flex', justifyContent: 'flex-end' } },
                [
                    h(
                        'button',
                        {
                            onClick: handleStop,
                            style: {
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 10px',
                                borderRadius: '4px',
                                border: '1px solid #e9e9e7',
                                backgroundColor: '#fff',
                                color: '#787774',
                                fontSize: '12px',
                                cursor: 'pointer',
                            },
                        },
                        '✕ 停止',
                    ),
                ],
            ),
        ])
    }

    if (status === 'done') {
        return h('div', { style: { padding: '12px' } }, [
            h(
                'div',
                {
                    style: {
                        fontSize: '14px',
                        color: '#37352f',
                        lineHeight: '1.6',
                        whiteSpace: 'pre-wrap',
                    },
                },
                streamContent.value,
            ),
            h(
                'div',
                {
                    style: {
                        marginTop: '8px',
                        paddingTop: '8px',
                        borderTop: '1px solid #e9e9e7',
                        display: 'flex',
                        gap: '6px',
                    },
                },
                [
                    h(
                        'button',
                        {
                            onClick: handleAccept,
                            style: {
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 10px',
                                borderRadius: '4px',
                                border: '1px solid #e9e9e7',
                                backgroundColor: '#fff',
                                color: '#37352f',
                                fontSize: '12px',
                                cursor: 'pointer',
                            },
                        },
                        '✓ 接受',
                    ),
                    h(
                        'button',
                        {
                            onClick: handleRegenerate,
                            style: {
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 10px',
                                borderRadius: '4px',
                                border: '1px solid #e9e9e7',
                                backgroundColor: '#fff',
                                color: '#787774',
                                fontSize: '12px',
                                cursor: 'pointer',
                            },
                        },
                        '↻ 重新生成',
                    ),
                    h(
                        'button',
                        {
                            onClick: handleDiscard,
                            style: {
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 10px',
                                borderRadius: '4px',
                                border: '1px solid #e9e9e7',
                                backgroundColor: '#fff',
                                color: '#eb5757',
                                fontSize: '12px',
                                cursor: 'pointer',
                            },
                        },
                        '✕ 丢弃',
                    ),
                ],
            ),
        ])
    }

    if (status === 'error') {
        return h('div', { style: { padding: '12px' } }, [
            h(
                'div',
                {
                    style: {
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#eb5757',
                        fontSize: '14px',
                    },
                },
                ['⚠', h('span', error.value || 'AI 生成失败')],
            ),
            h(
                'div',
                { style: { marginTop: '8px', display: 'flex', gap: '6px' } },
                [
                    h(
                        'button',
                        {
                            onClick: handleRetry,
                            style: {
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 10px',
                                borderRadius: '4px',
                                border: '1px solid #e9e9e7',
                                backgroundColor: '#fff',
                                color: '#37352f',
                                fontSize: '12px',
                                cursor: 'pointer',
                            },
                        },
                        '↻ 重试',
                    ),
                    h(
                        'button',
                        {
                            onClick: handleDiscard,
                            style: {
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 10px',
                                borderRadius: '4px',
                                border: '1px solid #e9e9e7',
                                backgroundColor: '#fff',
                                color: '#eb5757',
                                fontSize: '12px',
                                cursor: 'pointer',
                            },
                        },
                        '✕ 丢弃',
                    ),
                ],
            ),
        ])
    }

    return null
}
