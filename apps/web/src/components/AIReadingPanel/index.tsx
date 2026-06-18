import { cn } from '@lcw-doc/shadcn-shared-ui/lib/utils'
import { ArrowUp, ClipboardList, Globe, ListChecks, MessageCircle, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import TextareaAutosize from 'react-textarea-autosize'
import remarkGfm from 'remark-gfm'

import { useEditorContext } from '@/context/EditorContext'
import { useAIStream } from '@/hooks/useAIStream'
import { ChatMessage, chatWithAgent, extractStructuredContextFromEditor, StructuredContext } from '@/services'

type AIReadingPanelProps = Record<string, unknown>

interface ChatMessageItem {
    role: 'user' | 'assistant'
    content: string
}

const SYSTEM_PROMPT =
    '你是一个专业的文档阅读助手。你可以帮助用户理解、总结、翻译和分析文档内容。请用中文回复，保持专业和友好的语气。回答时请基于提供的文档内容，如果文档中没有相关信息，请如实说明。'

const presetActions = [
    {
        icon: ClipboardList,
        title: '文档摘要',
        description: '一键生成文档精简摘要',
        prompt: '请为这篇文档生成一份精简摘要，概括核心内容和主旨。',
    },
    { icon: ListChecks, title: '要点提炼', description: '提取文档关键要点', prompt: '请提炼这篇文档的关键要点，以列表形式呈现。' },
    {
        icon: MessageCircle,
        title: '智能问答',
        description: '基于文档内容回答提问',
        prompt: '我已经阅读了这篇文档，请告诉我你可以回答哪些关于这篇文档的问题？',
    },
    { icon: Globe, title: '内容翻译', description: '将文档翻译为指定语言', prompt: '请将这篇文档的内容翻译为英文，保持原文的语义和风格。' },
]

export function AIReadingPanel(_props: AIReadingPanelProps) {
    const { editor } = useEditorContext()
    const [input, setInput] = useState('')
    const [messages, setMessages] = useState<ChatMessageItem[]>([])
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // 使用统一的 AI 流式 Hook
    const { content: streamContent, isGenerating, startStream, cancel } = useAIStream()

    // 流式内容更新时自动滚动到底部
    useEffect(() => {
        if (streamContent) scrollToBottom()
    }, [streamContent])

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 50)
    }

    const handleSend = async (prompt?: string) => {
        const content = prompt || input
        if (!content.trim() || isGenerating) return

        const userMessage: ChatMessageItem = { role: 'user', content }
        setMessages(prev => [...prev, userMessage])
        setInput('')

        // 提取编辑器结构化上下文
        let context: StructuredContext | undefined
        if (editor) {
            try {
                const blocks = editor.document as any[]
                context = extractStructuredContextFromEditor(blocks)
            } catch {
                void 0
            }
        }

        const apiUserMessage: ChatMessage = { role: 'user', content }
        const systemMessage: ChatMessage = { role: 'system', content: SYSTEM_PROMPT }
        const apiMessages: ChatMessage[] = [systemMessage, ...chatHistory, apiUserMessage]

        // startStream 返回累积的完整内容，避免闭包陷阱
        const result = await startStream(async signal => {
            return chatWithAgent(apiMessages, context, undefined, signal)
        })

        // 使用返回值更新消息历史
        if (result) {
            setChatHistory(prev => [...prev, apiUserMessage, { role: 'assistant', content: result }])
            const assistantMessage: ChatMessageItem = { role: 'assistant', content: result }
            setMessages(prev => [...prev, assistantMessage])
        }
    }

    const handleCancel = () => {
        cancel()
        if (streamContent) {
            const assistantMessage: ChatMessageItem = { role: 'assistant', content: streamContent }
            setMessages(prev => [...prev, assistantMessage])
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
        <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto p-4">
                {messages.length === 0 && !streamContent ? (
                    <div className="grid grid-cols-2 gap-3">
                        {presetActions.map(action => (
                            <div
                                key={action.title}
                                className="border border-zinc-200 rounded-lg p-3 cursor-pointer hover:shadow-sm hover:border-brand/30 transition-colors"
                                onClick={() => handlePresetClick(action)}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <action.icon size={16} className="text-brand" />
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
                                    className={cn(
                                        'max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed',
                                        msg.role === 'user'
                                            ? 'bg-brand text-brand-foreground rounded-br-sm'
                                            : 'bg-zinc-100 text-zinc-800 rounded-bl-sm'
                                    )}
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
                                                    ul: ({ children }) => <ul className="list-disc pl-4 my-1">{children}</ul>,
                                                    ol: ({ children }) => <ol className="list-decimal pl-4 my-1">{children}</ol>,
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
                                                            <code
                                                                className="bg-zinc-200/60 px-1 py-0.5 rounded text-xs font-mono"
                                                                {...props}
                                                            >
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
                                                        <a
                                                            href={href}
                                                            className="text-brand underline"
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
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
                                            className="inline-block w-1.5 h-1.5 rounded-full bg-brand animate-dot-bounce"
                                            style={{ animationDelay: `${i * 0.15}s` }}
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
                                                h2: ({ children }) => <h2 className="font-semibold mt-4 mb-2 text-zinc-800">{children}</h2>,
                                                h3: ({ children }) => <h3 className="font-medium mt-3 mb-1 text-zinc-800">{children}</h3>,
                                                ul: ({ children }) => <ul className="list-disc pl-4 my-1">{children}</ul>,
                                                ol: ({ children }) => <ol className="list-decimal pl-4 my-1">{children}</ol>,
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
                                                    <a
                                                        href={href}
                                                        className="text-brand underline"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        {children}
                                                    </a>
                                                ),
                                            }}
                                        >
                                            {streamContent}
                                        </ReactMarkdown>
                                    </div>
                                    {isGenerating && (
                                        <span className="inline-block w-0.5 h-3.5 bg-brand ml-0.5 align-text-bottom animate-cursor-blink" />
                                    )}
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-zinc-100">
                <div className="flex items-end gap-2 border border-zinc-200 rounded-lg p-2 focus-within:border-brand/50 transition-colors">
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
                            className="flex items-center justify-center w-7 h-7 rounded-md border border-zinc-200 bg-white cursor-pointer shrink-0 transition-colors hover:bg-zinc-50"
                        >
                            <X size={14} className="text-zinc-500" />
                        </button>
                    ) : (
                        <button
                            onClick={() => handleSend()}
                            disabled={!input.trim()}
                            className={cn(
                                'flex items-center justify-center w-7 h-7 rounded-md border-none cursor-pointer shrink-0 transition-all duration-150',
                                input.trim() ? 'bg-brand text-brand-foreground hover:bg-brand/90' : 'bg-zinc-100 text-zinc-400'
                            )}
                        >
                            <ArrowUp size={14} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
