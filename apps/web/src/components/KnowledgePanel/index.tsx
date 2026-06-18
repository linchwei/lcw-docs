/**
 * 知识库面板主组件
 *
 * 提供个人知识库 AI 助手的完整交互界面。
 * 包含 6 个功能 Tab：问答、发现、标签、图谱、收藏、管理。
 *
 * 设计原则：
 * - 由 ResizableDrawer 包裹，宽度由抽屉控制
 * - Tab 切换承载多功能
 * - 索引状态始终可见
 * - 懒加载各 Tab 组件
 * - 集成自动增量索引 Hook
 *
 * @module components/KnowledgePanel
 */
import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { BookOpen, Compass, Tag, Share2, Bookmark, Settings } from 'lucide-react'
import { Button } from '@lcw-doc/shadcn-shared-ui/components/ui/button'
import { cn } from '@lcw-doc/shadcn-shared-ui/lib/utils'
import { useEditorContext } from '@/context/EditorContext'
import { getKnowledgeStatus, indexForKnowledge, extractStructuredContextFromEditor } from '@/services'
import { ChatMessage } from '@/services/ai'
import { useAutoIndex } from '@/hooks/useAutoIndex'

/** Tab 类型定义 */
type KnowledgeTab = 'qa' | 'discover' | 'tags' | 'graph' | 'bookmarks' | 'manage'

/** 面板 Props */
interface KnowledgePanelProps {
    /** 当前文档 ID */
    pageId: string
    /** QA 对话消息列表 */
    qaMessages: Array<{ role: 'user' | 'assistant'; content: string }>
    onQaMessagesChange: (messages: Array<{ role: 'user' | 'assistant'; content: string }>) => void
    /** QA API 对话历史 */
    qaChatHistory: ChatMessage[]
    onQaChatHistoryChange: (history: ChatMessage[]) => void
    /** QA 线程 ID */
    qaThreadId: string | undefined
    onQaThreadIdChange: (id: string | undefined) => void
    /** QA 搜索范围 */
    qaScope: 'current' | 'all'
    onQaScopeChange: (scope: 'current' | 'all') => void
}

/** 懒加载各 Tab 组件 */
const QATab = lazy(() => import('./QATab'))
const DiscoverTab = lazy(() => import('./DiscoverTab'))
const TagsTab = lazy(() => import('./TagsTab'))
const GraphTab = lazy(() => import('./GraphTab'))
const BookmarksTab = lazy(() => import('./BookmarksTab'))
const ManageTab = lazy(() => import('./ManageTab'))

/** 索引状态接口 */
interface IndexStatus {
    isIndexed: boolean
    totalChunks: number
    embeddedChunks: number
    unembeddedChunks: number
    lastIndexedAt: string | null
}

