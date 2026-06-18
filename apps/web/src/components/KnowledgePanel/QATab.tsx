/**
 * 知识库问答 Tab
 *
 * 提供基于 RAG 索引的深度问答功能，支持：
 * - 当前文档 / 全部文档搜索范围切换
 * - 预设问题快捷按钮（始终可见）
 * - 多轮对话与来源引用
 * - 来源定位（点击跳转编辑器并高亮）
 * - 对话线程持久化（threadId）
 * - 新对话按钮（清空当前对话）
 *
 * 状态由父组件（Doc 页面级别）管理，确保标签页切换和抽屉关闭后不丢失。
 *
 * @module components/KnowledgePanel/QATab
 */
import { useCallback, useState } from 'react'
import {
    Bookmark,
    BookOpen,
    Globe,
    Lightbulb,
    ListChecks,
    MessageCircle,
    Plus,
    Send,
    Sparkles,
    Square,
    GitCompare,
    Target,
} from 'lucide-react'
import { Button } from '@lcw-doc/shadcn-shared-ui/components/ui/button'
import { useEditorContext } from '@/context/EditorContext'
import { ChatMessage, chatWithKnowledge, extractStructuredContextFromEditor, createBookmark, saveKnowledgeCard } from '@/services/ai'
import { useAIStream } from '@/hooks/useAIStream'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import TextareaAutosize from 'react-textarea-autosize'
import { useToast } from '@lcw-doc/shadcn-shared-ui/hooks/use-toast'

interface QATabProps {
    pageId: string
    indexStatus: { isIndexed: boolean; totalChunks: number } | null
    onIndex: () => void
    /** 对话消息列表（受控） */
    messages: Array<{ role: 'user' | 'assistant'; content: string }>
    onMessagesChange: (messages: Array<{ role: 'user' | 'assistant'; content: string }>) => void
    /** API 对话历史（受控） */
    chatHistory: ChatMessage[]
    onChatHistoryChange: (history: ChatMessage[]) => void
    /** 线程 ID（受控） */
    threadId: string | undefined
    onThreadIdChange: (id: string | undefined) => void
    /** 搜索范围（受控） */
    scope: 'current' | 'all'
    onScopeChange: (scope: 'current' | 'all') => void
}

/** 来源引用正则 - 支持单文档和跨文档两种格式 */
const SOURCE_REGEX = /\[来源:(?:\s*.*?-\s*)?\s*第(\d+)段\]\((?:pageId:([^/)]+)\/)?blockId:([^)]+)\)/g

/** 将来源引用替换为可点击的 HTML span */
function replaceSourceLinks(text: string): string {
    return text.replace(SOURCE_REGEX, (match, _chunkNum, pageId, blockId) => {
        return `<span class="source-link cursor-pointer text-purple-600 hover:underline" data-block-id="${blockId}" data-page-id="${pageId || ''}">${match}</span>`
    })
}

/** 临时高亮指定 block */
function highlightBlock(blockId: string, duration: number = 3000) {
    const domNode = document.querySelector(`[data-node-id="${blockId}"]`)
    if (domNode) {
        domNode.classList.add('knowledge-highlight')
        setTimeout(() => domNode.classList.remove('knowledge-highlight'), duration)
    }
}

/** 预设问题列表 */
const PRESET_QUESTIONS = [
    { label: '核心观点', icon: Lightbulb, prompt: '这篇文档的核心观点是什么？' },
    { label: '关键概念', icon: Target, prompt: '文档中涉及哪些关键概念？请逐一解释。' },
    { label: '逻辑结构', icon: ListChecks, prompt: '请分析这篇文档的逻辑结构和论证脉络。' },
    { label: '深入解读', icon: MessageCircle, prompt: '请对文档内容进行深入解读和分析。' },
    { label: '对比分析', icon: GitCompare, prompt: '文档中提到的概念之间有什么异同？' },
    { label: '应用场景', icon: Sparkles, prompt: '文档中的知识可以应用到哪些实际场景？' },
]

