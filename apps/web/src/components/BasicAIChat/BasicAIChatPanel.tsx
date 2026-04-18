import { LcwDocEditor, PartialBlock } from '@lcw-doc/core'
import { ArrowUp, Sparkles, X } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import TextareaAutosize from 'react-textarea-autosize'

import { chatWithAI, ChatMessage } from '@/services'

interface BasicAIChatPanelProps {
    editor?: LcwDocEditor
    onResponse?: (response: PartialBlock[]) => void
}

function extractTextFromBlocks(blocks: PartialBlock[]): string {
    let text = ''
    for (const block of blocks) {
        if (block.content) {
            if (typeof block.content === 'string') {
                text += block.content + '\n'
            } else if (Array.isArray(block.content)) {
                for (const inline of block.content) {
                    if (inline.type === 'text' && inline.text) {
                        text += inline.text
                    }
                }
                text += '\n'
            }
        }
        if (block.children) {
            text += extractTextFromBlocks(block.children)
        }
    }
    return text
}

const SYSTEM_PROMPT = '你是一个专业的文档编辑助手。你可以帮助用户撰写、改写、翻译和总结文档内容。请用中文回复，保持专业和友好的语气。当用户提供文档上下文时，请基于上下文内容进行回答。'

export function BasicAIChatPanel(props: BasicAIChatPanelProps) {
    const [keyword, setKeyword] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)
    const [streamContent, setStreamContent] = useState('')
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
    const abortRef = useRef<AbortController | null>(null)

    const handleSend = useCallback(async () => {
        if (!keyword.trim() || isGenerating) return

        setIsGenerating(true)
        setStreamContent('')

        const controller = new AbortController()
        abortRef.current = controller

        let context: string | undefined
        if (props.editor) {
            try {
                const blocks = props.editor.document
                const docText = extractTextFromBlocks(blocks)
                context = docText.slice(0, 3000)
            } catch {}
        }

        const systemContent = context
            ? `${SYSTEM_PROMPT}\n\n当前文档内容：\n${context}`
            : SYSTEM_PROMPT

        const userMessage: ChatMessage = { role: 'user', content: keyword }
        const messages: ChatMessage[] = [
            { role: 'system', content: systemContent },
            ...chatHistory,
            userMessage,
        ]

        try {
            const response = await chatWithAI(messages, controller.signal)
            if (!response.ok) {
                throw new Error(`请求失败: ${response.status}`)
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

            setIsGenerating(false)
            setKeyword('')

            setChatHistory(prev => [
                ...prev,
                userMessage,
                { role: 'assistant', content: accumulated },
            ])

            let blocks: PartialBlock[]
            try {
                if (props.editor) {
                    blocks = await props.editor.tryParseMarkdownToBlocks(accumulated)
                } else {
                    blocks = [{
                        type: 'paragraph',
                        content: [{ type: 'text', text: accumulated, styles: {} }],
                    }]
                }
            } catch {
                blocks = [{
                    type: 'paragraph',
                    content: [{ type: 'text', text: accumulated, styles: {} }],
                }]
            }

            if (props.onResponse) {
                props.onResponse(blocks)
            }
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                console.error('AI chat error:', err)
            }
            setIsGenerating(false)
        }
    }, [keyword, isGenerating, chatHistory, props.onResponse, props.editor])

    const handleCancel = useCallback(() => {
        abortRef.current?.abort()
        setIsGenerating(false)
    }, [])

    const ref = useHotkeys(
        'Enter',
        () => {
            if (!isGenerating) {
                handleSend()
            }
        },
        {
            enableOnFormTags: true,
        }
    )

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            padding: '8px',
            backgroundColor: '#f7f6f3',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            border: '1px solid #e9e9e7',
        }}>
            {streamContent && (
                <div style={{
                    fontSize: '13px',
                    color: '#37352f',
                    lineHeight: '1.5',
                    padding: '4px 8px',
                    marginBottom: '8px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap',
                }}>
                    {streamContent}
                    {isGenerating && (
                        <span style={{
                            display: 'inline-block',
                            width: '2px',
                            height: '14px',
                            backgroundColor: '#6B45FF',
                            marginLeft: '1px',
                            verticalAlign: 'text-bottom',
                            animation: 'blink 1s infinite',
                        }} />
                    )}
                </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ flexShrink: 0, paddingTop: '2px' }}>
                    <Sparkles color="#6B45FF" size={18} />
                </div>
                <TextareaAutosize
                    disabled={isGenerating}
                    ref={ref as any}
                    placeholder="请输入你想书写的主题，我来帮你发挥"
                    autoFocus
                    style={{
                        flex: 1,
                        outline: 'none',
                        padding: '0 8px',
                        resize: 'none',
                        backgroundColor: 'transparent',
                        fontSize: '13px',
                        color: '#37352f',
                        border: 'none',
                    }}
                    value={keyword}
                    onChange={e => setKeyword(e.target.value)}
                />
                {isGenerating ? (
                    <button
                        onClick={handleCancel}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            border: '1px solid #e9e9e7',
                            backgroundColor: '#fff',
                            cursor: 'pointer',
                            flexShrink: 0,
                        }}
                    >
                        <X size={14} color="#787774" />
                    </button>
                ) : (
                    <button
                        onClick={handleSend}
                        disabled={!keyword.trim()}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: keyword.trim() ? '#6B45FF' : '#ebebea',
                            color: keyword.trim() ? '#fff' : '#9b9a97',
                            cursor: keyword.trim() ? 'pointer' : 'default',
                            transition: 'all 0.15s',
                            flexShrink: 0,
                        }}
                    >
                        <ArrowUp size={14} />
                    </button>
                )}
            </div>
        </div>
    )
}
