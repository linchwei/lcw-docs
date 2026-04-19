import '@lcw-doc/shadcn/style.css'

import { LcwDocEditor } from '@lcw-doc/core'
import { Separator } from '@lcw-doc/shadcn-shared-ui/components/ui/separator'
import { SidebarInset, SidebarTrigger } from '@lcw-doc/shadcn-shared-ui/components/ui/sidebar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@lcw-doc/shadcn-shared-ui/components/ui/tooltip'
import { useQuery } from '@tanstack/react-query'
import { Check, Cloud, CloudOff, Download, Eye, History, Home, Link2, Loader2, Users, WifiOff } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { IndexeddbPersistence } from 'y-indexeddb'
import { WebsocketProvider } from 'y-websocket'
import * as Y from 'yjs'

import { BacklinksPanel } from '@/components/BacklinksPanel'
import { CommentButton } from '@/components/CommentButton'
import { CommentPanel } from '@/components/CommentPanel'
import { CollaboratorPanel } from '@/components/CollaboratorPanel'
import { ExportPanel } from '@/components/ExportPanel'
import { NotificationBell } from '@/components/NotificationBell'
import { PageTags } from '@/components/PageTags'
import { SharePopover } from '@/components/SharePopover'
import { StatusBar } from '@/components/StatusBar'
import { VersionPanel } from '@/components/VersionPanel'
import { useEditorContext } from '@/context/EditorContext'
import * as srv from '@/services'
import { Comment } from '@/types/api'
import { debounce } from '@/utils/debounce'
import { queryClient } from '@/utils/query-client'

import { AvatarList } from './AvatarList'
import { DocEditor } from './DocEditor'
import { DocOutline } from './DocOutline'

type SaveStatus = 'saving' | 'saved' | 'idle'
type SyncStatus = 'connecting' | 'connected' | 'disconnected'
type LocalSyncStatus = 'syncing' | 'synced'

