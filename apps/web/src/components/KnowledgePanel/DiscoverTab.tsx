/**
 * 知识发现 Tab
 *
 * 提供多种知识发现功能，支持：
 * - 智能摘要：AI 生成文档关键要点与核心结论
 * - 关联文档：发现与当前文档语义相关的其他文档
 * - 学习路径：推荐相关文档的阅读顺序
 * - 全局搜索：跨所有已索引文档的语义搜索
 *
 * @module components/KnowledgePanel/DiscoverTab
 */
import { Button } from '@lcw-doc/shadcn-shared-ui/components/ui/button'
import { useToast } from '@lcw-doc/shadcn-shared-ui/hooks/use-toast'
import { BookOpen, Globe, Lightbulb, Loader2, Map, Search, Sparkles } from 'lucide-react'
import { useState } from 'react'

import { useEditorContext } from '@/context/EditorContext'
import {
    extractStructuredContextFromEditor,
    generateLearningPath,
    getRelatedDocuments,
    knowledgeGlobalSearch,
    smartSummary,
    StructuredContext,
} from '@/services/ai'

interface DiscoverTabProps {
    pageId: string
}

/** 智能摘要结果 */
interface SmartSummaryResult {
    keyPoints: string[]
    coreConclusion: string
    suggestedActions: string[]
    readingTime: string
}

/** 关联文档结果 */
interface RelatedDocsResult {
    pageId: string
    title?: string
    score: number
    matchedContent: string
}

/** 学习路径结果 */
interface LearningPathResult {
    path: Array<{ pageId: string; title: string; reason: string; order: number }>
}

/** 全局搜索结果 */
interface GlobalSearchResult {
    pageId: string
    title?: string
    blockId: string
    content: string
    score: number
}

/** 功能卡片定义 */
const featureCards = [
    { key: 'summary', icon: Lightbulb, title: '智能摘要', desc: 'AI 生成文档关键要点与核心结论' },
    { key: 'related', icon: BookOpen, title: '关联文档', desc: '发现与当前文档语义相关的其他文档' },
    { key: 'path', icon: Map, title: '学习路径', desc: '推荐相关文档的阅读顺序' },
    { key: 'search', icon: Globe, title: '全局搜索', desc: '跨所有已索引文档的语义搜索' },
] as const

type FeatureKey = (typeof featureCards)[number]['key']

