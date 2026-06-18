/**
 * 索引管理 Tab
 *
 * 提供知识库索引管理功能，支持：
 * - 索引状态详情查看
 * - 重新索引 / 清除索引
 * - 对话线程历史管理
 *
 * @module components/KnowledgePanel/ManageTab
 */
import { Button } from '@lcw-doc/shadcn-shared-ui/components/ui/button'
import { useToast } from '@lcw-doc/shadcn-shared-ui/hooks/use-toast'
import { AlertTriangle, Database, Loader2, RefreshCw, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { clearKnowledgeIndex, deleteKnowledgeThread, listKnowledgeThreads } from '@/services/ai'

/** 索引状态接口 */
interface IndexStatus {
    isIndexed: boolean
    totalChunks: number
    embeddedChunks: number
    unembeddedChunks: number
    lastIndexedAt: string | null
}

interface ManageTabProps {
    pageId: string
    /** 索引状态数据 */
    indexStatus: IndexStatus | null
    /** 触发重新索引 */
    onIndex: () => void
    /** 重新加载索引状态 */
    onLoadStatus: () => void
}

/** 对话线程项 */
interface ThreadItem {
    id: string
    title?: string
    createdAt: string
    messageCount?: number
}

export default function ManageTab({ pageId, indexStatus, onIndex, onLoadStatus }: ManageTabProps) {
    const { toast } = useToast()

    const [indexing, setIndexing] = useState(false)
    const [showIndexConfirm, setShowIndexConfirm] = useState(false)
    const [showClearConfirm, setShowClearConfirm] = useState(false)
    const [threads, setThreads] = useState<ThreadItem[]>([])
    const [threadsLoading, setThreadsLoading] = useState(false)
    const [deletingThread, setDeletingThread] = useState<string | null>(null)

    /** 加载对话线程列表 */
    const loadThreads = useCallback(async () => {
        setThreadsLoading(true)
        try {
            const result = await listKnowledgeThreads()
            setThreads((result.items || []) as ThreadItem[])
        } catch (e: any) {
            toast({ title: '加载线程列表失败', description: e.message, variant: 'destructive' })
        } finally {
            setThreadsLoading(false)
        }
    }, [toast])

    /** 删除对话线程 */
    const handleDeleteThread = async (threadId: string) => {
        setDeletingThread(threadId)
        try {
            await deleteKnowledgeThread(threadId)
            setThreads(prev => prev.filter(t => t.id !== threadId))
            toast({ title: '线程已删除' })
        } catch (e: any) {
            toast({ title: '删除线程失败', description: e.message, variant: 'destructive' })
        } finally {
            setDeletingThread(null)
        }
    }

    /** 触发重新索引 */
    const handleReindex = async () => {
        setIndexing(true)
        setShowIndexConfirm(false)
        try {
            await onIndex()
            toast({ title: '索引已触发', description: '正在重新索引文档...' })
            // 延迟刷新状态
            setTimeout(() => onLoadStatus(), 2000)
        } catch (e: any) {
            toast({ title: '索引失败', description: e.message, variant: 'destructive' })
        } finally {
            setIndexing(false)
        }
    }

    /** 清除索引 */
    const handleClearIndex = async () => {
        setShowClearConfirm(false)
        setIndexing(true)
        try {
            await clearKnowledgeIndex(pageId)
            toast({ title: '索引已清除', description: '所有嵌入数据已被删除' })
            // 刷新索引状态
            setTimeout(() => onLoadStatus(), 1000)
        } catch (e: any) {
            toast({ title: '清除索引失败', description: e.message, variant: 'destructive' })
        } finally {
            setIndexing(false)
        }
    }

    // 加载线程列表（每次组件挂载时刷新）
    useEffect(() => {
        loadThreads()
    }, [loadThreads])

    return (
        <div className="p-4 space-y-4">
            {/* 索引状态详情 */}
            <div className="border border-zinc-200 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-3">
                    <Database size={14} className="text-brand" />
                    <span className="text-sm font-medium text-zinc-700">索引状态</span>
                </div>

                {indexStatus ? (
                    <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                            <span className="text-zinc-500">总块数</span>
                            <span className="text-zinc-700 font-medium">{indexStatus.totalChunks ?? '-'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-zinc-500">已嵌入</span>
                            <span className="text-green-600 font-medium">{indexStatus.embeddedChunks ?? '-'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-zinc-500">未嵌入</span>
                            <span className="text-orange-500 font-medium">{indexStatus.unembeddedChunks ?? '-'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-zinc-500">最后索引时间</span>
                            <span className="text-zinc-700">
                                {indexStatus.lastIndexedAt ? new Date(indexStatus.lastIndexedAt).toLocaleString('zh-CN') : '未索引'}
                            </span>
                        </div>

                        {/* 嵌入进度条 */}
                        {indexStatus.totalChunks > 0 && (
                            <div className="mt-1">
                                <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-brand transition-all"
                                        style={{
                                            width: `${((indexStatus.embeddedChunks || 0) / indexStatus.totalChunks) * 100}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <p className="text-xs text-zinc-400">暂无索引数据</p>
                )}
            </div>

            {/* 索引操作 */}
            <div className="space-y-2">
                {/* 重新索引 */}
                {showIndexConfirm ? (
                    <div className="border border-orange-200 bg-orange-50 rounded-md p-3">
                        <div className="flex items-center gap-1.5 mb-2">
                            <AlertTriangle size={14} className="text-orange-500" />
                            <span className="text-xs font-medium text-orange-700">确认重新索引？</span>
                        </div>
                        <p className="text-xs text-orange-600 mb-2">重新索引将覆盖现有索引数据，可能需要一些时间。</p>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                onClick={handleReindex}
                                disabled={indexing}
                                className="h-7 text-xs bg-orange-500 hover:bg-orange-600"
                            >
                                {indexing ? <Loader2 size={12} className="animate-spin mr-1" /> : null}
                                确认
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setShowIndexConfirm(false)} className="h-7 text-xs">
                                取消
                            </Button>
                        </div>
                    </div>
                ) : (
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowIndexConfirm(true)}
                        disabled={indexing}
                        className="w-full h-8 text-xs"
                    >
                        <RefreshCw size={14} className="mr-1" />
                        重新索引
                    </Button>
                )}

                {/* 清除索引 */}
                {showClearConfirm ? (
                    <div className="border border-red-200 bg-red-50 rounded-md p-3">
                        <div className="flex items-center gap-1.5 mb-2">
                            <AlertTriangle size={14} className="text-red-500" />
                            <span className="text-xs font-medium text-red-700">确认清除索引？</span>
                        </div>
                        <p className="text-xs text-red-600 mb-2">此操作不可撤销，所有嵌入数据将被删除。</p>
                        <div className="flex gap-2">
                            <Button size="sm" onClick={handleClearIndex} className="h-7 text-xs bg-red-500 hover:bg-red-600">
                                确认清除
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setShowClearConfirm(false)} className="h-7 text-xs">
                                取消
                            </Button>
                        </div>
                    </div>
                ) : (
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowClearConfirm(true)}
                        className="w-full h-8 text-xs text-red-500 border-red-200 hover:bg-red-50"
                    >
                        <Trash2 size={14} className="mr-1" />
                        清除索引
                    </Button>
                )}
            </div>

            {/* 对话线程历史 */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-zinc-700">对话历史</span>
                    <Button variant="ghost" size="sm" onClick={loadThreads} disabled={threadsLoading} className="h-6 px-2 text-xs">
                        {threadsLoading ? <Loader2 size={12} className="animate-spin" /> : '刷新'}
                    </Button>
                </div>

                {threads.length === 0 ? (
                    <p className="text-xs text-zinc-400 py-4 text-center">暂无对话历史</p>
                ) : (
                    <div className="space-y-1.5">
                        {threads.map(thread => (
                            <div key={thread.id} className="flex items-center justify-between border border-zinc-200 rounded-md p-2">
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-zinc-700 truncate">
                                        {thread.title || `线程 ${thread.id.slice(0, 8)}...`}
                                    </p>
                                    <p className="text-xs text-zinc-400">
                                        {new Date(thread.createdAt).toLocaleString('zh-CN')}
                                        {thread.messageCount != null && ` · ${thread.messageCount} 条消息`}
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 text-zinc-400 hover:text-red-500 shrink-0"
                                    onClick={() => handleDeleteThread(thread.id)}
                                    disabled={deletingThread === thread.id}
                                >
                                    {deletingThread === thread.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
