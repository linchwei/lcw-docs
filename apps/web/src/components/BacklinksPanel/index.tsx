import { Button } from '@lcw-doc/shadcn-shared-ui/components/ui/button'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Link2, Loader2, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import * as srv from '@/services'
import { BacklinkItem } from '@/types/api'

interface BacklinksPanelProps {
    pageId: string
    onClose?: () => void
}

export function BacklinksPanel({ pageId, onClose }: BacklinksPanelProps) {
    const navigate = useNavigate()

    const { data: backlinks = [], isLoading } = useQuery<BacklinkItem[]>({
        queryKey: ['backlinks', pageId],
        queryFn: async () => {
            const res = await srv.fetchBacklinks(pageId)
            return res.data || []
        },
        enabled: !!pageId,
    })

    return (
        <div className="w-80 h-full border-l border-zinc-200 bg-white flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-zinc-200">
                <div className="flex items-center gap-2">
                    <Link2 size={18} />
                    <span className="font-medium">反向链接</span>
                    {backlinks.length > 0 && (
                        <span className="text-xs text-zinc-500">({backlinks.length})</span>
                    )}
                </div>
                {onClose && (
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
                        <X size={16} />
                    </Button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-1">
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                    </div>
                ) : backlinks.length === 0 ? (
                    <div className="text-center py-8 text-zinc-500">
                        <Link2 size={32} className="mx-auto mb-2 text-zinc-300" />
                        <p className="text-sm">暂无反向链接</p>
                        <p className="text-xs text-zinc-400 mt-1">当其他文档引用此文档时，会显示在这里</p>
                    </div>
                ) : (
                    backlinks.map((item: BacklinkItem) => (
                        <div
                            key={item.pageId}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-50 cursor-pointer"
                            onClick={() => navigate(`/doc/${item.pageId}`)}
                        >
                            <span className="text-base shrink-0">{item.emoji}</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm truncate">{item.title}</p>
                                <p className="text-xs text-zinc-400">
                                    {new Date(item.updatedAt).toLocaleDateString('zh-CN')}
                                </p>
                            </div>
                            <ArrowLeft size={14} className="text-zinc-300 shrink-0" />
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
