import { Button } from '@lcw-doc/shadcn-shared-ui/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@lcw-doc/shadcn-shared-ui/components/ui/dropdown-menu'
import { Input } from '@lcw-doc/shadcn-shared-ui/components/ui/input'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Crown, Loader2, MessageSquare, MoreHorizontal, Plus, Shield, Trash2, User, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import * as srv from '@/services'
import { Collaborator } from '@/types/api'

interface CollaboratorPanelProps {
    pageId: string
    onClose?: () => void
}

export function CollaboratorPanel({ pageId, onClose }: CollaboratorPanelProps) {
    const queryClient = useQueryClient()
    const [username, setUsername] = useState('')
    const [role, setRole] = useState<'editor' | 'commenter' | 'viewer'>('editor')

    const { data: collaborators = [], isLoading } = useQuery<Collaborator[]>({
        queryKey: ['collaborators', pageId],
        queryFn: async () => {
            const res = await srv.fetchCollaborators(pageId)
            return res.data || []
        },
        enabled: !!pageId,
    })

    const addMutation = useMutation({
        mutationFn: (data: { username: string; role: string }) => srv.addCollaborator(pageId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['collaborators', pageId] })
            setUsername('')
            toast({ title: '协作者已添加' })
        },
        onError: (err: any) => {
            toast({ title: err.response?.data?.message || '添加失败' })
        },
    })

    const removeMutation = useMutation({
        mutationFn: srv.removeCollaborator,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['collaborators', pageId] })
            toast({ title: '协作者已移除' })
        },
    })

    const updateMutation = useMutation({
        mutationFn: ({ collaboratorId, role }: { collaboratorId: string; role: string }) =>
            srv.updateCollaborator(collaboratorId, { role }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['collaborators', pageId] })
            toast({ title: '权限已更新' })
        },
    })

    const handleAdd = () => {
        if (!username.trim()) return
        addMutation.mutate({ username: username.trim(), role })
    }

    const getRoleIcon = (r: string) => {
        if (r === 'owner') return <Crown size={14} className="text-yellow-500" />
        if (r === 'editor') return <Shield size={14} className="text-blue-500" />
        if (r === 'commenter') return <MessageSquare size={14} className="text-amber-500" />
        return <User size={14} className="text-zinc-400" />
    }

    const getRoleLabel = (r: string) => {
        if (r === 'owner') return '所有者'
        if (r === 'editor') return '编辑者'
        if (r === 'commenter') return '评论者'
        return '查看者'
    }

    return (
        <div className="w-80 h-full border-l border-zinc-200 bg-white flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-zinc-200">
                <div className="flex items-center gap-2">
                    <User size={18} />
                    <span className="font-medium">协作者</span>
                    {collaborators.length > 0 && (
                        <span className="text-xs text-zinc-500">({collaborators.length})</span>
                    )}
                </div>
                {onClose && (
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
                        <X size={16} />
                    </Button>
                )}
            </div>

            <div className="p-4 border-b border-zinc-100 space-y-2">
                <div className="flex gap-2">
                    <Input
                        placeholder="输入用户名"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAdd()}
                        className="h-8 text-sm"
                    />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 text-xs shrink-0">
                                {getRoleLabel(role)}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => setRole('editor')}>
                                <Shield size={14} className="text-blue-500 mr-2" />
                                编辑者
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setRole('commenter')}>
                                <MessageSquare size={14} className="text-amber-500 mr-2" />
                                评论者
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setRole('viewer')}>
                                <User size={14} className="text-zinc-400 mr-2" />
                                查看者
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <Button
                    className="w-full h-8 text-sm"
                    onClick={handleAdd}
                    disabled={!username.trim() || addMutation.isPending}
                >
                    {addMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                        <Plus size={14} className="mr-2" />
                    )}
                    邀请协作者
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-1">
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                    </div>
                ) : collaborators.length === 0 ? (
                    <div className="text-center py-8 text-zinc-500">
                        <User size={32} className="mx-auto mb-2 text-zinc-300" />
                        <p className="text-sm">暂无协作者</p>
                        <p className="text-xs text-zinc-400 mt-1">输入用户名邀请协作</p>
                    </div>
                ) : (
                    collaborators.map(collaborator => (
                        <div
                            key={collaborator.userId}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-50"
                        >
                            <div className="h-8 w-8 rounded-full bg-zinc-200 flex items-center justify-center text-sm font-medium text-zinc-600 shrink-0">
                                {collaborator.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm truncate">{collaborator.username}</p>
                                <div className="flex items-center gap-1">
                                    {getRoleIcon(collaborator.role)}
                                    <span className="text-xs text-zinc-500">{getRoleLabel(collaborator.role)}</span>
                                </div>
                            </div>
                            {collaborator.role !== 'owner' && collaborator.collaboratorId && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0">
                                            <MoreHorizontal size={14} />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        {collaborator.role !== 'editor' && (
                                            <DropdownMenuItem
                                                onClick={() =>
                                                    updateMutation.mutate({
                                                        collaboratorId: collaborator.collaboratorId!,
                                                        role: 'editor',
                                                    })
                                                }
                                            >
                                                <Shield size={14} className="mr-2" />
                                                改为编辑者
                                            </DropdownMenuItem>
                                        )}
                                        {collaborator.role !== 'commenter' && (
                                            <DropdownMenuItem
                                                onClick={() =>
                                                    updateMutation.mutate({
                                                        collaboratorId: collaborator.collaboratorId!,
                                                        role: 'commenter',
                                                    })
                                                }
                                            >
                                                <MessageSquare size={14} className="mr-2" />
                                                改为评论者
                                            </DropdownMenuItem>
                                        )}
                                        {collaborator.role !== 'viewer' && (
                                            <DropdownMenuItem
                                                onClick={() =>
                                                    updateMutation.mutate({
                                                        collaboratorId: collaborator.collaboratorId!,
                                                        role: 'viewer',
                                                    })
                                                }
                                            >
                                                <User size={14} className="mr-2" />
                                                改为查看者
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem
                                            className="text-red-600"
                                            onClick={() =>
                                                removeMutation.mutate(collaborator.collaboratorId!)
                                            }
                                        >
                                            <Trash2 size={14} className="mr-2" />
                                            移除
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
