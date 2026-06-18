/**
 * 知识收藏 Tab
 *
 * 提供知识收藏的管理功能，支持：
 * - 收藏列表展示（卡片式）
 * - 搜索收藏（关键词匹配）
 * - 删除收藏
 * - 点击跳转到来源文档
 *
 * @module components/KnowledgePanel/BookmarksTab
 */
import { Button } from '@lcw-doc/shadcn-shared-ui/components/ui/button'
import { useToast } from '@lcw-doc/shadcn-shared-ui/hooks/use-toast'
import { BookMarked, Loader2, Search, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import {
    deleteBookmark,
    listBookmarks,
    searchBookmarks,
} from '@/services/ai'

/** 收藏项 */
interface BookmarkItem {
    id: number
    title: string
    content: string
    sourcePageId: string
    sourceBlockId?: string
    createdAt: string
}

export default function BookmarksTab() {
    const { toast } = useToast()

    const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([])
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [loading, setLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [searching, setSearching] = useState(false)
    const [searchResults, setSearchResults] = useState<BookmarkItem[] | null>(null)

    const pageSize = 10

    /** 加载收藏列表 */
    const loadBookmarks = async (pageNum: number = 1) => {
        setLoading(true)
        try {
            const result = await listBookmarks(pageNum, pageSize)
            const items = (result.items || []) as BookmarkItem[]
            if (pageNum === 1) {
                setBookmarks(items)
            } else {
                setBookmarks(prev => [...prev, ...items])
            }
            setTotal(result.total)
            setPage(pageNum)
        } catch (e: any) {
            toast({ title: '加载收藏列表失败', description: e.message, variant: 'destructive' })
        } finally {
            setLoading(false)
        }
    }

    /** 搜索收藏 */
    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            setSearchResults(null)
            return
        }
        setSearching(true)
        try {
            const results = await searchBookmarks(searchQuery)
            setSearchResults(results as BookmarkItem[])
        } catch (e: any) {
            toast({ title: '搜索收藏失败', description: e.message, variant: 'destructive' })
        } finally {
            setSearching(false)
        }
    }

    /** 删除收藏 */
    const handleDelete = async (id: number) => {
        try {
            await deleteBookmark(id)
            toast({ title: '已删除收藏' })
            // 从列表中移除
            setBookmarks(prev => prev.filter(b => b.id !== id))
            if (searchResults) {
                setSearchResults(prev => prev?.filter(b => b.id !== id) || null)
            }
            setTotal(prev => prev - 1)
        } catch (e: any) {
            toast({ title: '删除收藏失败', description: e.message, variant: 'destructive' })
        }
    }

    /** 清空搜索 */
    const clearSearch = () => {
        setSearchQuery('')
        setSearchResults(null)
    }

    // 初始加载
    useEffect(() => {
        loadBookmarks(1)
    }, [])

    /** 渲染收藏卡片 */
    const renderBookmarkCard = (bookmark: BookmarkItem) => (
        <div
            key={bookmark.id}
            className="border border-zinc-200 rounded-lg p-3 cursor-pointer hover:border-brand/30 transition-colors"
            onClick={() => window.location.href = `/doc/${bookmark.sourcePageId}`}
        >
            <div className="flex items-start justify-between gap-2 mb-1.5">
                <span className="text-sm font-medium text-zinc-800 line-clamp-1">{bookmark.title}</span>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 shrink-0 text-zinc-400 hover:text-red-500"
                    onClick={(e) => { e.stopPropagation(); handleDelete(bookmark.id) }}
                >
                    <Trash2 size={12} />
                </Button>
            </div>
            <p className="text-xs text-zinc-500 line-clamp-2 mb-2">{bookmark.content}</p>
            <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="truncate max-w-[180px]">来源：{bookmark.title}</span>
                <span>{new Date(bookmark.createdAt).toLocaleDateString('zh-CN')}</span>
            </div>
        </div>
    )

    /** 当前展示的列表 */
    const displayList = searchResults !== null ? searchResults : bookmarks
    const hasMore = bookmarks.length < total && searchResults === null

    return (
        <div className="p-4 space-y-3">
            {/* 搜索栏 */}
            <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-1 border border-zinc-200 rounded-md px-2 py-1.5">
                    <Search size={14} className="text-zinc-400 shrink-0" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        placeholder="搜索收藏..."
                        className="flex-1 text-sm outline-none bg-transparent"
                    />
                    {searchResults !== null && (
                        <button
                            onClick={clearSearch}
                            className="text-xs text-brand hover:underline shrink-0"
                        >
                            清空
                        </button>
                    )}
                </div>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSearch}
                    disabled={searching || !searchQuery.trim()}
                    className="h-8 px-3"
                >
                    {searching ? <Loader2 size={14} className="animate-spin" /> : '搜索'}
                </Button>
            </div>

            {/* 收藏列表 */}
            {loading && bookmarks.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 size={20} className="animate-spin text-brand" />
                </div>
            ) : displayList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-zinc-400">
                    <BookMarked size={24} className="mb-2" />
                    <span className="text-xs">暂无收藏</span>
                </div>
            ) : (
                <div className="space-y-2">
                    {displayList.map(renderBookmarkCard)}
                </div>
            )}

            {/* 加载更多 */}
            {hasMore && searchResults === null && (
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => loadBookmarks(page + 1)}
                    disabled={loading}
                    className="w-full h-8 text-xs"
                >
                    {loading ? (
                        <>
                            <Loader2 size={14} className="animate-spin mr-1" />
                            加载中...
                        </>
                    ) : (
                        '加载更多'
                    )}
                </Button>
            )}
        </div>
    )
}
