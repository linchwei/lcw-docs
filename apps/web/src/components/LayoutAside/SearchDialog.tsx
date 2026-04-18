import * as Dialog from '@radix-ui/react-dialog'
import { useQuery } from '@tanstack/react-query'
import { FileText, Loader2, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import * as srv from '@/services'
import { SearchResult } from '@/types/api'

interface SearchDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
    const [query, setQuery] = useState('')
    const [debouncedQuery, setDebouncedQuery] = useState('')
    const navigate = useNavigate()

    const isSearchMode = debouncedQuery.trim().length > 0

    const { data: pages } = useQuery({
        queryKey: ['pages'],
        queryFn: async () => {
            return (await srv.fetchPageList()).data.pages
        },
    })

    const { data: searchResults = [], isLoading: isSearching } = useQuery({
        queryKey: ['search', debouncedQuery],
        queryFn: async () => {
            const res = await srv.searchPages(debouncedQuery)
            return res.data || []
        },
        enabled: isSearchMode,
    })

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query)
        }, 300)
        return () => clearTimeout(timer)
    }, [query])

    const titleFiltered = useMemo(() => {
        if (!pages) return []
        if (!query.trim()) return pages
        return pages.filter(page =>
            page.title.toLowerCase().includes(query.toLowerCase())
        )
    }, [pages, query])

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault()
                onOpenChange(!open)
            }
        }
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [open, onOpenChange])

    useEffect(() => {
        if (!open) {
            setQuery('')
            setDebouncedQuery('')
        }
    }, [open])

    const handleSelect = (pageId: string) => {
        onOpenChange(false)
        navigate(`/doc/${pageId}`)
    }

    const highlightMatch = (text: string, keyword: string) => {
        if (!keyword.trim()) return text
        const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
        const parts = text.split(regex)
        return parts.map((part, i) =>
            regex.test(part) ? (
                <mark key={i} className="bg-yellow-200 text-[#37352f] rounded-sm px-0.5">{part}</mark>
            ) : (
                part
            )
        )
    }

    const displayResults = isSearchMode ? searchResults : titleFiltered.map(p => ({
        pageId: p.pageId,
        emoji: p.emoji,
        title: p.title,
        snippet: '',
        updatedAt: p.updatedAt,
        matchType: 'title' as const,
    }))

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
                <Dialog.Content className="fixed left-1/2 top-[20%] z-50 w-full max-w-lg -translate-x-1/2 rounded-xl bg-white shadow-2xl">
                    <Dialog.Title className="sr-only">搜索文档</Dialog.Title>
                    <Dialog.Description className="sr-only">搜索并跳转到文档</Dialog.Description>
                    <div className="flex items-center gap-2 border-b px-4 py-3">
                        <Search className="h-4 w-4 shrink-0 text-[#9b9a97]" />
                        <input
                            className="w-full text-sm outline-none placeholder:text-[#c7c7c5]"
                            placeholder="搜索文档标题或内容..."
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            autoFocus
                        />
                        {isSearching && <Loader2 className="h-4 w-4 animate-spin text-[#9b9a97] shrink-0" />}
                    </div>
                    <div className="max-h-80 overflow-y-auto p-2">
                        {displayResults.length > 0 ? (
                            displayResults.map((result: SearchResult) => (
                                <div
                                    key={result.pageId}
                                    className="flex items-start gap-3 rounded-lg px-4 py-3 hover:bg-[#ebebea] cursor-pointer"
                                    onClick={() => handleSelect(result.pageId)}
                                >
                                    <span className="text-base mt-0.5 shrink-0">{result.emoji}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm truncate text-[#37352f]">
                                            {highlightMatch(result.title, query)}
                                        </div>
                                        {result.snippet && (
                                            <p className="text-xs text-[#9b9a97] mt-1 line-clamp-2 leading-relaxed">
                                                {result.snippet}
                                            </p>
                                        )}
                                    </div>
                                    {result.matchType === 'content' && (
                                        <FileText size={14} className="text-[#9b9a97] shrink-0 mt-1" />
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="px-4 py-8 text-center text-sm text-[#9b9a97]">
                                {isSearchMode ? '未找到匹配文档' : '输入关键词搜索文档内容'}
                            </div>
                        )}
                    </div>
                    {isSearchMode && searchResults.length > 0 && (
                        <div className="border-t px-4 py-2 text-xs text-[#9b9a97]">
                            找到 {searchResults.length} 个结果
                        </div>
                    )}
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}