export default function QATab({
    pageId,
    indexStatus,
    onIndex,
    messages,
    onMessagesChange,
    chatHistory,
    onChatHistoryChange,
    threadId,
    onThreadIdChange,
    scope,
    onScopeChange,
}: QATabProps) {
    const { editor } = useEditorContext()
    const { toast } = useToast()
    const {
        content: streamContent,
        isGenerating,
        startStream,
        cancel,
    } = useAIStream({
        onDone: data => {
            if (data.threadId && !threadId) {
                onThreadIdChange(data.threadId)
            }
        },
    })
    const [input, setInput] = useState('')

    // 发送消息
    const handleSend = useCallback(
        async (prompt?: string) => {
            const userMessage = prompt || input.trim()
            if (!userMessage || !editor) return

            setInput('')
            // 乐观添加用户消息
            const updatedMessages = [...messages, { role: 'user' as const, content: userMessage }]
            onMessagesChange(updatedMessages)

            // 提取文档上下文
            const blocks = editor.document
            const context = extractStructuredContextFromEditor(blocks as any)

            // 构建 API 消息
            const apiMessages: ChatMessage[] = [...chatHistory, { role: 'user' as const, content: userMessage }]

            try {
                const result = await startStream(signal => chatWithKnowledge(apiMessages, pageId, threadId, signal, context, scope))

                // 更新对话历史
                const newHistory = [...apiMessages, { role: 'assistant' as const, content: result }]
                onChatHistoryChange(newHistory)
                onMessagesChange([...updatedMessages, { role: 'assistant', content: result }])
                if (!threadId) {
                    const newThreadId = `thread-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
                    onThreadIdChange(newThreadId)
                }
            } catch (error: any) {
                if (error.name !== 'AbortError') {
                    onMessagesChange([...updatedMessages, { role: 'assistant', content: '抱歉，生成回答时出现错误，请重试。' }])
                }
            }
        },
        [
            input,
            editor,
            messages,
            chatHistory,
            pageId,
            threadId,
            scope,
            startStream,
            onMessagesChange,
            onChatHistoryChange,
            onThreadIdChange,
        ]
    )

    // 新对话
    const handleNewChat = useCallback(() => {
        cancel()
        onMessagesChange([])
        onChatHistoryChange([])
        onThreadIdChange(undefined)
    }, [cancel, onMessagesChange, onChatHistoryChange, onThreadIdChange])

    // 点击来源引用
    const handleSourceClick = useCallback(
        (blockId: string, sourcePageId?: string) => {
            if (sourcePageId && sourcePageId !== pageId) {
                window.location.href = `/doc/${sourcePageId}`
                return
            }
            if (editor) {
                editor.focus()
                highlightBlock(blockId)
            }
        },
        [editor, pageId]
    )

    /** 处理消息内容区域的点击事件，捕获来源引用点击 */
    const handleContentClick = useCallback(
        (e: React.MouseEvent) => {
            const target = e.target as HTMLElement
            const blockId = target.dataset.blockId
            if (blockId) {
                handleSourceClick(blockId, target.dataset.pageId || undefined)
            }
        },
        [handleSourceClick]
    )

    // 收藏当前回答
    const handleBookmark = useCallback(
        async (content: string) => {
            try {
                await createBookmark({
                    sourcePageId: pageId,
                    title: content.slice(0, 50) + '...',
                    content,
                    question: messages.length > 0 ? messages[messages.length - 2]?.content : undefined,
                })
                toast({ title: '已收藏' })
            } catch {
                toast({ title: '收藏失败', variant: 'destructive' })
            }
        },
        [pageId, messages, toast]
    )

    // 保存为知识卡片
    const handleSaveCard = useCallback(
        async (content: string) => {
            try {
                await saveKnowledgeCard({
                    title: `知识卡片 - ${new Date().toLocaleDateString()}`,
                    content,
                    sourcePageId: pageId,
                })
                toast({ title: '知识卡片已保存' })
            } catch {
                toast({ title: '保存失败', variant: 'destructive' })
            }
        },
        [pageId, toast]
    )

    /** 渲染 Markdown 内容（含来源引用替换） */
    const renderAssistantContent = (content: string) => {
        const processedContent = replaceSourceLinks(content)
        return (
            <div
                onClick={handleContentClick}
                className="prose prose-sm max-w-none dark:prose-invert [&_.source-link]:cursor-pointer [&_.source-link]:text-purple-600 [&_.source-link]:hover:underline"
            >
                <ReactMarkdown remarkPlugins={[remarkGfm]} allowedElements={undefined}>
                    {processedContent}
                </ReactMarkdown>
            </div>
        )
    }

    // 未索引提示
    if (!indexStatus?.isIndexed) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4 p-6 text-center">
                <BookOpen size={40} className="text-muted-foreground" />
                <p className="text-sm text-muted-foreground">请先索引文档以启用知识库问答</p>
                <Button onClick={onIndex} className="bg-brand text-brand-foreground">
                    索引文档
                </Button>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full">
            {/* 搜索范围切换 + 新对话按钮 */}
            <div className="flex items-center justify-between gap-1 px-4 py-2 border-b">
                <div className="flex gap-1">
                    <button
                        onClick={() => onScopeChange('current')}
                        className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs ${
                            scope === 'current' ? 'bg-brand text-brand-foreground' : 'bg-muted text-muted-foreground'
                        }`}
                    >
                        <BookOpen size={10} /> 当前文档
                    </button>
                    <button
                        onClick={() => onScopeChange('all')}
                        className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs ${
                            scope === 'all' ? 'bg-brand text-brand-foreground' : 'bg-muted text-muted-foreground'
                        }`}
                    >
                        <Globe size={10} /> 全部文档
                    </button>
                </div>
                {messages.length > 0 && (
                    <button
                        onClick={handleNewChat}
                        className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                        <Plus size={12} /> 新对话
                    </button>
                )}
            </div>

            {/* 消息区域 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* 对话消息列表 */}
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div
                            className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                                msg.role === 'user' ? 'bg-brand text-brand-foreground' : 'bg-muted'
                            }`}
                        >
                            {msg.role === 'assistant' ? renderAssistantContent(msg.content) : msg.content}
                            {/* 操作按钮（仅 assistant 消息） */}
                            {msg.role === 'assistant' && idx === messages.length - 1 && !isGenerating && (
                                <div className="flex gap-2 mt-2 pt-2 border-t border-border/50">
                                    <button
                                        onClick={() => handleSaveCard(msg.content)}
                                        className="text-xs text-muted-foreground hover:text-brand"
                                    >
                                        保存为卡片
                                    </button>
                                    <button
                                        onClick={() => handleBookmark(msg.content)}
                                        className="text-xs text-muted-foreground hover:text-brand"
                                    >
                                        收藏
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {/* 流式生成中 */}
                {isGenerating && (
                    <div className="flex justify-start">
                        <div className="max-w-[85%] rounded-lg px-3 py-2 text-sm bg-muted">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamContent}</ReactMarkdown>
                            <span className="inline-block w-1.5 h-4 bg-brand animate-pulse ml-0.5" />
                        </div>
                    </div>
                )}

                {/* 预设问题 — 始终可见，有对话时显示为紧凑样式 */}
                <div className={`${messages.length > 0 ? 'pt-2 border-t' : ''}`}>
                    {messages.length === 0 && <p className="text-xs text-muted-foreground mb-2">试试以下问题：</p>}
                    <div className={`grid gap-1.5 ${messages.length === 0 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                        {PRESET_QUESTIONS.map(q => (
                            <button
                                key={q.label}
                                onClick={() => handleSend(q.prompt)}
                                className={`flex items-center gap-1.5 rounded-md border transition-colors ${
                                    messages.length === 0
                                        ? 'flex-col p-3 hover:border-brand hover:bg-brand/5'
                                        : 'px-2 py-1.5 text-xs hover:border-brand hover:bg-brand/5'
                                }`}
                            >
                                <q.icon size={messages.length === 0 ? 16 : 12} className="text-brand shrink-0" />
                                <span className={`${messages.length === 0 ? 'text-xs' : 'text-[11px]'} truncate`}>{q.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* 输入区域 */}
            <div className="border-t p-3">
                <div className="flex gap-2">
                    <TextareaAutosize
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleSend()
                            }
                        }}
                        placeholder="输入问题..."
                        maxRows={4}
                        className="flex-1 resize-none rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand"
                    />
                    {isGenerating ? (
                        <Button variant="outline" size="icon" onClick={cancel} className="h-9 w-9 shrink-0">
                            <Square size={14} />
                        </Button>
                    ) : (
                        <Button size="icon" onClick={() => handleSend()} disabled={!input.trim()} className="h-9 w-9 shrink-0 bg-brand">
                            <Send size={14} className="text-brand-foreground" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
