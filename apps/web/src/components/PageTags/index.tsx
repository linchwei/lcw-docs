import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, X } from 'lucide-react'
import { useState } from 'react'

import * as srv from '@/services'
import { Tag } from '@/types/api'
import { ConfirmDialog } from '@/components/ConfirmDialog'

interface PageTagsProps {
    pageId?: string
}

export function PageTags({ pageId }: PageTagsProps) {
    const queryClient = useQueryClient()
    const [showTagPicker, setShowTagPicker] = useState(false)
    const [deleteTagDialogOpen, setDeleteTagDialogOpen] = useState(false)
    const [pendingDeleteTag, setPendingDeleteTag] = useState<{ tagId: string; tagName: string } | null>(null)

    const { data: pageTags = [] } = useQuery<Tag[]>({
        queryKey: ['pageTags', pageId],
        queryFn: async () => {
            if (!pageId) return []
            const res = await srv.fetchPageTags(pageId)
            return res.data || []
        },
        enabled: !!pageId,
    })

    const { data: allTags = [] } = useQuery<Tag[]>({
        queryKey: ['tags'],
        queryFn: async () => {
            const res = await srv.fetchTags()
            return res.data || []
        },
        enabled: showTagPicker,
    })

    const addMutation = useMutation({
        mutationFn: srv.addPageTag,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pageTags', pageId] })
        },
    })

    const removeMutation = useMutation({
        mutationFn: ({ pageId, tagId }: { pageId: string; tagId: string }) =>
            srv.removePageTag(pageId, tagId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pageTags', pageId] })
        },
    })

    const deleteTagMutation = useMutation({
        mutationFn: srv.deleteTag,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tags'] })
            queryClient.invalidateQueries({ queryKey: ['pageTags', pageId] })
            queryClient.invalidateQueries({ queryKey: ['batchPageTags'] })
        },
    })

    const confirmDeleteTag = () => {
        if (!pendingDeleteTag) return
        deleteTagMutation.mutate(pendingDeleteTag.tagId)
        setPendingDeleteTag(null)
    }

    const availableTags = allTags.filter(t => !pageTags.some(pt => pt.tagId === t.tagId))

    if (!pageId) return null

    return (
        <div className="flex items-center gap-1.5 flex-wrap mb-2 min-h-[28px]">
            {pageTags.map(tag => (
                <span
                    key={tag.tagId}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium"
                    style={{ backgroundColor: tag.color + '18', color: tag.color }}
                >
                    {tag.name}
                    <button
                        onClick={() => removeMutation.mutate({ pageId, tagId: tag.tagId })}
                        className="hover:opacity-70"
                    >
                        <X size={10} />
                    </button>
                </span>
            ))}
            <div className="relative">
                <button
                    onClick={() => setShowTagPicker(!showTagPicker)}
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-xs text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
                >
                    <Plus size={10} />
                    标签
                </button>
                {showTagPicker && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-zinc-200 z-50 py-1">
                        {availableTags.length === 0 ? (
                            <div className="px-3 py-2 text-xs text-zinc-400">
                                {allTags.length === 0 ? '暂无标签，请在侧边栏创建' : '所有标签已添加'}
                            </div>
                        ) : (
                            availableTags.map(tag => (
                                <div key={tag.tagId} className="w-full flex items-center gap-1 px-3 py-1.5 text-xs hover:bg-zinc-50 group">
                                    <button
                                        className="flex-1 text-left flex items-center gap-2"
                                        onClick={() => {
                                            addMutation.mutate({ pageId, tagId: tag.tagId })
                                            setShowTagPicker(false)
                                        }}
                                    >
                                        <span
                                            className="w-2.5 h-2.5 rounded-full shrink-0"
                                            style={{ backgroundColor: tag.color }}
                                        />
                                        {tag.name}
                                    </button>
                                    <button
                                        className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 transition-opacity"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setPendingDeleteTag({ tagId: tag.tagId, tagName: tag.name })
                                            setDeleteTagDialogOpen(true)
                                        }}
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
            <ConfirmDialog
                open={deleteTagDialogOpen}
                onOpenChange={setDeleteTagDialogOpen}
                title="删除标签"
                description={`确定删除标签「${pendingDeleteTag?.tagName || ''}」？删除后将从所有页面移除该标签`}
                confirmText="删除"
                onConfirm={confirmDeleteTag}
                variant="destructive"
            />
        </div>
    )
}
