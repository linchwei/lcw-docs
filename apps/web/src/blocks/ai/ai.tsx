import { createReactBlockSpec } from '@lcw-doc/react'
import { AlertTriangle, Check, RotateCcw, Send, Sparkles, X } from 'lucide-react'
import { useState, useRef } from 'react'

import { ChatMessage, chatWithAgent } from '@/services'
import { useAIStream } from '@/hooks/useAIStream'

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

            return <AIBlockContent editor={props.editor} blockId={blockId} status={status} prompt={props.block.props.prompt || ''} />
        },
    }
)

function AIBlockContent({
    editor,
    blockId,
    status,
    prompt: initialPrompt,
}: {
    editor: any
    blockId: string
    status: string
    prompt: string
}) {
    const [inputValue, setInputValue] = useState('')
    const [error, setError] = useState('')

    // 使用统一的 AI 流式 Hook
    const { content: streamContent, isGenerating, startStream, cancel } = useAIStream()
    // 保存 startStream 返回值到 ref，避免 handleAccept 闭包陷阱
    const resultRef = useRef<string>('')

    const handleGenerate = async (promptText: string) => {
        if (!promptText.trim()) return

        editor.updateBlock(blockId, { type: 'ai', props: { status: 'generating', prompt: promptText } })
        setError('')

        const messages: ChatMessage[] = [
            {
                role: 'system',
                content: '你是一个专业的文档编辑助手。请根据用户的要求处理文本内容，直接输出处理结果，不要添加多余的解释。',
            },
            { role: 'user', content: promptText },
        ]

        try {
            const result = await startStream(async (signal) => {
                return chatWithAgent(messages, undefined, undefined, signal)
            })
            resultRef.current = result || ''

            editor.updateBlock(blockId, { type: 'ai', props: { status: 'done', prompt: promptText } })
        } catch (err: unknown) {
            if (err instanceof Error && err.name !== 'AbortError') {
                setError(err.message || 'AI 生成失败')
                editor.updateBlock(blockId, { type: 'ai', props: { status: 'error', prompt: promptText } })
            }
        }
    }

    const handleStop = () => {
        cancel()
        editor.updateBlock(blockId, { type: 'ai', props: { status: 'done' } })
    }

    const handleAccept = async () => {
        const content = resultRef.current || streamContent || ''
        try {
            const blocks = await editor.tryParseMarkdownToBlocks(content)
            editor.replaceBlocks([blockId], blocks)
        } catch {
            editor.replaceBlocks(
                [blockId],
                [
                    {
                        type: 'paragraph',
                        content: content ? [{ type: 'text', text: content, styles: {} }] : undefined,
                    },
                ]
            )
        }
    }

    const handleDiscard = () => {
        editor.removeBlocks([blockId])
    }

    const handleRegenerate = () => {
        setError('')
        editor.updateBlock(blockId, { type: 'ai', props: { status: 'idle' } })
    }

    const handleRetry = () => {
        setError('')
        if (initialPrompt) {
            handleGenerate(initialPrompt)
        } else {
            editor.updateBlock(blockId, { type: 'ai', props: { status: 'idle' } })
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleGenerate(inputValue)
        }
    }

    return (
        <div
            style={{
                border: '1px solid #e9e9e7',
                borderRadius: '8px',
                backgroundColor: '#f7f6f3',
                overflow: 'hidden',
            }}
        >
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
                        <span
                            style={{
                                display: 'inline-block',
                                width: '2px',
                                height: '16px',
                                backgroundColor: '#6B45FF',
                                marginLeft: '2px',
                                verticalAlign: 'text-bottom',
                                animation: 'blink 1s infinite',
                            }}
                        />
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
                    <div style={{ fontSize: '14px', color: '#37352f', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{streamContent}</div>
                    <div
                        style={{
                            marginTop: '8px',
                            paddingTop: '8px',
                            borderTop: '1px solid #e9e9e7',
                            display: 'flex',
                            gap: '6px',
                        }}
                    >
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
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: '#eb5757',
                            fontSize: '14px',
                        }}
                    >
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
