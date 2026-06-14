import { extractTextFromBlocks, PartialBlock } from '@lcw-doc/core'
import { Button } from '@lcw-doc/shadcn-shared-ui/components/ui/button'
import { ArrowUp, ClipboardList, Globe, ListChecks, MessageCircle, Sparkles, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import TextareaAutosize from 'react-textarea-autosize'

import { useEditorContext } from '@/context/EditorContext'
import { ChatMessage, chatWithAI } from '@/services'

interface AIReadingPanelProps {
    onClose: () => void
}

interface ChatMessageItem {
    role: 'user' | 'assistant'
    content: string
}

const SYSTEM_PROMPT =
    '你是一个专业的文档阅读助手。你可以帮助用户理解、总结、翻译和分析文档内容。请用中文回复，保持专业和友好的语气。回答时请基于提供的文档内容，如果文档中没有相关信息，请如实说明。'

const presetActions = [
    { icon: ClipboardList, title: '文档摘要', description: '一键生成文档精简摘要', prompt: '请为这篇文档生成一份精简摘要，概括核心内容和主旨。' },
    { icon: ListChecks, title: '要点提炼', description: '提取文档关键要点', prompt: '请提炼这篇文档的关键要点，以列表形式呈现。' },
    { icon: MessageCircle, title: '智能问答', description: '基于文档内容回答提问', prompt: '我已经阅读了这篇文档，请告诉我你可以回答哪些关于这篇文档的问题？' },
    { icon: Globe, title: '内容翻译', description: '将文档翻译为指定语言', prompt: '请将这篇文档的内容翻译为英文，保持原文的语义和风格。' },
]

export function AIReadingPanel({ onClose }: AIReadingPanelProps) {
    const { editor } = useEditorContext()
    const [input, setInput] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)
    const [streamContent, setStreamContent] = useState('')
    const [messages, setMessages] = useState<ChatMessageItem[]>([])
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
    const abortRef = useRef<AbortController | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
        const styleId = 'ai-reading-panel-animations'
        if (document.getElementById(styleId)) return
        const style = document.createElement('style')
        style.id = styleId
        style.textContent = `
            @keyframes aiReadingBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
            @keyframes aiReadingDotBounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-4px); } }
        `
        document.head.appendChild(style)
        return () => {
            document.getElementById(styleId)?.remove()
        }
    }, [])

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 50)
    }

    const getDocumentContext = (): string | undefined => {
        if (!editor) return undefined
        try {
            const blocks = editor.document
            const docText = extractTextFromBlocks(blocks as PartialBlock[], 6000)
            return docText
        } catch {
            return undefined
        }
    }

    const handleSend = async (prompt?: string) => {
        const content = prompt || input
        if (!content.trim() || isGenerating) return

        const userMessage: ChatMessageItem = { role: 'user', content }
        setMessages(prev => [...prev, userMessage])
        setInput('')
        setIsGenerating(true)
        setStreamContent('')

        const controller = new AbortController()
        abortRef.current = controller

        const context = getDocumentContext()
        const apiUserMessage: ChatMessage = { role: 'user', content }
        const apiMessages: ChatMessage[] = [...chatHistory, apiUserMessage]

        try {
            const response = await chatWithAI(apiMessages, controller.signal, {
                systemPrompt: SYSTEM_PROMPT,
                context,
            })

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
                            const delta = data.choices?.[0]?.delta?.content
                            if (delta) {
                                accumulated += delta
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
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                console.error('AI reading error:', err)
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

    const handlePresetClick = (action: (typeof presetActions)[number]) => {
        handleSend(action.prompt)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            if (!isGenerating) {
                handleSend()
            }
        }
    }

    return (
        <div className="w-80 lg:w-[400px] h-full border-l border-zinc-200 bg-white flex flex-col">
            <div className="flex items-center justify-between h-12 px-4 border-b border-zinc-200">
                <div className="flex items-center gap-2">
                    <Sparkles size={18} color="#6B45FF" />
                    <span className="font-medium">AI 阅读</span>
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
                    <X size={16} />
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {messages.length === 0 && !streamContent ? (
                    <div className="grid grid-cols-2 gap-3">
                        {presetActions.map(action => (
                            <div
                                key={action.title}
                                className="border border-zinc-200 rounded-lg p-3 cursor-pointer hover:shadow-sm hover:border-zinc-300 transition-colors"
                                onClick={() => handlePresetClick(action)}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <action.icon size={16} className="text-[#6B45FF]" />
                                    <span className="font-medium text-sm">{action.title}</span>
                                </div>
                                <p className="text-xs text-zinc-500">{action.description}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div
                                    className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                                        msg.role === 'user'
                                            ? 'bg-[#6B45FF] text-white rounded-br-sm'
                                            : 'bg-zinc-100 text-zinc-800 rounded-bl-sm'
                                    }`}
                                >
                                    {msg.role === 'assistant' ? (
                                        <div className="prose-sm">
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    h2: ({ children }) => (
                                                        <h2 className="font-semibold mt-4 mb-2 text-zinc-800">{children}</h2>
                                                    ),
                                                    h3: ({ children }) => (
                                                        <h3 className="font-medium mt-3 mb-1 text-zinc-800">{children}</h3>
                                                    ),
                                                    ul: ({ children }) => (
                                                        <ul className="list-disc pl-4 my-1">{children}</ul>
                                                    ),
                                                    ol: ({ children }) => (
                                                        <ol className="list-decimal pl-4 my-1">{children}</ol>
                                                    ),
                                                    code: ({ className, children, ...props }) => {
                                                        const isBlock = className?.includes('language-')
                                                        if (isBlock) {
                                                            return (
                                                                <code className="bg-zinc-200/60 rounded p-2 my-2 text-xs font-mono overflow-x-auto block">
                                                                    {children}
                                                                </code>
                                                            )
                                                        }
                                                        return (
                                                            <code className="bg-zinc-200/60 px-1 py-0.5 rounded text-xs font-mono" {...props}>
                                                                {children}
                                                            </code>
                                                        )
                                                    },
                                                    pre: ({ children }) => (
                                                        <pre className="bg-zinc-200/60 rounded p-2 my-2 text-xs font-mono overflow-x-auto">
                                                            {children}
                                                        </pre>
                                                    ),
                                                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                                                    a: ({ href, children }) => (
                                                        <a href={href} className="text-[#6B45FF] underline" target="_blank" rel="noopener noreferrer">
                                                            {children}
                                                        </a>
                                                    ),
                                                }}
                                            >
                                                {msg.content}
                                            </ReactMarkdown>
                                        </div>
                                    ) : (
                                        msg.content
                                    )}
                                </div>
                            </div>
                        ))}
                        {isGenerating && !streamContent && (
                            <div className="flex justify-start">
                                <div className="bg-zinc-100 rounded-xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
                                    {[0, 1, 2].map(i => (
                                        <span
                                            key={i}
                                            className="inline-block w-1.5 h-1.5 rounded-full bg-[#6B45FF]"
                                            style={{ animation: `aiReadingDotBounce 1.2s ${i * 0.15}s infinite ease-in-out` }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                        {streamContent && (
                            <div className="flex justify-start">
                                <div className="max-w-[85%] bg-zinc-100 text-zinc-800 rounded-xl rounded-bl-sm px-3 py-2 text-sm leading-relaxed">
                                    <div className="prose-sm">
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                h2: ({ children }) => (
                                                    <h2 className="font-semibold mt-4 mb-2 text-zinc-800">{children}</h2>
                                                ),
                                                h3: ({ children }) => (
                                                    <h3 className="font-medium mt-3 mb-1 text-zinc-800">{children}</h3>
                                                ),
                                                ul: ({ children }) => (
                                                    <ul className="list-disc pl-4 my-1">{children}</ul>
                                                ),
                                                ol: ({ children }) => (
                                                    <ol className="list-decimal pl-4 my-1">{children}</ol>
                                                ),
                                                code: ({ className, children, ...props }) => {
                                                    const isBlock = className?.includes('language-')
                                                    if (isBlock) {
                                                        return (
                                                            <code className="bg-zinc-200/60 rounded p-2 my-2 text-xs font-mono overflow-x-auto block">
                                                                {children}
                                                            </code>
                                                        )
                                                    }
                                                    return (
                                                        <code className="bg-zinc-200/60 px-1 py-0.5 rounded text-xs font-mono" {...props}>
                                                            {children}
                                                        </code>
                                                    )
                                                },
                                                pre: ({ children }) => (
                                                    <pre className="bg-zinc-200/60 rounded p-2 my-2 text-xs font-mono overflow-x-auto">
                                                        {children}
                                                    </pre>
                                                ),
                                                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                                                a: ({ href, children }) => (
                                                    <a href={href} className="text-[#6B45FF] underline" target="_blank" rel="noopener noreferrer">
                                                        {children}
                                                    </a>
                                                ),
                                            }}
                                        >
                                            {streamContent}
                                        </ReactMarkdown>
                                    </div>
                                    {isGenerating && (
                                        <span
                                            className="inline-block w-0.5 h-3.5 bg-[#6B45FF] ml-0.5 align-text-bottom"
                                            style={{ animation: 'aiReadingBlink 1s infinite' }}
                                        />
                                    )}
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-zinc-200">
                <div className="flex items-end gap-2 border border-zinc-200 rounded-lg p-2">
                    <TextareaAutosize
                        ref={textareaRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="问我关于这篇文档的任何问题..."
                        maxRows={4}
                        disabled={isGenerating}
                        className="flex-1 outline-none resize-none bg-transparent text-sm text-zinc-800 border-none px-1 py-0.5 leading-relaxed"
                    />
                    {isGenerating ? (
                        <button
                            onClick={handleCancel}
                            className="flex items-center justify-center w-7 h-7 rounded-md border border-zinc-200 bg-white cursor-pointer shrink-0"
                        >
                            <X size={14} className="text-zinc-500" />
                        </button>
                    ) : (
                        <button
                            onClick={() => handleSend()}
                            disabled={!input.trim()}
                            className="flex items-center justify-center w-7 h-7 rounded-md border-none cursor-pointer shrink-0 transition-all duration-150"
                            style={{
                                backgroundColor: input.trim() ? '#6B45FF' : '#ebebea',
                                color: input.trim() ? '#fff' : '#9b9a97',
                            }}
                        >
                            <ArrowUp size={14} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
