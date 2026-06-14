import { extractTextFromBlocks, PartialBlock } from '@lcw-doc/core'
import { ArrowUp, Copy, FileInput, FileText, Lightbulb, MessageSquare, PenLine, Plus, RotateCcw, Search, Sparkles, X } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useEffect, useRef, useState } from 'react'
import TextareaAutosize from 'react-textarea-autosize'
import { useHotkeys } from 'react-hotkeys-hook'

import { useEditorContext } from '@/context/EditorContext'
import { ChatMessage, ChatOptions, chatWithAI } from '@/services'

const SYSTEM_PROMPT =
    '你是一个专业的文档编辑助手。你可以帮助用户撰写、改写、翻译和总结文档内容。请用中文回复，保持专业和友好的语气。当用户提供文档上下文时，请基于上下文内容进行回答。'

const suggestions = [
    { icon: PenLine, label: '帮我润色这段文字', prompt: '请帮我润色以下文字，使其更加流畅专业：' },
    { icon: FileText, label: '总结当前文档要点', prompt: '请总结当前文档的关键要点，以列表形式呈现。' },
    { icon: Lightbulb, label: '给我一些写作灵感', prompt: '请给我一些关于当前主题的写作灵感和建议。' },
    { icon: Search, label: '解释选中的内容', prompt: '请用通俗易懂的语言解释以下内容：' },
]

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
    const [copiedIdx, setCopiedIdx] = useState<number | null>(null)
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const dragStart = useRef({ x: 0, y: 0 })
    const abortRef = useRef<AbortController | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useHotkeys('mod+j', () => {
        setIsOpen(prev => !prev)
    }, { enableOnFormTags: false })

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

    useEffect(() => {
        if (!isDragging) return
        const handleMouseMove = (e: MouseEvent) => {
            setPosition({
                x: e.clientX - dragStart.current.x,
                y: e.clientY - dragStart.current.y,
            })
        }
        const handleMouseUp = () => setIsDragging(false)
        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isDragging])

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true)
        dragStart.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        }
    }

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 50)
    }

    const handleSend = async (overrideKeyword?: string) => {
        const text = overrideKeyword ?? keyword
        if (!text.trim() || isGenerating) return

        setIsGenerating(true)
        setStreamContent('')
        setLastBlocks(null)

        const userMessage: ChatMessageItem = { role: 'user', content: text }
        setMessages(prev => [...prev, userMessage])
        if (!overrideKeyword) setKeyword('')

        const controller = new AbortController()
        abortRef.current = controller

        let context: string | undefined
        if (editor) {
            try {
                const blocks = editor.document
                const docText = extractTextFromBlocks(blocks as PartialBlock[], 3000)
                context = docText
            } catch {
                void 0
            }
        }

        const systemContent = context ? `${SYSTEM_PROMPT}\n\n当前文档内容：\n${context}` : SYSTEM_PROMPT

        const apiUserMessage: ChatMessage = { role: 'user', content: userMessage.content }
        const apiMessages: ChatMessage[] = [...chatHistory, apiUserMessage]

        try {
            const options: ChatOptions = {
                systemPrompt: systemContent,
            }
            const response = await chatWithAI(apiMessages, controller.signal, options)
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

            setChatHistory(prev => [...prev, apiUserMessage, { role: 'assistant', content: accumulated }])

            if (editor && accumulated) {
                try {
                    const blocks = await editor.tryParseMarkdownToBlocks(accumulated)
                    setLastBlocks(blocks as PartialBlock[])
                } catch {
                    setLastBlocks([
                        {
                            type: 'paragraph',
                            content: [{ type: 'text', text: accumulated, styles: {} }],
                        },
                    ])
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
    }

    const handleCancel = () => {
        abortRef.current?.abort()
        setIsGenerating(false)
        if (streamContent) {
            const assistantMessage: ChatMessageItem = { role: 'assistant', content: streamContent }
            setMessages(prev => [...prev, assistantMessage])
            setStreamContent('')
        }
    }

    const handleInsertToDoc = () => {
        if (!editor || !lastBlocks) return

        try {
            const currentBlock = editor.getTextCursorPosition().block
            editor.insertBlocks(lastBlocks, currentBlock, 'after')
            setLastBlocks(null)
        } catch (err) {
            console.error('Insert to doc error:', err)
        }
    }

    const handleCopy = async (content: string, idx: number) => {
        await navigator.clipboard.writeText(content)
        setCopiedIdx(idx)
        setTimeout(() => setCopiedIdx(null), 1500)
    }

    const handleRegenerate = () => {
        const lastUserIdx = [...messages].reverse().findIndex(m => m.role === 'user')
        if (lastUserIdx === -1) return
        const actualIdx = messages.length - 1 - lastUserIdx
        const lastUserMsg = messages[actualIdx]

        const newMessages = messages.slice(0, actualIdx)
        setMessages(newMessages)
        setChatHistory(prev => prev.slice(0, actualIdx))
        setLastBlocks(null)

        setTimeout(() => handleSend(lastUserMsg.content), 0)
    }

    const handleNewConversation = () => {
        setMessages([])
        setChatHistory([])
        setStreamContent('')
        setLastBlocks(null)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            if (!isGenerating) {
                handleSend()
            }
        }
    }

    const panelStyle = position.x === 0 && position.y === 0
        ? {
            position: 'fixed' as const,
            bottom: '24px',
            right: '24px',
            width: '420px',
            height: '560px',
            backgroundColor: '#fff',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid #e9e9e7',
            display: 'flex',
            flexDirection: 'column' as const,
            zIndex: 9999,
            overflow: 'hidden',
        }
        : {
            position: 'fixed' as const,
            bottom: '24px',
            right: '24px',
            width: '420px',
            height: '560px',
            backgroundColor: '#fff',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid #e9e9e7',
            display: 'flex',
            flexDirection: 'column' as const,
            zIndex: 9999,
            overflow: 'hidden',
            transform: `translate(${position.x}px, ${position.y}px)`,
        }

    return (
        <>
            {isOpen && (
                <div style={panelStyle}>
                    <div
                        onMouseDown={handleMouseDown}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 16px',
                            borderBottom: '1px solid #f0f0ee',
                            cursor: isDragging ? 'grabbing' : 'grab',
                            userSelect: 'none',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Sparkles size={18} color="#6B45FF" />
                            <span style={{ fontSize: '14px', fontWeight: 600, color: '#37352f' }}>AI 助手</span>
                            {editor && (
                                <span
                                    style={{
                                        fontSize: '11px',
                                        color: '#6B45FF',
                                        backgroundColor: '#f0ebff',
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                    }}
                                >
                                    已连接编辑器
                                </span>
                            )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <button
                                onClick={handleNewConversation}
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
                                <Plus size={16} />
                            </button>
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
                    </div>

                    <div
                        style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                        }}
                    >
                        {messages.length === 0 && !streamContent && (
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: '100%',
                                    gap: '16px',
                                }}
                            >
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#9b9a97' }}>
                                    <MessageSquare size={32} color="#d4d4d4" />
                                    <span style={{ fontSize: '13px' }}>向 AI 助手提问，开始对话</span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', width: '100%' }}>
                                    {suggestions.map((s) => (
                                        <div
                                            key={s.label}
                                            className="rounded-lg border border-zinc-200 p-3 cursor-pointer hover:border-zinc-300 hover:shadow-sm transition-all"
                                            onClick={() => handleSend(s.prompt)}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#787774' }}>
                                                <s.icon size={14} />
                                                <span style={{ fontSize: '12px', color: '#37352f' }}>{s.label}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className="group"
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                }}
                            >
                                <div
                                    style={{
                                        maxWidth: '85%',
                                        padding: '8px 12px',
                                        borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                                        backgroundColor: msg.role === 'user' ? '#6B45FF' : '#f7f6f3',
                                        color: msg.role === 'user' ? '#fff' : '#37352f',
                                        fontSize: '13px',
                                        lineHeight: '1.6',
                                        wordBreak: 'break-word',
                                    }}
                                >
                                    {msg.role === 'user' ? (
                                        <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
                                    ) : (
                                        <div className="[&_h2]:font-semibold [&_h2]:text-sm [&_h2]:mt-3 [&_h2]:mb-1 [&_h3]:font-medium [&_h3]:text-sm [&_h3]:mt-2 [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:my-1 [&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:my-1 [&_pre]:bg-black/5 [&_pre]:rounded [&_pre]:p-2 [&_pre]:my-2 [&_pre]:text-xs [&_pre]:font-mono [&_pre]:overflow-x-auto [&_code]:bg-black/5 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_strong]:font-semibold [&_a]:text-[#6B45FF] [&_a]:underline">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                                        </div>
                                    )}
                                </div>
                                {msg.role === 'assistant' && i === messages.length - 1 && !isGenerating && (
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ display: 'flex', gap: '2px', marginTop: '4px' }}>
                                        <button
                                            onClick={() => handleCopy(msg.content, i)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                height: '28px',
                                                width: '28px',
                                                padding: 0,
                                                borderRadius: '6px',
                                                border: 'none',
                                                backgroundColor: 'transparent',
                                                cursor: 'pointer',
                                                color: '#787774',
                                                fontSize: '11px',
                                            }}
                                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f5f5f4')}
                                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                                        >
                                            {copiedIdx === i ? <span style={{ fontSize: '11px', color: '#6B45FF' }}>已复制</span> : <Copy size={14} />}
                                        </button>
                                        <button
                                            onClick={handleRegenerate}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                height: '28px',
                                                width: '28px',
                                                padding: 0,
                                                borderRadius: '6px',
                                                border: 'none',
                                                backgroundColor: 'transparent',
                                                cursor: 'pointer',
                                                color: '#787774',
                                            }}
                                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f5f5f4')}
                                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                                        >
                                            <RotateCcw size={14} />
                                        </button>
                                        {editor && lastBlocks && (
                                            <button
                                                onClick={handleInsertToDoc}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    height: '28px',
                                                    width: '28px',
                                                    padding: 0,
                                                    borderRadius: '6px',
                                                    border: 'none',
                                                    backgroundColor: 'transparent',
                                                    cursor: 'pointer',
                                                    color: '#787774',
                                                }}
                                                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f5f5f4')}
                                                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                                            >
                                                <FileInput size={14} />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                        {isGenerating && !streamContent && (
                            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                                <div
                                    style={{
                                        padding: '12px 16px',
                                        borderRadius: '12px 12px 12px 4px',
                                        backgroundColor: '#f7f6f3',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                    }}
                                >
                                    {[0, 1, 2].map(i => (
                                        <span
                                            key={i}
                                            style={{
                                                display: 'inline-block',
                                                width: '6px',
                                                height: '6px',
                                                borderRadius: '50%',
                                                backgroundColor: '#6B45FF',
                                                animation: `globalAiDotBounce 1.2s ${i * 0.15}s infinite ease-in-out`,
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                        {streamContent && (
                            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                                <div
                                    style={{
                                        maxWidth: '85%',
                                        padding: '8px 12px',
                                        borderRadius: '12px 12px 12px 4px',
                                        backgroundColor: '#f7f6f3',
                                        color: '#37352f',
                                        fontSize: '13px',
                                        lineHeight: '1.6',
                                        wordBreak: 'break-word',
                                    }}
                                >
                                    <div className="[&_h2]:font-semibold [&_h2]:text-sm [&_h2]:mt-3 [&_h2]:mb-1 [&_h3]:font-medium [&_h3]:text-sm [&_h3]:mt-2 [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:my-1 [&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:my-1 [&_pre]:bg-black/5 [&_pre]:rounded [&_pre]:p-2 [&_pre]:my-2 [&_pre]:text-xs [&_pre]:font-mono [&_pre]:overflow-x-auto [&_code]:bg-black/5 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_strong]:font-semibold [&_a]:text-[#6B45FF] [&_a]:underline">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamContent}</ReactMarkdown>
                                    </div>
                                    {isGenerating && (
                                        <span
                                            style={{
                                                display: 'inline-block',
                                                width: '2px',
                                                height: '14px',
                                                backgroundColor: '#6B45FF',
                                                marginLeft: '1px',
                                                verticalAlign: 'text-bottom',
                                                animation: 'globalAiBlink 1s infinite',
                                            }}
                                        />
                                    )}
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div
                        style={{
                            padding: '12px 16px',
                            borderTop: '1px solid #f0f0ee',
                            backgroundColor: '#fafaf9',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'flex-end',
                                gap: '8px',
                                backgroundColor: '#fff',
                                border: '1px solid #e9e9e7',
                                borderRadius: '8px',
                                padding: '8px',
                            }}
                        >
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
                                    onClick={() => handleSend()}
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
