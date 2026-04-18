import { Button } from '@lcw-doc/shadcn-shared-ui/components/ui/button'
import { Input } from '@lcw-doc/shadcn-shared-ui/components/ui/input'
import { Label } from '@lcw-doc/shadcn-shared-ui/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@lcw-doc/shadcn-shared-ui/components/ui/popover'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Copy, Loader2, Plus, Share, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { createShare, deleteShare, fetchSharesByPageId } from '@/services/share'
import { ShareLink } from '@/types/api'

interface SharePopoverProps {
    pageId?: string
}

const permissionLabels: Record<string, string> = {
    view: '可查看',
    comment: '可评论',
    edit: '可编辑',
}

export function SharePopover({ pageId }: SharePopoverProps) {
    const queryClient = useQueryClient()
    const [open, setOpen] = useState(false)
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [permission, setPermission] = useState<'view' | 'comment' | 'edit'>('view')
    const [password, setPassword] = useState('')
    const [expiresAt, setExpiresAt] = useState('')
    const [copiedId, setCopiedId] = useState<string | null>(null)

    const { data: shares = [], isLoading } = useQuery<ShareLink[]>({
        queryKey: ['shares', pageId],
        queryFn: async () => {
            const res = await fetchSharesByPageId(pageId!)
            return res.data
        },
        enabled: !!pageId && open,
    })

    const createMutation = useMutation({
        mutationFn: createShare,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shares', pageId] })
            setShowCreateForm(false)
            setPassword('')
            setExpiresAt('')
            setPermission('view')
        },
    })

    const deleteMutation = useMutation({
        mutationFn: deleteShare,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shares', pageId] })
        },
    })

    const handleCopy = async (shareId: string) => {
        const link = `${window.location.origin}/share/${shareId}`
        await navigator.clipboard.writeText(link)
        setCopiedId(shareId)
        setTimeout(() => setCopiedId(null), 2000)
    }

    const handleCreate = () => {
        if (!pageId) return
        createMutation.mutate({
            pageId,
            permission,
            password: password || undefined,
            expiresAt: expiresAt || undefined,
        })
    }

    const handleOpenChange = (value: boolean) => {
        setOpen(value)
        if (!value) {
            setShowCreateForm(false)
        }
    }

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button size="sm">
                    <Share size={16} />
                    分享
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-96 p-4">
                {isLoading ? (
                    <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                    </div>
                ) : !showCreateForm && shares.length === 0 ? (
                    <div className="text-center py-4">
                        <p className="text-sm text-zinc-500 mb-4">暂无分享链接</p>
                        <Button size="sm" onClick={() => setShowCreateForm(true)}>
                            <Plus size={14} />
                            创建分享链接
                        </Button>
                    </div>
                ) : showCreateForm ? (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">创建分享链接</p>
                            <Button variant="ghost" size="sm" onClick={() => setShowCreateForm(false)}>
                                取消
                            </Button>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">权限</Label>
                            <select
                                value={permission}
                                onChange={(e) => setPermission(e.target.value as 'view' | 'comment' | 'edit')}
                                className="w-full h-9 rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-zinc-400"
                            >
                                <option value="view">可查看</option>
                                <option value="comment">可评论</option>
                                <option value="edit">可编辑</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">访问密码（可选）</Label>
                            <Input
                                type="text"
                                placeholder="留空则无需密码"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="h-9"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">过期时间（可选）</Label>
                            <Input
                                type="datetime-local"
                                value={expiresAt}
                                onChange={(e) => setExpiresAt(e.target.value)}
                                className="h-9"
                            />
                        </div>
                        <Button
                            size="sm"
                            className="w-full"
                            onClick={handleCreate}
                            disabled={createMutation.isPending}
                        >
                            {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                            创建链接
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">分享链接</p>
                            <Button variant="ghost" size="sm" onClick={() => setShowCreateForm(true)}>
                                <Plus size={14} />
                                新建
                            </Button>
                        </div>
                        {shares.map((share) => (
                            <div key={share.shareId} className="flex items-center gap-2 p-2 rounded-md bg-zinc-50">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                                            {permissionLabels[share.permission] || share.permission}
                                        </span>
                                        {share.expiresAt && (
                                            <span className="text-xs text-zinc-400">
                                                {new Date(share.expiresAt).toLocaleDateString()} 过期
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-zinc-500 truncate">
                                        {window.location.origin}/share/{share.shareId}
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 shrink-0"
                                    onClick={() => handleCopy(share.shareId)}
                                >
                                    {copiedId === share.shareId ? (
                                        <Check size={14} className="text-green-500" />
                                    ) : (
                                        <Copy size={14} />
                                    )}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 shrink-0 text-zinc-400 hover:text-red-500"
                                    onClick={() => deleteMutation.mutate(share.shareId)}
                                    disabled={deleteMutation.isPending}
                                >
                                    <Trash2 size={14} />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </PopoverContent>
        </Popover>
    )
}