export function KnowledgePanel({
    pageId,
    qaMessages,
    onQaMessagesChange,
    qaChatHistory,
    onQaChatHistoryChange,
    qaThreadId,
    onQaThreadIdChange,
    qaScope,
    onQaScopeChange,
}: KnowledgePanelProps) {
    const { editor } = useEditorContext()
    const [activeTab, setActiveTab] = useState<KnowledgeTab>('qa')
    const [indexStatus, setIndexStatus] = useState<IndexStatus | null>(null)
    const [isIndexing, setIsIndexing] = useState(false)

    /** 从编辑器提取 blocks 的回调（供 useAutoIndex 使用） */
    const getBlocks = useCallback(async () => {
        if (!editor) return []
        return editor.document.map((block: any) => ({
            id: block.id,
            type: block.type,
            content: typeof block.content === 'string' ? block.content : JSON.stringify(block.content),
            ...(block.props?.level ? { level: block.props.level } : {}),
        }))
    }, [editor])

    // 自动增量索引 Hook
    const { isIndexing: autoIndexing } = useAutoIndex({
        pageId,
        isIndexed: indexStatus?.isIndexed ?? false,
        getBlocks,
    })

    // 加载索引状态
    const loadIndexStatus = useCallback(async () => {
        if (!pageId) return
        try {
            const status = await getKnowledgeStatus(pageId)
            setIndexStatus(status)
        } catch {
            setIndexStatus({ isIndexed: false, totalChunks: 0, embeddedChunks: 0, unembeddedChunks: 0, lastIndexedAt: null })
        }
    }, [pageId])

    useEffect(() => {
        loadIndexStatus()
    }, [loadIndexStatus])

    // 触发索引
    const handleIndexDocument = useCallback(async () => {
        if (!editor || !pageId || isIndexing) return
        setIsIndexing(true)
        try {
            const blocks = await getBlocks()
            await indexForKnowledge(pageId, blocks)
            await loadIndexStatus()
        } catch (error) {
            console.error('索引失败:', error)
        } finally {
            setIsIndexing(false)
        }
    }, [editor, pageId, isIndexing, loadIndexStatus, getBlocks])

    // Tab 配置
    const tabs: Array<{ key: KnowledgeTab; label: string; icon: any }> = [
        { key: 'qa', label: '问答', icon: BookOpen },
        { key: 'discover', label: '发现', icon: Compass },
        { key: 'tags', label: '标签', icon: Tag },
        { key: 'graph', label: '图谱', icon: Share2 },
        { key: 'bookmarks', label: '收藏', icon: Bookmark },
        { key: 'manage', label: '管理', icon: Settings },
    ]

    return (
        <div className="h-full flex flex-col">
            {/* Tab 切换 */}
            <div className="flex border-b border-zinc-200 overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={cn(
                            'flex items-center gap-1 px-3 py-2.5 text-xs whitespace-nowrap border-b-2 transition-colors cursor-pointer',
                            activeTab === tab.key
                                ? 'border-brand text-brand font-medium'
                                : 'border-transparent text-zinc-500 hover:text-zinc-800',
                        )}
                    >
                        <tab.icon size={12} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* 索引状态条 */}
            <div className="px-4 py-2 border-b border-zinc-100 bg-zinc-50/50">
                {isIndexing || autoIndexing ? (
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <div className="animate-spin h-3 w-3 border-2 border-brand border-t-transparent rounded-full" />
                        正在索引...
                    </div>
                ) : indexStatus?.isIndexed ? (
                    <div className="flex items-center justify-between text-xs text-zinc-500">
                        <span>已索引 {indexStatus.totalChunks} 个分块</span>
                        <span>{indexStatus.embeddedChunks}/{indexStatus.totalChunks} 已嵌入</span>
                    </div>
                ) : (
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-zinc-500">未索引</span>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleIndexDocument}
                            className="h-6 text-xs border-brand text-brand hover:bg-brand/5"
                        >
                            索引文档
                        </Button>
                    </div>
                )}
            </div>

            {/* Tab 内容 — 使用 CSS hidden 代替条件渲染，避免组件卸载丢失状态 */}
            <div className="flex-1 overflow-y-auto relative">
                <Suspense fallback={<div className="p-4 text-center text-sm text-zinc-500">加载中...</div>}>
                    <div className={activeTab === 'qa' ? '' : 'hidden'}>
                        <QATab
                            pageId={pageId}
                            indexStatus={indexStatus}
                            onIndex={handleIndexDocument}
                            messages={qaMessages}
                            onMessagesChange={onQaMessagesChange}
                            chatHistory={qaChatHistory}
                            onChatHistoryChange={onQaChatHistoryChange}
                            threadId={qaThreadId}
                            onThreadIdChange={onQaThreadIdChange}
                            scope={qaScope}
                            onScopeChange={onQaScopeChange}
                        />
                    </div>
                    <div className={activeTab === 'discover' ? '' : 'hidden'}>
                        <DiscoverTab pageId={pageId} />
                    </div>
                    <div className={activeTab === 'tags' ? '' : 'hidden'}>
                        <TagsTab pageId={pageId} />
                    </div>
                    <div className={activeTab === 'graph' ? '' : 'hidden'}>
                        <GraphTab pageId={pageId} />
                    </div>
                    <div className={activeTab === 'bookmarks' ? '' : 'hidden'}>
                        <BookmarksTab />
                    </div>
                    <div className={activeTab === 'manage' ? '' : 'hidden'}>
                        <ManageTab pageId={pageId} indexStatus={indexStatus} onIndex={handleIndexDocument} onLoadStatus={loadIndexStatus} />
                    </div>
                </Suspense>
            </div>
        </div>
    )
}

export default KnowledgePanel
