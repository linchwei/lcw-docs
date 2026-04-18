import { Button } from '@lcw-doc/shadcn-shared-ui/components/ui/button'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeftRight, Clock, History, Loader2, Plus, RotateCcw, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import * as srv from '@/services'
import { Version, VersionDiff } from '@/types/api'

interface VersionPanelProps {
    pageId: string
    onClose?: () => void
}

export function VersionPanel({ pageId, onClose }: VersionPanelProps) {
    const queryClient = useQueryClient()
    const [selectedVersion, setSelectedVersion] = useState<Version | null>(null)
    const [compareVersion, setCompareVersion] = useState<Version | null>(null)
    const [diffResult, setDiffResult] = useState<VersionDiff | null>(null)
    const [showDiff, setShowDiff] = useState(false)
    const [confirmRollback, setConfirmRollback] = useState(false)

    const { data: versions = [], isLoading } = useQuery<Version[]>({
        queryKey: ['versions', pageId],
        queryFn: async () => {
            const res = await srv.fetchVersions(pageId)
            return res.data || []
        },
        enabled: !!pageId,
    })

    const createMutation = useMutation({
        mutationFn: srv.createVersion,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['versions', pageId] })
        },
    })

    const deleteMutation = useMutation({
        mutationFn: srv.deleteVersion,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['versions', pageId] })
            if (selectedVersion) setSelectedVersion(null)
        },
    })

    const rollbackMutation = useMutation({
        mutationFn: ({ pageId, versionId }: { pageId: string; versionId: string }) =>
            srv.rollbackVersion(pageId, versionId),
        onSuccess: () => {
            toast.success('已恢复到选定版本')
            queryClient.invalidateQueries({ queryKey: ['versions', pageId] })
            setConfirmRollback(false)
            setSelectedVersion(null)
        },
        onError: () => {
            toast.error('恢复版本失败')
        },
    })

    const diffMutation = useMutation({
        mutationFn: ({ pageId, v1, v2 }: { pageId: string; v1: string; v2: string }) =>
            srv.diffVersions(pageId, v1, v2),
        onSuccess: (res) => {
            setDiffResult(res.data)
            setShowDiff(true)
        },
        onError: () => {
            toast.error('版本对比失败')
        },
    })

    const handleCreate = () => {
        createMutation.mutate({ pageId })
    }

    const handleRollback = () => {
        if (!selectedVersion) return
        rollbackMutation.mutate({ pageId, versionId: selectedVersion.versionId })
    }

    const handleCompare = () => {
        if (!selectedVersion || !compareVersion) return
        diffMutation.mutate({
            pageId,
            v1: compareVersion.versionId,
            v2: selectedVersion.versionId,
        })
    }

    const handleVersionClick = (version: Version) => {
        if (compareVersion && compareVersion.versionId !== version.versionId) {
            setSelectedVersion(version)
        } else {
            setSelectedVersion(version)
            setCompareVersion(null)
            setDiffResult(null)
            setShowDiff(false)
        }
    }

    const handleVersionRightClick = (version: Version, e: React.MouseEvent) => {
        e.preventDefault()
        if (selectedVersion && selectedVersion.versionId !== version.versionId) {
            setCompareVersion(version)
            setDiffResult(null)
            setShowDiff(false)
        }
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) return '刚刚'
        if (diffMins < 60) return `${diffMins} 分钟前`
        if (diffHours < 24) return `${diffHours} 小时前`
        if (diffDays < 7) return `${diffDays} 天前`
        return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    }

    const getSourceLabel = (source: string) => {
        switch (source) {
            case 'auto': return '自动'
            case 'rollback-safety': return '回滚备份'
            case 'manual': return '手动'
            default: return source
        }
    }

    return (
        <div className="w-80 h-full border-l border-zinc-200 bg-white flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-zinc-200">
                <div className="flex items-center gap-2">
                    <History size={18} />
                    <span className="font-medium">版本历史</span>
                    {versions.length > 0 && (
                        <span className="text-xs text-zinc-500">({versions.length})</span>
                    )}
                </div>
                {onClose && (
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
                        <X size={16} />
                    </Button>
                )}
            </div>

            <div className="p-4 border-b border-zinc-100">
                <Button
                    className="w-full"
                    variant="outline"
                    onClick={handleCreate}
                    disabled={createMutation.isPending}
                >
                    {createMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                        <Plus size={16} className="mr-2" />
                    )}
                    保存当前版本
                </Button>
            </div>

            {compareVersion && selectedVersion && (
                <div className="p-3 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
                    <div className="text-xs text-blue-700">
                        <ArrowLeftRight size={12} className="inline mr-1" />
                        对比模式：已选 2 个版本
                    </div>
                    <div className="flex gap-1">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-6 text-xs px-2"
                            onClick={handleCompare}
                            disabled={diffMutation.isPending}
                        >
                            {diffMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : '对比'}
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs px-2"
                            onClick={() => {
                                setCompareVersion(null)
                                setDiffResult(null)
                                setShowDiff(false)
                            }}
                        >
                            取消
                        </Button>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                    </div>
                ) : versions.length === 0 ? (
                    <div className="text-center py-8 text-zinc-500">
                        <History size={32} className="mx-auto mb-2 text-zinc-300" />
                        <p className="text-sm">暂无版本记录</p>
                        <p className="text-xs text-zinc-400 mt-1">点击上方按钮保存当前版本</p>
                    </div>
                ) : (
                    versions.map((version) => (
                        <div
                            key={version.versionId}
                            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                                selectedVersion?.versionId === version.versionId
                                    ? 'bg-blue-50 border-blue-200'
                                    : compareVersion?.versionId === version.versionId
                                    ? 'bg-amber-50 border-amber-200'
                                    : 'bg-white border-zinc-200 hover:bg-zinc-50'
                            }`}
                            onClick={() => handleVersionClick(version)}
                            onContextMenu={(e) => handleVersionRightClick(version, e)}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                    {version.description && (
                                        <p className="text-sm font-medium text-zinc-800 truncate">
                                            {version.description}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <Clock size={12} className="text-zinc-400" />
                                        <span className="text-xs text-zinc-500">
                                            {formatDate(version.createdAt)}
                                        </span>
                                        {version.source && version.source !== 'manual' && (
                                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                                                version.source === 'rollback-safety'
                                                    ? 'bg-amber-100 text-amber-700'
                                                    : 'bg-zinc-100 text-zinc-600'
                                            }`}>
                                                {getSourceLabel(version.source)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 text-zinc-400 hover:text-red-500 shrink-0"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        deleteMutation.mutate(version.versionId)
                                    }}
                                    disabled={deleteMutation.isPending}
                                >
                                    <Trash2 size={12} />
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {showDiff && diffResult && (
                <div className="border-t border-zinc-200 max-h-60 overflow-y-auto">
                    <div className="p-3 border-b border-zinc-100 flex items-center justify-between">
                        <span className="text-xs font-medium text-zinc-700">版本差异</span>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setShowDiff(false)}>
                            <X size={12} />
                        </Button>
                    </div>
                    <div className="p-3 space-y-2 text-xs">
                        {diffResult.added.length > 0 && (
                            <div>
                                <p className="font-medium text-green-700 mb-1">新增 ({diffResult.added.length})</p>
                                {diffResult.added.map((item, i) => (
                                    <p key={i} className="text-green-600 pl-2 truncate">+ {item.content || item.blockType}</p>
                                ))}
                            </div>
                        )}
                        {diffResult.removed.length > 0 && (
                            <div>
                                <p className="font-medium text-red-700 mb-1">删除 ({diffResult.removed.length})</p>
                                {diffResult.removed.map((item, i) => (
                                    <p key={i} className="text-red-600 pl-2 truncate">- {item.content || item.blockType}</p>
                                ))}
                            </div>
                        )}
                        {diffResult.added.length === 0 && diffResult.removed.length === 0 && diffResult.modified.length === 0 && (
                            <p className="text-zinc-500">两个版本内容相同</p>
                        )}
                    </div>
                </div>
            )}

            {selectedVersion && !showDiff && (
                <div className="p-4 border-t border-zinc-200 space-y-2">
                    <p className="text-xs text-zinc-500">
                        选中版本：{selectedVersion.description || formatDate(selectedVersion.createdAt)}
                    </p>
                    {confirmRollback ? (
                        <div className="space-y-2">
                            <p className="text-xs text-amber-600">
                                确定要恢复到此版本吗？当前内容将自动保存为备份版本。
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    className="h-7 text-xs flex-1"
                                    onClick={handleRollback}
                                    disabled={rollbackMutation.isPending}
                                >
                                    {rollbackMutation.isPending ? (
                                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                    ) : (
                                        <RotateCcw size={12} className="mr-1" />
                                    )}
                                    确认恢复
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => setConfirmRollback(false)}
                                >
                                    取消
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs flex-1"
                                onClick={() => setConfirmRollback(true)}
                            >
                                <RotateCcw size={12} className="mr-1" />
                                恢复到此版本
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => {
                                    setCompareVersion(selectedVersion)
                                    setSelectedVersion(null)
                                }}
                                title="右键点击另一个版本进行对比"
                            >
                                <ArrowLeftRight size={12} />
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