export const Doc = () => {
    const params = useParams()
    const { setEditor: setGlobalEditor } = useEditorContext()
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
    const [syncStatus, setSyncStatus] = useState<SyncStatus>('connecting')
    const [localSyncStatus, setLocalSyncStatus] = useState<LocalSyncStatus>('syncing')
    const [commentPanelOpen, setCommentPanelOpen] = useState(false)
    const [versionPanelOpen, setVersionPanelOpen] = useState(false)
    const [collaboratorPanelOpen, setCollaboratorPanelOpen] = useState(false)
    const [backlinksPanelOpen, setBacklinksPanelOpen] = useState(false)
    const [exportOpen, setExportOpen] = useState(false)
    const { data: page, isLoading } = useQuery({
        queryKey: ['page', params?.id],
        queryFn: async () => {
            if (!params?.id) {
                return
            }
            return (await srv.fetchPageDetail(params?.id)).data
        },
        enabled: !!params?.id,
    })
    const { data: commentsData } = useQuery({
        queryKey: ['comments', page?.pageId],
        queryFn: async () => {
            if (!page?.pageId) return []
            const res = await srv.fetchComments(page.pageId)
            return res.data || []
        },
        enabled: !!page?.pageId,
    })
    const commentCount = ((commentsData as Comment[]) || []).filter((c: Comment) => !c.resolvedAt).length
    const [remoteUsers, setRemoteUsers] = useState<Map<number, { name: string; color: string }>>()
    const [editorInstance, setEditorInstance] = useState<LcwDocEditor<any, any, any> | null>(null)
    const titleRef = useRef<HTMLDivElement>(null)
    const pageRef = useRef(page)
    pageRef.current = page
    const pageId = params?.id
    const doc = useMemo(() => new Y.Doc(), [pageId])
    const provider = useMemo(() => {
        const wsUrl = (window as any).__WS_URL__ || 'ws://localhost:8082'
        const token = localStorage.getItem('token')
        const wsParams = token ? { connect: false, params: { token } } : { connect: false }
        return new WebsocketProvider(wsUrl, `doc-yjs-${pageId}`, doc, wsParams)
    }, [pageId, doc])
    const indexeddbProvider = useMemo(() => {
        return new IndexeddbPersistence(`doc-yjs-${pageId}`, doc)
    }, [pageId, doc])

    const handleEditorReady = useCallback(
        (editor: LcwDocEditor<any, any, any>) => {
            setEditorInstance(editor)
            setGlobalEditor(editor)

            const pendingMarkdown = sessionStorage.getItem('md-pending-markdown')
            if (pendingMarkdown) {
                sessionStorage.removeItem('md-pending-markdown')
                editor
                    .tryParseMarkdownToBlocks(pendingMarkdown)
                    .then(blocks => {
                        if (Array.isArray(blocks) && blocks.length > 0) {
                            editor.replaceBlocks(editor.document, blocks)
                        }
                    })
                    .catch(err => {
                        console.error('Failed to parse markdown:', err)
                    })
            }

            const pendingTemplate = sessionStorage.getItem('template-pending-markdown')
            if (pendingTemplate) {
                sessionStorage.removeItem('template-pending-markdown')
                editor
                    .tryParseMarkdownToBlocks(pendingTemplate)
                    .then(blocks => {
                        if (Array.isArray(blocks) && blocks.length > 0) {
                            editor.replaceBlocks(editor.document, blocks)
                        }
                    })
                    .catch(err => {
                        console.error('Failed to parse template:', err)
                    })
            }
        },
        [setGlobalEditor]
    )

    const handleTitleInput = useMemo(() => {
        return debounce((e: React.FormEvent<HTMLDivElement>) => {
            const currentPage = pageRef.current
            if (!currentPage) {
                return
            }
            const title = (e.target as HTMLDivElement).innerText
            setSaveStatus('saving')
            srv.updatePage({
                pageId: currentPage.pageId,
                title,
            })
                .then(() => {
                    setSaveStatus('saved')
                    setTimeout(() => setSaveStatus('idle'), 2000)
                    queryClient.invalidateQueries({ queryKey: ['page', params?.id] })
                })
                .catch(() => {
                    setSaveStatus('idle')
                })
            queryClient.invalidateQueries({ queryKey: ['pages'] })
        })
    }, [params?.id])

    useEffect(() => {
        if (titleRef.current && page?.title !== undefined) {
            if (document.activeElement !== titleRef.current) {
                titleRef.current.innerHTML = page.title
            }
        }
    }, [page?.title])

    useEffect(() => {
        const changeHandler = () => {
            const states = provider.awareness.getStates()
            const users = new Map<number, { name: string; color: string }>()
            const cursors = new Map<number, { x: number; y: number; windowSize: { width: number; height: number } }>()
            for (const [key, value] of states) {
                if (key === provider.awareness.clientID) {
                    continue
                }
                users.set(key, value.user)
                cursors.set(key, value.cursor)
            }
            setRemoteUsers(users)
        }

        provider.awareness.on('change', changeHandler)

        return () => {
            provider.awareness.off('change', changeHandler)
        }
    }, [provider])

    useEffect(() => {
        const statusHandler = ({ status }: { status: 'connecting' | 'connected' | 'disconnected' }) => {
            setSyncStatus(status)
        }

        provider.on('status', statusHandler)

        return () => {
            provider.off('status', statusHandler)
        }
    }, [provider])

    useEffect(() => {
        if (indexeddbProvider) {
            indexeddbProvider.whenSynced.then(() => {
                setLocalSyncStatus('synced')
                provider.connect()
            })
        } else {
            provider.connect()
        }

        return () => {
            provider.disconnect()
            doc.destroy()
            setGlobalEditor(null)
        }
    }, [pageId, provider, doc, indexeddbProvider, setGlobalEditor])

    return (
        <SidebarInset className="flex flex-col h-screen">
            <header className="sticky top-0 z-10 flex flex-row justify-between items-center h-[52px] px-[16px] border-b border-b-zinc-100 backdrop-blur-md bg-white/80 dark:bg-zinc-900/80 shrink-0">
                <div className="flex flex-row items-center gap-2">
                    <SidebarTrigger />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <Link to="/" className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
                        <Home size={16} />
                    </Link>
                    <span className="text-muted-foreground mx-1 text-sm">/</span>
                    <div className="flex flex-row flex-auto items-center text-sm font-medium text-foreground">
                        <p className="overflow-hidden whitespace-nowrap max-w-[300px] text-ellipsis" title={page?.title}>
                            {page?.title}
                        </p>
                    </div>
                    {saveStatus === 'saving' && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground ml-2">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            保存中...
                        </span>
                    )}
                    {saveStatus === 'saved' && (
                        <span className="flex items-center gap-1 text-xs text-green-600 ml-2">
                            <Check className="h-3 w-3" />
                            已保存
                        </span>
                    )}
                    {syncStatus === 'connecting' && (
                        <span className="flex items-center gap-1 text-xs text-yellow-600 ml-2">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            同步中...
                        </span>
                    )}
                    {syncStatus === 'connected' && (
                        <span className="flex items-center gap-1 text-xs text-green-600 ml-2">
                            <Cloud className="h-3 w-3" />
                            已同步
                        </span>
                    )}
                    {syncStatus === 'disconnected' && localSyncStatus === 'synced' && (
                        <span className="flex items-center gap-1 text-xs text-amber-600 ml-2">
                            <CloudOff className="h-3 w-3" />
                            离线模式（本地已保存）
                        </span>
                    )}
                    {syncStatus === 'disconnected' && localSyncStatus === 'syncing' && (
                        <span className="flex items-center gap-1 text-xs text-red-500 ml-2">
                            <WifiOff className="h-3 w-3" />
                            连接断开
                        </span>
                    )}
                </div>
                <div className="flex flex-row items-center gap-4">
                    {remoteUsers && <AvatarList remoteUsers={remoteUsers} />}
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={() => setExportOpen(true)}
                                    className="inline-flex items-center justify-center rounded-md h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                                >
                                    <Download size={16} />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>导出</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span>
                                    <CommentButton onClick={() => setCommentPanelOpen(!commentPanelOpen)} commentCount={commentCount} />
                                </span>
                            </TooltipTrigger>
                            <TooltipContent>评论</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={() => setVersionPanelOpen(!versionPanelOpen)}
                                    className="inline-flex items-center justify-center rounded-md h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                                >
                                    <History size={16} />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>版本历史</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={() => setCollaboratorPanelOpen(!collaboratorPanelOpen)}
                                    className="inline-flex items-center justify-center rounded-md h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                                >
                                    <Users size={16} />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>协作者</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span>
                                    <SharePopover pageId={page?.pageId} />
                                </span>
                            </TooltipTrigger>
                            <TooltipContent>分享</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <NotificationBell />
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={() => setBacklinksPanelOpen(!backlinksPanelOpen)}
                                    className="inline-flex items-center justify-center rounded-md h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                                >
                                    <Link2 size={16} />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>反向链接</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </header>
            <div className="flex-1 overflow-hidden">
                <div className="flex h-full">
                    <div className="flex-1 min-w-0 overflow-auto">
                        <div className="flex justify-center">
                            <div className="max-w-[900px] w-full px-4 md:px-12 lg:px-24 pt-24">
                                {isLoading ? (
                                    <div className="flex items-center justify-center py-20">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                        <span className="ml-2 text-muted-foreground">加载中...</span>
                                    </div>
                                ) : (
                                    <>
                                        {page?.coverImage && (
                                            <div className="relative -mx-4 md:-mx-12 lg:-mx-24 -mt-24 mb-6 group">
                                                <img
                                                    src={page.coverImage}
                                                    alt="cover"
                                                    className="w-full h-48 object-cover rounded-b-lg"
                                                />
                                                <button
                                                    onClick={async () => {
                                                        await srv.updatePage({ pageId: page.pageId, coverImage: null })
                                                        queryClient.invalidateQueries({ queryKey: ['page', page?.pageId] })
                                                    }}
                                                    className="absolute top-2 right-2 h-7 px-3 text-xs bg-black/50 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                                                >
                                                    移除封面
                                                </button>
                                            </div>
                                        )}
                                        {!page?.coverImage && (
                                            <div className="-mt-16 mb-4">
                                                <button
                                                    onClick={async () => {
                                                        const covers = [
                                                            'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&h=400&fit=crop',
                                                            'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&h=400&fit=crop',
                                                            'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=1200&h=400&fit=crop',
                                                            'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=1200&h=400&fit=crop',
                                                            'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200&h=400&fit=crop',
                                                            'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&h=400&fit=crop',
                                                        ]
                                                        const cover = covers[Math.floor(Math.random() * covers.length)]
                                                        await srv.updatePage({ pageId: page!.pageId, coverImage: cover })
                                                        queryClient.invalidateQueries({ queryKey: ['page', page?.pageId] })
                                                    }}
                                                    className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
                                                >
                                                    + 添加封面
                                                </button>
                                            </div>
                                        )}
                                        <h1 className="flex flex-row font-serif text-[40px] font-bold leading-tight">
                                            <div
                                                contentEditable={page?.role === 'editor' || page?.role === 'owner'}
                                                ref={titleRef}
                                                className="inline-block flex-1 outline-none text-[#37352f] empty:before:content-[attr(data-placeholder)] empty:before:text-[#c7c7c5]"
                                                data-placeholder="无标题"
                                                onInput={page?.role === 'editor' || page?.role === 'owner' ? handleTitleInput : undefined}
                                            />
                                        </h1>
                                        {page?.role === 'viewer' && (
                                            <div className="flex items-center gap-1.5 mb-4 px-3 py-1.5 bg-zinc-100 rounded-md w-fit">
                                                <Eye size={14} className="text-zinc-500" />
                                                <span className="text-xs text-zinc-500">只读模式 - 你只能查看此文档</span>
                                            </div>
                                        )}
                                        {page?.role === 'commenter' && (
                                            <div className="flex items-center gap-1.5 mb-4 px-3 py-1.5 bg-amber-50 rounded-md w-fit">
                                                <Eye size={14} className="text-amber-500" />
                                                <span className="text-xs text-amber-600">评论模式 - 你可以查看和评论此文档</span>
                                            </div>
                                        )}
                                        <PageTags pageId={page?.pageId} />
                                        {page?.id && (
                                            <DocEditor
                                                key={page?.id}
                                                pageId={page.pageId}
                                                doc={doc}
                                                provider={provider}
                                                onEditorReady={handleEditorReady}
                                                editable={page?.role === 'editor' || page?.role === 'owner'}
                                            />
                                        )}
                                    </>
                                )}
                            </div>
                            {editorInstance && <DocOutline editor={editorInstance} />}
                        </div>
                    </div>
                    {commentPanelOpen && page?.pageId && <CommentPanel pageId={page.pageId} onClose={() => setCommentPanelOpen(false)} />}
                    {versionPanelOpen && page?.pageId && <VersionPanel pageId={page.pageId} onClose={() => setVersionPanelOpen(false)} />}
                    {collaboratorPanelOpen && page?.pageId && <CollaboratorPanel pageId={page.pageId} onClose={() => setCollaboratorPanelOpen(false)} />}
                    {backlinksPanelOpen && page?.pageId && <BacklinksPanel pageId={page.pageId} onClose={() => setBacklinksPanelOpen(false)} />}
                </div>
            </div>
            <StatusBar editor={editorInstance} />
            <ExportPanel open={exportOpen} onOpenChange={setExportOpen} editor={editorInstance} fileName={page?.title || 'document'} />
        </SidebarInset>
    )
}
