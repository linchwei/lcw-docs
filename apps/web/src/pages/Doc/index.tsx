import '@lcw-doc/shadcn/style.css'

import { LcwDocEditor } from '@lcw-doc/core'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@lcw-doc/shadcn-shared-ui/components/ui/dropdown-menu'
import { Separator } from '@lcw-doc/shadcn-shared-ui/components/ui/separator'
import { SidebarInset, SidebarTrigger, useSidebar } from '@lcw-doc/shadcn-shared-ui/components/ui/sidebar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@lcw-doc/shadcn-shared-ui/components/ui/tooltip'
import { useToast } from '@lcw-doc/shadcn-shared-ui/hooks/use-toast'
import { useQuery } from '@tanstack/react-query'
import {
    BookOpen,
    Check,
    ChevronDown,
    Cloud,
    CloudOff,
    Download,
    Edit3,
    Eye,
    FileText,
    History,
    Home,
    Link2,
    Loader2,
    LogOut,
    Maximize,
    MessageCircleQuestion,
    Settings,
    Sparkles,
    Users,
    WifiOff,
} from 'lucide-react'
import { Suspense, useEffect, lazy, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { IndexeddbPersistence } from 'y-indexeddb'
import { WebsocketProvider } from 'y-websocket'
import * as Y from 'yjs'

const AIReadingPanel = lazy(() => import('@/components/AIReadingPanel').then(m => ({ default: m.AIReadingPanel })))
import { BacklinksPanel } from '@/components/BacklinksPanel'
import { CollaboratorPanel } from '@/components/CollaboratorPanel'
import { CommentButton } from '@/components/CommentButton'
import { CommentPanel } from '@/components/CommentPanel'
import { DocInfoPanel } from '@/components/DocInfoPanel'
import { ExportPanel } from '@/components/ExportPanel'
import { AboutDialog } from '@/components/LayoutAside/AboutDialog'
import { SettingsDialog } from '@/components/LayoutAside/SettingsDialog'
import { NotificationBell } from '@/components/NotificationBell'
import { PageTags } from '@/components/PageTags'
import { SearchBar } from '@/components/SearchBar'
import { SharePopover } from '@/components/SharePopover'
import { ShortcutPanel } from '@/components/ShortcutPanel'
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
    const navigate = useNavigate()
    const { toast } = useToast()
    const { setEditor: setGlobalEditor } = useEditorContext()
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
    const [syncStatus, setSyncStatus] = useState<SyncStatus>('connecting')
    const [localSyncStatus, setLocalSyncStatus] = useState<LocalSyncStatus>('syncing')
    const [commentPanelOpen, setCommentPanelOpen] = useState(false)
    const [versionPanelOpen, setVersionPanelOpen] = useState(false)
    const [collaboratorPanelOpen, setCollaboratorPanelOpen] = useState(false)
    const [backlinksPanelOpen, setBacklinksPanelOpen] = useState(false)
    const [exportOpen, setExportOpen] = useState(false)
    const [settingsOpen, setSettingsOpen] = useState(false)
    const [aboutOpen, setAboutOpen] = useState(false)
    const [searchBarOpen, setSearchBarOpen] = useState(false)
    const [shortcutPanelOpen, setShortcutPanelOpen] = useState(false)
    const [docInfoOpen, setDocInfoOpen] = useState(false)
    const [aiReadingPanelOpen, setAIReadingPanelOpen] = useState(false)
    const [mode, setMode] = useState<'edit' | 'read' | 'review'>('edit')
    const [outlineCollapsed, setOutlineCollapsed] = useState(() => {
        return localStorage.getItem('doc-outline-collapsed') === 'true'
    })
    const [pageWidth, setPageWidth] = useState<'default' | 'wide' | 'full'>(() => {
        return (localStorage.getItem('lcwdoc-page-width') as 'default' | 'wide' | 'full') || 'default'
    })
    const { data: currentUser } = useQuery({
        queryKey: ['currentUser'],
        queryFn: async () => {
            const res = await srv.currentUser()
            return res.data
        },
    })
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

    const [emojiPickerOpen, setEmojiPickerOpen] = useState(false)
    const emojiPickerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!emojiPickerOpen) return
        const handleClickOutside = (e: MouseEvent) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
                setEmojiPickerOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [emojiPickerOpen])

    const handleEmojiSelect = async (emoji: string) => {
        setEmojiPickerOpen(false)
        if (!page?.pageId) return
        await srv.updatePage({ pageId: page.pageId, emoji })
        queryClient.invalidateQueries({ queryKey: ['page', page?.pageId] })
    }

    const handleEditorReady = (editor: LcwDocEditor<any, any, any>) => {
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
    }

    const handleLogout = () => {
        toast({ title: '退出登录' })
        localStorage.removeItem('token')
        navigate(`/account/login?redirect=${window.location.pathname}`)
    }

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
                e.preventDefault()
                setSearchBarOpen(true)
            }
            if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'H') {
                e.preventDefault()
                setSearchBarOpen(true)
            }
            if ((e.metaKey || e.ctrlKey) && e.key === '/') {
                e.preventDefault()
                setShortcutPanelOpen(true)
            }
            if (e.key === 'e' && !e.metaKey && !e.ctrlKey && !e.altKey) {
                const active = document.activeElement
                const isEditor = active?.closest('.bn-editor')
                const isInput = active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA' || (active as HTMLElement)?.isContentEditable
                if ((!isInput && !isEditor && page?.role === 'owner') || page?.role === 'editor') {
                    setMode('edit')
                }
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [page?.role])

    const handleTitleInput = debounce((e: React.FormEvent<HTMLDivElement>) => {
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

    const [outlineHidden, setOutlineHidden] = useState(false)
    const { setOpen: setSidebarOpen } = useSidebar()

    useEffect(() => {
        if (page?.role) {
            if (page.role !== 'editor' && page.role !== 'owner') {
                setMode('read')
            }
        }
    }, [page?.role])

    useEffect(() => {
        let timeoutId: ReturnType<typeof setTimeout>
        const handleResize = () => {
            clearTimeout(timeoutId)
            timeoutId = setTimeout(() => {
                const width = window.innerWidth
                if (width < 1340) {
                    setSidebarOpen(false)
                }
                if (width < 1100) {
                    setOutlineCollapsed(true)
                } else {
                    const saved = localStorage.getItem('doc-outline-collapsed')
                    setOutlineCollapsed(saved === 'true')
                }
                if (width < 940) {
                    setOutlineHidden(true)
                } else {
                    setOutlineHidden(false)
                }
            }, 150)
        }

        handleResize()
        window.addEventListener('resize', handleResize)
        return () => {
            window.removeEventListener('resize', handleResize)
            clearTimeout(timeoutId)
        }
    }, [setSidebarOpen])

    useEffect(() => {
        localStorage.setItem('doc-outline-collapsed', String(outlineCollapsed))
    }, [outlineCollapsed])

    useEffect(() => {
        localStorage.setItem('lcwdoc-page-width', pageWidth)
    }, [pageWidth])

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
            setGlobalEditor(null)
        }
    }, [pageId, provider, doc, indexeddbProvider, setGlobalEditor])

    return (
        <SidebarInset className="flex flex-col h-screen min-w-0">
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
                    {(page?.role === 'editor' || page?.role === 'owner') && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="inline-flex items-center gap-1.5 h-7 px-2.5 text-xs rounded-md border border-zinc-200 dark:border-zinc-700 hover:bg-accent transition-colors">
                                    {mode === 'edit' ? <Edit3 size={12} /> : mode === 'review' ? <Eye size={12} /> : <BookOpen size={12} />}
                                    {mode === 'edit' ? '编辑' : mode === 'review' ? '修订' : '阅读'}
                                    <ChevronDown size={12} className="text-muted-foreground" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-32 rounded-lg" align="end">
                                <DropdownMenuItem onClick={() => setMode('edit')}>
                                    <Edit3 className="mr-2 h-4 w-4" />
                                    编辑模式
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setMode('review')}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    修订模式
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setMode('read')}>
                                    <BookOpen className="mr-2 h-4 w-4" />
                                    阅读模式
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="inline-flex items-center justify-center rounded-md h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                                <Maximize size={14} />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-36 rounded-lg" align="end">
                            <DropdownMenuItem
                                onClick={() => setPageWidth('default')}
                                className={pageWidth === 'default' ? 'bg-accent' : ''}
                            >
                                默认宽度
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setPageWidth('wide')} className={pageWidth === 'wide' ? 'bg-accent' : ''}>
                                较宽
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setPageWidth('full')} className={pageWidth === 'full' ? 'bg-accent' : ''}>
                                全宽
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={() => setDocInfoOpen(true)}
                                    className="inline-flex items-center justify-center rounded-md h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                                >
                                    <FileText size={14} />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>文档信息</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
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
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="inline-flex items-center justify-center rounded-full h-7 w-7 bg-[#6B45FF] text-white text-xs font-medium hover:opacity-90 transition-opacity ml-1">
                                {currentUser?.username?.charAt(0).toUpperCase() || '?'}
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-48 rounded-lg" align="end">
                            {currentUser && <div className="px-2 py-1.5 text-sm font-medium">{currentUser.username}</div>}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                                <Settings className="mr-2 h-4 w-4" />
                                设置
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setAboutOpen(true)}>
                                <MessageCircleQuestion className="mr-2 h-4 w-4" />
                                关于
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout}>
                                <LogOut className="mr-2 h-4 w-4" />
                                退出登录
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>
            <div className="flex-1 overflow-hidden">
                <div className="flex h-full overflow-hidden">
                    {editorInstance && !outlineHidden && (
                        <DocOutline
                            editor={editorInstance}
                            collapsed={outlineCollapsed}
                            onToggleCollapse={() => setOutlineCollapsed(!outlineCollapsed)}
                        />
                    )}
                    <div className="flex-1 min-w-0 overflow-auto scroll-smooth relative">
                        <SearchBar editor={editorInstance} open={searchBarOpen} onClose={() => setSearchBarOpen(false)} />
                        <div
                            className={`w-full ${pageWidth === 'default' ? 'max-w-[820px]' : pageWidth === 'wide' ? 'max-w-[1100px]' : 'max-w-none'} pl-6 pr-6 lg:pr-24 pt-14`}
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center py-20">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    <span className="ml-2 text-muted-foreground">加载中...</span>
                                </div>
                            ) : (
                                <>
                                    {page?.coverImage && (
                                        <div className="relative -mx-6 -mt-24 mb-6 group">
                                            <img src={page.coverImage} alt="cover" className="w-full h-48 object-cover rounded-b-lg" />
                                            <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={async () => {
                                                        const covers = [
                                                            'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&h=400&fit=crop',
                                                            'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&h=400&fit=crop',
                                                            'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=1200&h=400&fit=crop',
                                                            'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=1200&h=400&fit=crop',
                                                            'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200&h=400&fit=crop',
                                                            'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&h=400&fit=crop',
                                                            'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=1200&h=400&fit=crop',
                                                            'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=400&fit=crop',
                                                            'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&h=400&fit=crop',
                                                            'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&h=400&fit=crop',
                                                            'https://images.unsplash.com/photo-1505144808419-1957a94ca61e?w=1200&h=400&fit=crop',
                                                            'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=1200&h=400&fit=crop',
                                                        ]
                                                        const cover = covers[Math.floor(Math.random() * covers.length)]
                                                        await srv.updatePage({ pageId: page.pageId, coverImage: cover })
                                                        queryClient.invalidateQueries({ queryKey: ['page', page?.pageId] })
                                                    }}
                                                    className="h-7 px-3 text-xs bg-black/50 text-white rounded-md hover:bg-black/70 transition-colors"
                                                >
                                                    更换封面
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        await srv.updatePage({ pageId: page.pageId, coverImage: null })
                                                        queryClient.invalidateQueries({ queryKey: ['page', page?.pageId] })
                                                    }}
                                                    className="h-7 px-3 text-xs bg-black/50 text-white rounded-md hover:bg-black/70 transition-colors"
                                                >
                                                    移除
                                                </button>
                                            </div>
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
                                    <div className="flex flex-row items-start gap-2 mb-1">
                                        <div className="relative shrink-0" ref={emojiPickerRef}>
                                            <button
                                                onClick={() => {
                                                    if (mode === 'edit' && (page?.role === 'editor' || page?.role === 'owner')) {
                                                        setEmojiPickerOpen(!emojiPickerOpen)
                                                    }
                                                }}
                                                className="text-[40px] leading-none hover:bg-zinc-100 rounded-md p-1 transition-colors"
                                                title={page?.emoji ? '更换图标' : '添加图标'}
                                            >
                                                {page?.emoji || '📄'}
                                            </button>
                                            {emojiPickerOpen && (
                                                <div className="absolute left-0 top-12 z-50 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 p-3 w-[280px]">
                                                    <div className="grid grid-cols-8 gap-1">
                                                        {[
                                                            '📄',
                                                            '📝',
                                                            '📋',
                                                            '📌',
                                                            '📎',
                                                            '📁',
                                                            '📂',
                                                            '🗂️',
                                                            '📊',
                                                            '📈',
                                                            '📉',
                                                            '🗓️',
                                                            '📆',
                                                            '⏰',
                                                            '🔔',
                                                            '💬',
                                                            '💡',
                                                            '🎯',
                                                            '🏆',
                                                            '⭐',
                                                            '🔥',
                                                            '💎',
                                                            '🚀',
                                                            '🎨',
                                                            '🎵',
                                                            '📷',
                                                            '🎬',
                                                            '🎮',
                                                            '🏠',
                                                            '🏢',
                                                            '🌍',
                                                            '🌈',
                                                            '☀️',
                                                            '🌙',
                                                            '⭐',
                                                            '🍀',
                                                            '🌸',
                                                            '🌺',
                                                            '🌻',
                                                            '🌲',
                                                            '🍎',
                                                            '🍕',
                                                            '☕',
                                                            '🎂',
                                                            '🎁',
                                                            '❤️',
                                                            '💙',
                                                            '💚',
                                                            '💜',
                                                            '🧡',
                                                            '💛',
                                                            '🤍',
                                                            '🖤',
                                                            '✅',
                                                            '❌',
                                                            '⚡',
                                                            '🔧',
                                                            '🔨',
                                                            '⚙️',
                                                            '🔑',
                                                            '🔒',
                                                            '📖',
                                                            '🎓',
                                                            '💰',
                                                        ].map(e => (
                                                            <button
                                                                key={e}
                                                                onClick={() => handleEmojiSelect(e)}
                                                                className="text-xl hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded p-1 transition-colors"
                                                            >
                                                                {e}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    {page?.emoji && (
                                                        <button
                                                            onClick={async () => {
                                                                setEmojiPickerOpen(false)
                                                                await srv.updatePage({ pageId: page.pageId, emoji: '📄' })
                                                                queryClient.invalidateQueries({ queryKey: ['page', page?.pageId] })
                                                            }}
                                                            className="mt-2 w-full text-xs text-zinc-400 hover:text-zinc-600 py-1 transition-colors"
                                                        >
                                                            重置图标
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <h1 className="flex flex-row font-serif text-[40px] font-bold leading-tight">
                                        <div
                                            contentEditable={mode === 'edit' && (page?.role === 'editor' || page?.role === 'owner')}
                                            ref={titleRef}
                                            className="inline-block flex-1 outline-none text-[#37352f] empty:before:content-[attr(data-placeholder)] empty:before:text-[#c7c7c5]"
                                            data-placeholder="无标题"
                                            onInput={
                                                mode === 'edit' && (page?.role === 'editor' || page?.role === 'owner')
                                                    ? handleTitleInput
                                                    : undefined
                                            }
                                        />
                                        <button
                                            onClick={() => setAIReadingPanelOpen(!aiReadingPanelOpen)}
                                            className="shrink-0 ml-2 mt-2 inline-flex items-center gap-1 h-7 px-2.5 text-xs rounded-md border border-zinc-200 dark:border-zinc-700 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                                            title="AI 阅读"
                                        >
                                            <Sparkles size={14} />
                                            AI 阅读
                                        </button>
                                    </h1>
                                    {mode === 'read' && (page?.role === 'editor' || page?.role === 'owner') && (
                                        <div className="flex items-center gap-1.5 mb-4 px-3 py-1.5 bg-zinc-100 rounded-md w-fit">
                                            <BookOpen size={14} className="text-zinc-500" />
                                            <span className="text-xs text-zinc-500">阅读模式 - 你只能查看和复制此文档</span>
                                        </div>
                                    )}
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
                                            editable={
                                                (mode === 'edit' || mode === 'review') &&
                                                (page?.role === 'editor' || page?.role === 'owner')
                                            }
                                        />
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                    {commentPanelOpen && page?.pageId && <CommentPanel pageId={page.pageId} onClose={() => setCommentPanelOpen(false)} />}
                    {versionPanelOpen && page?.pageId && <VersionPanel pageId={page.pageId} onClose={() => setVersionPanelOpen(false)} />}
                    {collaboratorPanelOpen && page?.pageId && (
                        <CollaboratorPanel pageId={page.pageId} onClose={() => setCollaboratorPanelOpen(false)} />
                    )}
                    {backlinksPanelOpen && page?.pageId && (
                        <BacklinksPanel pageId={page.pageId} onClose={() => setBacklinksPanelOpen(false)} />
                    )}
                    {aiReadingPanelOpen && (
                        <Suspense fallback={null}>
                            <AIReadingPanel onClose={() => setAIReadingPanelOpen(false)} />
                        </Suspense>
                    )}
                </div>
            </div>
            <StatusBar editor={editorInstance} />
            <ExportPanel open={exportOpen} onOpenChange={setExportOpen} editor={editorInstance} fileName={page?.title || 'document'} />
            <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} username={currentUser?.username} />
            <AboutDialog open={aboutOpen} onOpenChange={setAboutOpen} />
            <ShortcutPanel open={shortcutPanelOpen} onClose={() => setShortcutPanelOpen(false)} />
            <DocInfoPanel editor={editorInstance} open={docInfoOpen} onClose={() => setDocInfoOpen(false)} />
        </SidebarInset>
    )
}