export default function DiscoverTab({ pageId }: DiscoverTabProps) {
    const { editor } = useEditorContext()
    const { toast } = useToast()

    // 各功能的加载状态
    const [loading, setLoading] = useState<Record<FeatureKey, boolean>>({
        summary: false,
        related: false,
        path: false,
        search: false,
    })

    // 各功能的结果数据
    const [summaryResult, setSummaryResult] = useState<SmartSummaryResult | null>(null)
    const [relatedResult, setRelatedResult] = useState<RelatedDocsResult[] | null>(null)
    const [pathResult, setPathResult] = useState<LearningPathResult | null>(null)
    const [searchResult, setSearchResult] = useState<GlobalSearchResult[] | null>(null)

    // 全局搜索输入
    const [searchQuery, setSearchQuery] = useState('')

    /** 从编辑器提取结构化上下文 */
    const getContext = (): StructuredContext | undefined => {
        if (!editor) return undefined
        try {
            const blocks = editor.document as any[]
            return extractStructuredContextFromEditor(blocks)
        } catch {
            return undefined
        }
    }

    /** 智能摘要 */
    const handleSmartSummary = async () => {
        setLoading(prev => ({ ...prev, summary: true }))
        setSummaryResult(null)
        try {
            const context = getContext()
            const result = await smartSummary(pageId, context)
            setSummaryResult(result)
        } catch (e: any) {
            toast({ title: '智能摘要失败', description: e.message, variant: 'destructive' })
        } finally {
            setLoading(prev => ({ ...prev, summary: false }))
        }
    }

    /** 关联文档 */
    const handleRelatedDocs = async () => {
        setLoading(prev => ({ ...prev, related: true }))
        setRelatedResult(null)
        try {
            const result = await getRelatedDocuments(pageId)
            setRelatedResult(result)
        } catch (e: any) {
            toast({ title: '获取关联文档失败', description: e.message, variant: 'destructive' })
        } finally {
            setLoading(prev => ({ ...prev, related: false }))
        }
    }

    /** 学习路径 */
    const handleLearningPath = async () => {
        setLoading(prev => ({ ...prev, path: true }))
        setPathResult(null)
        try {
            const context = getContext()
            const result = await generateLearningPath(pageId, context)
            setPathResult(result)
        } catch (e: any) {
            toast({ title: '生成学习路径失败', description: e.message, variant: 'destructive' })
        } finally {
            setLoading(prev => ({ ...prev, path: false }))
        }
    }

    /** 全局搜索 */
    const handleGlobalSearch = async () => {
        if (!searchQuery.trim()) return
        setLoading(prev => ({ ...prev, search: true }))
        setSearchResult(null)
        try {
            const result = await knowledgeGlobalSearch(searchQuery)
            setSearchResult(result)
        } catch (e: any) {
            toast({ title: '全局搜索失败', description: e.message, variant: 'destructive' })
        } finally {
            setLoading(prev => ({ ...prev, search: false }))
        }
    }

    /** 渲染功能卡片 */
    const renderFeatureCard = (card: (typeof featureCards)[number]) => {
        const isLoading = loading[card.key]

        return (
            <div key={card.key} className="border border-zinc-200 rounded-lg p-3">
                {/* 卡片头部 */}
                <div className="flex items-center gap-2 mb-2">
                    <card.icon size={16} className="text-brand" />
                    <span className="font-medium text-sm">{card.title}</span>
                </div>
                <p className="text-xs text-zinc-500 mb-3">{card.desc}</p>

                {/* 全局搜索的输入框 */}
                {card.key === 'search' && (
                    <div className="flex items-center gap-2 mb-3">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleGlobalSearch()}
                            placeholder="输入搜索关键词..."
                            className="flex-1 text-sm border border-zinc-200 rounded-md px-2 py-1.5 outline-none focus:border-brand transition-colors"
                        />
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleGlobalSearch}
                            disabled={isLoading || !searchQuery.trim()}
                            className="h-8 px-2"
                        >
                            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                        </Button>
                    </div>
                )}

                {/* 触发按钮（非搜索卡片） */}
                {card.key !== 'search' && (
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={
                            card.key === 'summary' ? handleSmartSummary : card.key === 'related' ? handleRelatedDocs : handleLearningPath
                        }
                        disabled={isLoading}
                        className="w-full h-8 text-xs"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 size={14} className="animate-spin mr-1" />
                                分析中...
                            </>
                        ) : (
                            <>
                                <Sparkles size={14} className="mr-1" />
                                开始分析
                            </>
                        )}
                    </Button>
                )}

                {/* 结果展示区域 */}
                {card.key === 'summary' && summaryResult && (
                    <div className="mt-3 space-y-2 text-xs">
                        <div>
                            <span className="font-medium text-zinc-700">预计阅读时间：</span>
                            <span className="text-zinc-500">{summaryResult.readingTime}</span>
                        </div>
                        <div>
                            <span className="font-medium text-zinc-700">关键要点：</span>
                            <ul className="list-disc pl-4 mt-1 space-y-0.5 text-zinc-600">
                                {summaryResult.keyPoints.map((point, i) => (
                                    <li key={i}>{point}</li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <span className="font-medium text-zinc-700">核心结论：</span>
                            <p className="text-zinc-600 mt-0.5">{summaryResult.coreConclusion}</p>
                        </div>
                        <div>
                            <span className="font-medium text-zinc-700">建议行动：</span>
                            <ul className="list-disc pl-4 mt-1 space-y-0.5 text-zinc-600">
                                {summaryResult.suggestedActions.map((action, i) => (
                                    <li key={i}>{action}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                {card.key === 'related' && relatedResult && (
                    <div className="mt-3 space-y-2">
                        {relatedResult.length === 0 ? (
                            <p className="text-xs text-zinc-400">未找到关联文档</p>
                        ) : (
                            relatedResult.map((doc, i) => (
                                <div
                                    key={i}
                                    className="border border-zinc-100 rounded-md p-2 cursor-pointer hover:border-brand/30 transition-colors"
                                    onClick={() => (window.location.href = `/doc/${doc.pageId}`)}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-medium text-zinc-700 truncate">
                                            {doc.title || `文档 ${doc.pageId.slice(0, 8)}...`}
                                        </span>
                                        <span className="text-xs text-brand">相似度 {(doc.score * 100).toFixed(1)}%</span>
                                    </div>
                                    <p className="text-xs text-zinc-500 line-clamp-2">{doc.matchedContent}</p>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {card.key === 'path' && pathResult && (
                    <div className="mt-3 space-y-2">
                        {pathResult.path.length === 0 ? (
                            <p className="text-xs text-zinc-400">未找到学习路径</p>
                        ) : (
                            pathResult.path.map((item, i) => (
                                <div key={i} className="flex items-start gap-2">
                                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand/10 text-brand text-xs font-medium shrink-0">
                                        {item.order}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-zinc-700 truncate">{item.title}</p>
                                        <p className="text-xs text-zinc-500">{item.reason}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {card.key === 'search' && searchResult && (
                    <div className="mt-3 space-y-2">
                        {searchResult.length === 0 ? (
                            <p className="text-xs text-zinc-400">未找到匹配结果</p>
                        ) : (
                            searchResult.map((item, i) => (
                                <div
                                    key={i}
                                    className="border border-zinc-100 rounded-md p-2 cursor-pointer hover:border-brand/30 transition-colors"
                                    onClick={() => (window.location.href = `/doc/${item.pageId}`)}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs text-zinc-500">{item.title || `文档 ${item.pageId.slice(0, 8)}...`}</span>
                                        <span className="text-xs text-brand">{(item.score * 100).toFixed(1)}%</span>
                                    </div>
                                    <p className="text-xs text-zinc-600 line-clamp-2">{item.content}</p>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="p-4">
            <div className="grid grid-cols-2 gap-3">{featureCards.map(card => renderFeatureCard(card))}</div>
        </div>
    )
}
