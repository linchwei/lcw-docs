import { PartialBlock } from '@lcw-doc/core'
import { ArrowUp, FileInput, MessageSquare, Sparkles, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import TextareaAutosize from 'react-textarea-autosize'

import { useEditorContext } from '@/context/EditorContext'
import { chatWithAI, ChatMessage } from '@/services'

const SYSTEM_PROMPT = '你是一个专业的文档编辑助手。你可以帮助用户撰写、改写、翻译和总结文档内容。请用中文回复，保持专业和友好的语气。当用户提供文档上下文时，请基于上下文内容进行回答。'

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

interface ChatMessageItem {
    role: 'user' | 'assistant'
    content: string
}

export function GlobalAIChat() {
    const { editor } = useEditorContext()
    const [isOpen, setIsOpen] = useState(false)
    const [keyword, setKeyword] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)
    const [streamContent, setStreamContent] = useState('')
    const [messages, setMessages] = useState<ChatMessageItem[]>([])
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
    const [lastBlocks, setLastBlocks] = useState<PartialBlock[] | null>(null)
    const abortRef = useRef<AbortController | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const styleId = 'global-ai-chat-animations'
        if (document.getElementById(styleId)) return
        const style = document.createElement('style')
        style.id = styleId
        style.textContent = `
            @keyframes globalAiBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
            @keyframes globalAiDotBounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-4px); } }
        `
        document.head.appendChild(style)
        return () => {
            document.getElementById(styleId)?.remove()
        }
    }, [])

    const scrollToBottom = useCallback(() => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 50)
    }, [])

    const handleSend = useCallback(async () => {
        if (!keyword.trim() || isGenerating) return

        setIsGenerating(true)
        setStreamContent('')
        setLastBlocks(null)

        const userMessage: ChatMessageItem = { role: 'user', content: keyword }
        setMessages(prev => [...prev, userMessage])
        setKeyword('')

        const controller = new AbortController()
        abortRef.current = controller

        let context: string | undefined
        if (editor) {
            try {
                const blocks = editor.document
                const docText = extractTextFromBlocks(blocks)
                context = docText.slice(0, 3000)
            } catch {}
        }

        const systemContent = context
            ? `${SYSTEM_PROMPT}\n\n当前文档内容：\n${context}`
            : SYSTEM_PROMPT

        const apiUserMessage: ChatMessage = { role: 'user', content: userMessage.content }
        const apiMessages: ChatMessage[] = [
            { role: 'system', content: systemContent },
            ...chatHistory,
            apiUserMessage,
        ]

        try {
            const response = await chatWithAI(apiMessages, controller.signal)
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
                                scrollToBottom()
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

            const assistantMessage: ChatMessageItem = { role: 'assistant', content: accumulated }
            setMessages(prev => [...prev, assistantMessage])
            setStreamContent('')

            setChatHistory(prev => [
                ...prev,
                apiUserMessage,
                { role: 'assistant', content: accumulated },
            ])

            if (editor && accumulated) {
                try {
                    const blocks = await editor.tryParseMarkdownToBlocks(accumulated)
                    setLastBlocks(blocks)
                } catch {
                    setLastBlocks([{
                        type: 'paragraph',
                        content: [{ type: 'text', text: accumulated, styles: {} }],
                    }])
                }
            }
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                console.error('AI chat error:', err)
                const errorMessage: ChatMessageItem = { role: 'assistant', content: `出错了：${err.message}` }
                setMessages(prev => [...prev, errorMessage])
                setStreamContent('')
            }
            setIsGenerating(false)
        }
    }, [keyword, isGenerating, chatHistory, editor, scrollToBottom])

    const handleCancel = useCallback(() => {
        abortRef.current?.abort()
        setIsGenerating(false)
        if (streamContent) {
            const assistantMessage: ChatMessageItem = { role: 'assistant', content: streamContent }
            setMessages(prev => [...prev, assistantMessage])
            setStreamContent('')
        }
    }, [streamContent])

    const handleInsertToDoc = useCallback(() => {
        if (!editor || !lastBlocks) return

        try {
            const currentBlock = editor.getTextCursorPosition().block
            editor.insertBlocks(lastBlocks, currentBlock, 'after')
            setLastBlocks(null)
        } catch (err) {
            console.error('Insert to doc error:', err)
        }
    }, [editor, lastBlocks])

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            if (!isGenerating) {
                handleSend()
            }
        }
    }, [isGenerating, handleSend])

    return (
        <>
            {isOpen && (
                <div style={{
                    position: 'fixed',
                    bottom: '24px',
                    right: '24px',
                    width: '400px',
                    height: '520px',
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
                    border: '1px solid #e9e9e7',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 9999,
                    overflow: 'hidden',
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        borderBottom: '1px solid #f0f0ee',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Sparkles size={18} color="#6B45FF" />
                            <span style={{ fontSize: '14px', fontWeight: 600, color: '#37352f' }}>AI 助手</span>
                            {editor && (
                                <span style={{
                                    fontSize: '11px',
                                    color: '#6B45FF',
                                    backgroundColor: '#f0ebff',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                }}>
                                    已连接编辑器
                                </span>
                            )}
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '28px',
                                height: '28px',
                                borderRadius: '6px',
                                border: 'none',
                                backgroundColor: 'transparent',
                                cursor: 'pointer',
                                color: '#787774',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f5f5f4')}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                            <X size={16} />
                        </button>
                    </div>

                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                    }}>
                        {messages.length === 0 && !streamContent && (
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '100%',
                                color: '#9b9a97',
                                gap: '8px',
                            }}>
                                <MessageSquare size={32} color="#d4d4d4" />
                                <span style={{ fontSize: '13px' }}>向 AI 助手提问，开始对话</span>
                            </div>
                        )}
                        {messages.map((msg, i) => (
                            <div key={i} style={{
                                display: 'flex',
                                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                            }}>
                                <div style={{
                                    maxWidth: '85%',
                                    padding: '8px 12px',
                                    borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                                    backgroundColor: msg.role === 'user' ? '#6B45FF' : '#f7f6f3',
                                    color: msg.role === 'user' ? '#fff' : '#37352f',
                                    fontSize: '13px',
                                    lineHeight: '1.6',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                }}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {isGenerating && !streamContent && (
                            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                                <div style={{
                                    padding: '12px 16px',
                                    borderRadius: '12px 12px 12px 4px',
                                    backgroundColor: '#f7f6f3',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                }}>
                                    {[0, 1, 2].map(i => (
                                        <span key={i} style={{
                                            display: 'inline-block',
                                            width: '6px',
                                            height: '6px',
                                            borderRadius: '50%',
                                            backgroundColor: '#6B45FF',
                                            animation: `globalAiDotBounce 1.2s ${i * 0.15}s infinite ease-in-out`,
                                        }} />
                                    ))}
                                </div>
                            </div>
                        )}
                        {streamContent && (
                            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                                <div style={{
                                    maxWidth: '85%',
                                    padding: '8px 12px',
                                    borderRadius: '12px 12px 12px 4px',
                                    backgroundColor: '#f7f6f3',
                                    color: '#37352f',
                                    fontSize: '13px',
                                    lineHeight: '1.6',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
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
                                            animation: 'globalAiBlink 1s infinite',
                                        }} />
                                    )}
                                </div>
                            </div>
                        )}
                        {lastBlocks && editor && (
                            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                                <button
                                    onClick={handleInsertToDoc}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '8px 14px',
                                        borderRadius: '8px',
                                        border: '1px solid #6B45FF',
                                        backgroundColor: '#fff',
                                        color: '#6B45FF',
                                        fontSize: '13px',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        transition: 'all 0.15s',
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.backgroundColor = '#6B45FF'
                                        e.currentTarget.style.color = '#fff'
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.backgroundColor = '#fff'
                                        e.currentTarget.style.color = '#6B45FF'
                                    }}
                                >
                                    <FileInput size={14} />
                                    插入文档
                                </button>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div style={{
                        padding: '12px 16px',
                        borderTop: '1px solid #f0f0ee',
                        backgroundColor: '#fafaf9',
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'flex-end',
                            gap: '8px',
                            backgroundColor: '#fff',
                            border: '1px solid #e9e9e7',
                            borderRadius: '8px',
                            padding: '8px',
                        }}>
                            <TextareaAutosize
                                disabled={isGenerating}
                                placeholder="输入消息..."
                                autoFocus
                                maxRows={4}
                                style={{
                                    flex: 1,
                                    outline: 'none',
                                    padding: '0 4px',
                                    resize: 'none',
                                    backgroundColor: 'transparent',
                                    fontSize: '13px',
                                    color: '#37352f',
                                    border: 'none',
                                    lineHeight: '1.5',
                                }}
                                value={keyword}
                                onChange={e => setKeyword(e.target.value)}
                                onKeyDown={handleKeyDown}
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
                </div>
            )}

            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    style={{
                        position: 'fixed',
                        bottom: '24px',
                        right: '24px',
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        border: 'none',
                        backgroundColor: '#6B45FF',
                        color: '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(107, 69, 255, 0.3)',
                        transition: 'all 0.2s',
                        zIndex: 9998,
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.transform = 'scale(1.08)'
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.transform = 'scale(1)'
                    }}
                >
                    <Sparkles size={22} />
                </button>
            )}
        </>
    )
}
