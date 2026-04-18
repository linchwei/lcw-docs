import { createReactBlockSpec } from '@lcw-doc/react'
import { AlertTriangle, Check, Loader2, RotateCcw, Send, Sparkles, X } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'

import { chatWithAI, ChatMessage } from '@/services'

export const AI = createReactBlockSpec(
    {
        type: 'ai',
        propSchema: {
            status: { default: 'idle', values: ['idle', 'generating', 'done', 'error'] },
            prompt: { default: '' },
        },
        content: 'none',
    },
    {
        render: props => {
            const blockId = props.block.id
            const status = props.block.props.status || 'idle'

            return (
                <AIBlockContent
                    editor={props.editor}
                    blockId={blockId}
                    status={status}
                    prompt={props.block.props.prompt || ''}
                />
            )
        },
    }
)

function AIBlockContent({ editor, blockId, status, prompt: initialPrompt }: {
    editor: any
    blockId: string
    status: string
    prompt: string
}) {
    const [inputValue, setInputValue] = useState('')
    const [streamContent, setStreamContent] = useState('')
    const [error, setError] = useState('')
    const abortRef = useRef<AbortController | null>(null)

    const handleGenerate = useCallback(async (promptText: string) => {
        if (!promptText.trim()) return

        editor.updateBlock(blockId, { type: 'ai', props: { status: 'generating', prompt: promptText } })
        setStreamContent('')
        setError('')

        const abortController = new AbortController()
        abortRef.current = abortController

        try {
            const messages: ChatMessage[] = [
                { role: 'system', content: '你是一个专业的文档编辑助手。请根据用户的要求处理文本内容，直接输出处理结果，不要添加多余的解释。' },
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
                            if (data.base_resp?.status_code && data.base_resp.status_code !== 0) {
                                throw new Error(data.base_resp.status_msg || 'AI 服务错误')
                            }
                            const content = data.choices?.[0]?.delta?.content
                            if (content) {
                                accumulated += content
                                setStreamContent(accumulated)
                            }
                        } catch (e: any) {
                            if (e.message && !e.message.includes('JSON')) {
                                throw e
                            }
                        }
                    }
                }
            }

            editor.updateBlock(blockId, { type: 'ai', props: { status: 'done', prompt: promptText } })
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                setError(err.message || 'AI 生成失败')
                editor.updateBlock(blockId, { type: 'ai', props: { status: 'error', prompt: promptText } })
            }
        } finally {
            abortRef.current = null
        }
    }, [editor, blockId])

    const handleStop = useCallback(() => {
        abortRef.current?.abort()
        editor.updateBlock(blockId, { type: 'ai', props: { status: 'done' } })
    }, [editor, blockId])

    const handleAccept = useCallback(async () => {
        const content = streamContent || ''
        try {
            const blocks = await editor.tryParseMarkdownToBlocks(content)
            editor.replaceBlocks([blockId], blocks)
        } catch {
            editor.replaceBlocks([blockId], [{
                type: 'paragraph',
                content: content ? [{ type: 'text', text: content, styles: {} }] : undefined,
            }])
        }
    }, [editor, blockId, streamContent])

    const handleDiscard = useCallback(() => {
        editor.removeBlocks([blockId])
    }, [editor, blockId])

    const handleRegenerate = useCallback(() => {
        setStreamContent('')
        setError('')
        editor.updateBlock(blockId, { type: 'ai', props: { status: 'idle' } })
    }, [editor, blockId])

    const handleRetry = useCallback(() => {
        setStreamContent('')
        setError('')
        if (initialPrompt) {
            handleGenerate(initialPrompt)
        } else {
            editor.updateBlock(blockId, { type: 'ai', props: { status: 'idle' } })
        }
    }, [editor, blockId, initialPrompt, handleGenerate])

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleGenerate(inputValue)
        }
    }, [inputValue, handleGenerate])

    return (
        <div style={{
            border: '1px solid #e9e9e7',
            borderRadius: '8px',
            backgroundColor: '#f7f6f3',
            overflow: 'hidden',
        }}>
            {status === 'idle' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px' }}>
                    <Sparkles size={18} color="#6B45FF" style={{ flexShrink: 0 }} />
                    <input
                        type="text"
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="输入提示，AI 将为你生成内容..."
                        style={{
                            flex: 1,
                            border: 'none',
                            outline: 'none',
                            backgroundColor: 'transparent',
                            fontSize: '14px',
                            color: '#37352f',
                        }}
                        autoFocus
                    />
                    <button
                        onClick={() => handleGenerate(inputValue)}
                        disabled={!inputValue.trim()}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: inputValue.trim() ? '#6B45FF' : '#ebebea',
                            color: inputValue.trim() ? '#fff' : '#9b9a97',
                            cursor: inputValue.trim() ? 'pointer' : 'default',
                            transition: 'all 0.15s',
                        }}
                    >
                        <Send size={14} />
                    </button>
                </div>
            )}

            {status === 'generating' && (
                <div style={{ padding: '12px' }}>
                    <div style={{ fontSize: '14px', color: '#37352f', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                        {streamContent}
                        <span style={{
                            display: 'inline-block',
                            width: '2px',
                            height: '16px',
                            backgroundColor: '#6B45FF',
                            marginLeft: '2px',
                            verticalAlign: 'text-bottom',
                            animation: 'blink 1s infinite',
                        }} />
                    </div>
                    <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                            onClick={handleStop}
                            style={{
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
                            }}
                        >
                            <X size={12} /> 停止
                        </button>
                    </div>
                </div>
            )}

            {status === 'done' && (
                <div style={{ padding: '12px' }}>
                    <div style={{ fontSize: '14px', color: '#37352f', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                        {streamContent}
                    </div>
                    <div style={{
                        marginTop: '8px',
                        paddingTop: '8px',
                        borderTop: '1px solid #e9e9e7',
                        display: 'flex',
                        gap: '6px',
                    }}>
                        <button
                            onClick={handleAccept}
                            style={{
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
                            }}
                        >
                            <Check size={12} /> 接受
                        </button>
                        <button
                            onClick={handleRegenerate}
                            style={{
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
                            }}
                        >
                            <RotateCcw size={12} /> 重新生成
                        </button>
                        <button
                            onClick={handleDiscard}
                            style={{
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
                            }}
                        >
                            <X size={12} /> 丢弃
                        </button>
                    </div>
                </div>
            )}

            {status === 'error' && (
                <div style={{ padding: '12px' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#eb5757',
                        fontSize: '14px',
                    }}>
                        <AlertTriangle size={16} />
                        <span>{error || 'AI 生成失败'}</span>
                    </div>
                    <div style={{ marginTop: '8px', display: 'flex', gap: '6px' }}>
                        <button
                            onClick={handleRetry}
                            style={{
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
                            }}
                        >
                            <RotateCcw size={12} /> 重试
                        </button>
                        <button
                            onClick={handleDiscard}
                            style={{
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
                            }}
                        >
                            <X size={12} /> 丢弃
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
