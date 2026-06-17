import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@lcw-doc/shadcn-shared-ui/components/ui/collapsible'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from '@lcw-doc/shadcn-shared-ui/components/ui/dropdown-menu'
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuAction,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@lcw-doc/shadcn-shared-ui/components/ui/sidebar'
import { useToast } from '@lcw-doc/shadcn-shared-ui/hooks/use-toast'
import { cn } from '@lcw-doc/shadcn-shared-ui/lib/utils'
import { useQuery } from '@tanstack/react-query'
import {
    ArrowUpRight,
    CheckSquare,
    Clock,
    FileStack,
    FolderInput,
    FolderPlus,
    LayoutTemplate,
    LogOut,
    MessageCircleQuestion,
    MoreHorizontal,
    Plus,
    RotateCcw,
    Search,
    Settings,
    Share2,
    Square,
    Star,
    StarOff,
    Trash2,
    Waypoints,
    X,
} from 'lucide-react'
import { useCallback, useState } from 'react'
import { NavLink, useMatch, useNavigate } from 'react-router-dom'

import { TemplateDialog } from '@/components/TemplateDialog'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Template } from '@/data/templates'
import * as srv from '@/services'
import { Folder } from '@/types/api'
import { Page } from '@/types/page'
import { queryClient } from '@/utils/query-client'
import { randomEmoji } from '@/utils/randomEmoji'

import { AboutDialog } from './AboutDialog'
import { DroppableFolderItem } from './DroppableFolderItem'
import { SearchDialog } from './SearchDialog'
import { SettingsDialog } from './SettingsDialog'
import { SidebarDndContext } from './SidebarDndContext'
import { SortablePageItem } from './SortablePageItem'

export function Aside() {
    const [searchOpen, setSearchOpen] = useState(false)
    const [settingsOpen, setSettingsOpen] = useState(false)
    const [aboutOpen, setAboutOpen] = useState(false)
    const [showTrash, setShowTrash] = useState(false)
    const [templateOpen, setTemplateOpen] = useState(false)
    const [trashSelectionMode, setTrashSelectionMode] = useState(false)
    const [trashSelectedIds, setTrashSelectedIds] = useState<Set<string>>(new Set())
    const [clearTrashDialogOpen, setClearTrashDialogOpen] = useState(false)
    const [batchPermanentDeleteDialogOpen, setBatchPermanentDeleteDialogOpen] = useState(false)
    const { data: pages, refetch } = useQuery({
        queryKey: ['pages'],
        queryFn: async () => {
            return (await srv.fetchPageList()).data.pages
        },
    })
    const { data: trashPages } = useQuery({
        queryKey: ['trash'],
        queryFn: async () => {
            return (await srv.fetchTrashList()).data
        },
    })
    const { data: recentPages } = useQuery({
        queryKey: ['recentPages'],
        queryFn: async () => {
            return (await srv.fetchRecentPages()).data
        },
    })
    const { data: folders } = useQuery({
        queryKey: ['folders'],
        queryFn: async () => {
            const res = await srv.fetchFolders()
            return res.data || []
        },
    })
    const { data: sharedPages } = useQuery({
        queryKey: ['sharedPages'],
        queryFn: async () => {
            const res = await srv.fetchSharedPages()
            return res.data || []
        },
    })
    const navigate = useNavigate()
    const activeDocParams = useMatch('/doc/:id')?.params
    const { toast } = useToast()
    const { isMobile } = useSidebar()

    const { data: currentUser } = useQuery({
        queryKey: ['currentUser'],
        queryFn: async () => {
            const res = await srv.currentUser()
            return res.data
        },
    })

    const handleCreate = async () => {
        const res = await srv.createPage({
            emoji: randomEmoji(),
            title: '未命名文档',
        })
        navigate(`/doc/${res.data.pageId}`)
        refetch()
    }

    const handleCreateFolder = async () => {
        const name = prompt('请输入文件夹名称')
        if (!name?.trim()) return
        await srv.createFolder({ name: name.trim() })
        queryClient.invalidateQueries({ queryKey: ['folders'] })
        toast({ title: '文件夹已创建' })
    }

    const handleSelectTemplate = async (template: Template) => {
        sessionStorage.setItem('template-pending-markdown', template.content)
        const res = await srv.createPage({ emoji: template.emoji, title: template.name })
        setTemplateOpen(false)
        navigate(`/doc/${res.data.pageId}`)
        refetch()
    }

    const handleDelete = async (pageId: string) => {
        await srv.removePage(pageId)
        queryClient.invalidateQueries({ queryKey: ['pages'] })
        queryClient.invalidateQueries({ queryKey: ['trash'] })
        toast({ title: '文档已移至回收站' })
        if (activeDocParams?.id === pageId) {
            navigate('/doc')
        }
    }

    const handleToggleFavorite = async (pageId: string) => {
        await srv.toggleFavorite(pageId)
        queryClient.invalidateQueries({ queryKey: ['pages'] })
    }

    const handleRestore = async (pageId: string) => {
        await srv.restorePage(pageId)
        queryClient.invalidateQueries({ queryKey: ['pages'] })
        queryClient.invalidateQueries({ queryKey: ['trash'] })
        toast({ title: '文档已恢复' })
    }

    const handlePermanentDelete = async (pageId: string) => {
        await srv.permanentDeletePage(pageId)
        queryClient.invalidateQueries({ queryKey: ['trash'] })
        toast({ title: '文档已永久删除' })
    }

    const toggleTrashSelect = useCallback((pageId: string) => {
        setTrashSelectedIds(prev => {
            const next = new Set(prev)
            if (next.has(pageId)) {
                next.delete(pageId)
            } else {
                next.add(pageId)
            }
            return next
        })
    }, [])

    const toggleTrashSelectAll = useCallback(() => {
        if (!trashPages) return
        if (trashSelectedIds.size === trashPages.length) {
            setTrashSelectedIds(new Set())
        } else {
            setTrashSelectedIds(new Set(trashPages.map((p: Page) => p.pageId)))
        }
    }, [trashPages, trashSelectedIds.size, setTrashSelectedIds])

    const handleBatchRestore = async () => {
        if (trashSelectedIds.size === 0) return
        await srv.batchRestorePages(Array.from(trashSelectedIds))
        setTrashSelectedIds(new Set())
        setTrashSelectionMode(false)
        queryClient.invalidateQueries({ queryKey: ['pages'] })
        queryClient.invalidateQueries({ queryKey: ['trash'] })
        toast({ title: `已恢复 ${trashSelectedIds.size} 个文档` })
    }

    const handleBatchPermanentDelete = async () => {
        if (trashSelectedIds.size === 0) return
        await srv.batchPermanentDeletePages(Array.from(trashSelectedIds))
        setTrashSelectedIds(new Set())
        setTrashSelectionMode(false)
        queryClient.invalidateQueries({ queryKey: ['trash'] })
        toast({ title: `已永久删除 ${trashSelectedIds.size} 个文档` })
    }

    const handleClearTrash = async () => {
        await srv.clearTrash()
        setTrashSelectedIds(new Set())
        setTrashSelectionMode(false)
        queryClient.invalidateQueries({ queryKey: ['trash'] })
        toast({ title: '回收站已清空' })
    }

    const exitTrashSelectionMode = () => {
        setTrashSelectionMode(false)
        setTrashSelectedIds(new Set())
    }

    const handleLogout = () => {
        toast({ title: '退出登录' })
        localStorage.removeItem('token')
        navigate(`/account/login?redirect=${window.location.pathname}`)
    }

    const favoritePages = pages?.filter(p => p.isFavorite) || []
    const normalPages = pages?.filter(p => !p.isFavorite) || []
    const rootPages = normalPages.filter(p => !p.folderId)
    const folderList = folders || []

    return (
        <>
            <Sidebar variant="inset" collapsible="offcanvas">
                <SidebarHeader>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                className="bg-[#ebebea] hover:bg-[#e9e9e7] rounded-md transition-colors"
                                onClick={() => setSearchOpen(true)}
                            >
                                <Search className="text-[#9b9a97]" />
                                <span className="text-[#9b9a97]">搜索</span>
                                <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-sidebar-border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                                    <span className="text-xs">⌘</span>K
                                </kbd>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild>
                                <NavLink to={`/doc`}>
                                    <FileStack />
                                    <span>全部文档</span>
                                </NavLink>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild>
                                <NavLink to={`/doc/graph`}>
                                    <Waypoints />
                                    <span>文档图谱</span>
                                </NavLink>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarHeader>
                <SidebarContent>
                    {recentPages && recentPages.length > 0 && (
                        <SidebarGroup>
                            <SidebarGroupLabel className="text-[#9b9a97] text-xs uppercase tracking-wider">最近编辑</SidebarGroupLabel>
                            <SidebarMenu>
                                {recentPages.slice(0, 5).map((item: Page) => (
                                    <SidebarMenuItem key={item.pageId}>
                                        <SidebarMenuButton
                                            asChild
                                            className={cn(
                                                'transition-colors duration-150 hover:bg-sidebar-accent',
                                                activeDocParams?.id === item.pageId &&
                                                    'bg-sidebar-accent font-semibold text-sidebar-foreground'
                                            )}
                                        >
                                            <NavLink to={`/doc/${item.pageId}`} title={item.title}>
                                                <span className="text-base leading-none">{item.emoji}</span>
                                                <span className="text-[13px] text-ellipsis overflow-hidden whitespace-nowrap">
                                                    {item.title}
                                                </span>
                                                <Clock className="ml-auto h-3 w-3 text-muted-foreground" />
                                            </NavLink>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroup>
                    )}

                    {favoritePages.length > 0 && (
                        <SidebarGroup>
                            <SidebarGroupLabel className="text-[#9b9a97] text-xs uppercase tracking-wider">收藏</SidebarGroupLabel>
                            <SidebarMenu>
                                {favoritePages.map(item => (
                                    <SidebarMenuItem key={item.pageId}>
                                        <SidebarMenuButton
                                            asChild
                                            className={cn(
                                                'transition-colors duration-150 hover:bg-sidebar-accent',
                                                activeDocParams?.id === item.pageId &&
                                                    'bg-sidebar-accent font-semibold text-sidebar-foreground'
                                            )}
                                        >
                                            <NavLink to={`/doc/${item.pageId}`} title={item.title}>
                                                <span className="text-base leading-none">{item.emoji}</span>
                                                <span className="text-[13px] text-ellipsis overflow-hidden whitespace-nowrap">
                                                    {item.title}
                                                </span>
                                            </NavLink>
                                        </SidebarMenuButton>
                                        <button
                                            onClick={e => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                handleToggleFavorite(item.pageId)
                                            }}
                                            title="取消收藏"
                                            className="ml-auto peer-menu-button shrink-0 h-5 w-5 flex items-center justify-center rounded-md text-amber-400 hover:bg-sidebar-accent transition-colors"
                                        >
                                            <Star className="h-3.5 w-3.5 fill-amber-400" />
                                        </button>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroup>
                    )}

                    <SidebarGroup>
                        <SidebarGroupLabel className="flex flex-row justify-between">
                            <span className="text-[#9b9a97] text-xs uppercase tracking-wider">所有文档</span>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={handleCreateFolder}
                                    title="新建文件夹"
                                    className="h-5 w-5 flex items-center justify-center rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                                >
                                    <FolderPlus className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    onClick={() => setTemplateOpen(true)}
                                    title="从模板创建"
                                    className="h-5 w-5 flex items-center justify-center rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                                >
                                    <LayoutTemplate className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    onClick={handleCreate}
                                    title="新建文档"
                                    className="h-5 w-5 flex items-center justify-center rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                                >
                                    <Plus />
                                </button>
                            </div>
                        </SidebarGroupLabel>
                        <SidebarDndContext>
                            <SidebarMenu>
                                {folderList.map((folder: Folder) => {
                                    const folderPages = normalPages.filter(p => p.folderId === folder.folderId)
                                    return (
                                        <DroppableFolderItem key={folder.folderId} folderId={folder.folderId}>
                                            <Collapsible>
                                                <SidebarMenuItem>
                                                    <CollapsibleTrigger asChild>
                                                        <SidebarMenuButton className="transition-colors duration-150 hover:bg-sidebar-accent">
                                                            <span className="text-base leading-none">📁</span>
                                                            <span className="text-[13px] text-ellipsis overflow-hidden whitespace-nowrap">
                                                                {folder.name}
                                                            </span>
                                                            <span className="ml-auto text-[10px] text-muted-foreground">
                                                                {folderPages.length}
                                                            </span>
                                                        </SidebarMenuButton>
                                                    </CollapsibleTrigger>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <SidebarMenuAction showOnHover>
                                                                <MoreHorizontal />
                                                            </SidebarMenuAction>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent className="w-48 rounded-lg" side="right" align="start">
                                                            <DropdownMenuItem
                                                                className="data-[highlighted]:bg-destructive data-[highlighted]:text-destructive-foreground"
                                                                onClick={async () => {
                                                                    await srv.deleteFolder(folder.folderId)
                                                                    queryClient.invalidateQueries({ queryKey: ['folders'] })
                                                                    queryClient.invalidateQueries({ queryKey: ['pages'] })
                                                                    toast({ title: '文件夹已删除' })
                                                                }}
                                                            >
                                                                <Trash2 />
                                                                <span>删除文件夹</span>
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                    <CollapsibleContent>
                                                        {folderPages.map(item => (
                                                            <SortablePageItem key={item.pageId} id={item.pageId}>
                                                                <SidebarMenuItem>
                                                                    <SidebarMenuButton
                                                                        asChild
                                                                        className={cn(
                                                                            'transition-colors duration-150 hover:bg-sidebar-accent pl-8',
                                                                            activeDocParams?.id === item.pageId &&
                                                                                'bg-sidebar-accent font-semibold text-sidebar-foreground'
                                                                        )}
                                                                    >
                                                                        <NavLink to={`/doc/${item.pageId}`} title={item.title}>
                                                                            <span className="text-base leading-none">{item.emoji}</span>
                                                                            <span className="text-[13px] text-ellipsis overflow-hidden whitespace-nowrap">
                                                                                {item.title}
                                                                            </span>
                                                                        </NavLink>
                                                                    </SidebarMenuButton>
                                                                    <DropdownMenu>
                                                                        <DropdownMenuTrigger asChild>
                                                                            <SidebarMenuAction showOnHover>
                                                                                <MoreHorizontal />
                                                                            </SidebarMenuAction>
                                                                        </DropdownMenuTrigger>
                                                                        <DropdownMenuContent
                                                                            className="w-56 rounded-lg"
                                                                            side={isMobile ? 'bottom' : 'right'}
                                                                            align={isMobile ? 'end' : 'start'}
                                                                        >
                                                                            <DropdownMenuItem
                                                                                onClick={() => handleToggleFavorite(item.pageId)}
                                                                            >
                                                                                {item.isFavorite ? (
                                                                                    <>
                                                                                        <StarOff className="text-muted-foreground" />
                                                                                        <span>取消收藏</span>
                                                                                    </>
                                                                                ) : (
                                                                                    <>
                                                                                        <Star className="text-muted-foreground" />
                                                                                        <span>收藏</span>
                                                                                    </>
                                                                                )}
                                                                            </DropdownMenuItem>
                                                                            {folderList.length > 0 && (
                                                                                <DropdownMenuSub>
                                                                                    <DropdownMenuSubTrigger>
                                                                                        <FolderInput className="text-muted-foreground" />
                                                                                        <span>移动到文件夹</span>
                                                                                    </DropdownMenuSubTrigger>
                                                                                    <DropdownMenuSubContent className="w-48">
                                                                                        <DropdownMenuItem
                                                                                            onClick={async () => {
                                                                                                await srv.updatePage({
                                                                                                    pageId: item.pageId,
                                                                                                    folderId: null,
                                                                                                })
                                                                                                queryClient.invalidateQueries({
                                                                                                    queryKey: ['pages'],
                                                                                                })
                                                                                            }}
                                                                                        >
                                                                                            <span>移出文件夹</span>
                                                                                        </DropdownMenuItem>
                                                                                        {folderList.map((f: Folder) => (
                                                                                            <DropdownMenuItem
                                                                                                key={f.folderId}
                                                                                                onClick={async () => {
                                                                                                    await srv.updatePage({
                                                                                                        pageId: item.pageId,
                                                                                                        folderId: f.folderId,
                                                                                                    })
                                                                                                    queryClient.invalidateQueries({
                                                                                                        queryKey: ['pages'],
                                                                                                    })
                                                                                                }}
                                                                                            >
                                                                                                <span>📁 {f.name}</span>
                                                                                                {item.folderId === f.folderId && (
                                                                                                    <span className="ml-auto">✓</span>
                                                                                                )}
                                                                                            </DropdownMenuItem>
                                                                                        ))}
                                                                                    </DropdownMenuSubContent>
                                                                                </DropdownMenuSub>
                                                                            )}
                                                                            <DropdownMenuSeparator />
                                                                            <DropdownMenuItem asChild>
                                                                                <NavLink to={`/doc/${item.pageId}`} target="_blank">
                                                                                    <ArrowUpRight className="text-muted-foreground" />
                                                                                    <span>新标签打开</span>
                                                                                </NavLink>
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuSeparator />
                                                                            <DropdownMenuItem
                                                                                className="data-[highlighted]:bg-destructive data-[highlighted]:text-destructive-foreground"
                                                                                onClick={() => handleDelete(item.pageId)}
                                                                            >
                                                                                <Trash2 />
                                                                                <span>删除</span>
                                                                            </DropdownMenuItem>
                                                                        </DropdownMenuContent>
                                                                    </DropdownMenu>
                                                                </SidebarMenuItem>
                                                            </SortablePageItem>
                                                        ))}
                                                    </CollapsibleContent>
                                                </SidebarMenuItem>
                                            </Collapsible>
                                        </DroppableFolderItem>
                                    )
                                })}
                                {rootPages?.map(item => (
                                    <SortablePageItem key={item.pageId} id={item.pageId}>
                                        <Collapsible>
                                            <SidebarMenuItem key={item.pageId}>
                                                <SidebarMenuButton
                                                    asChild
                                                    className={cn(
                                                        'transition-colors duration-150 hover:bg-sidebar-accent',
                                                        activeDocParams?.id === item.pageId &&
                                                            'bg-sidebar-accent font-semibold text-sidebar-foreground'
                                                    )}
                                                >
                                                    <NavLink key={`/doc/${item.pageId}`} to={`/doc/${item.pageId}`} title={item.title}>
                                                        <span className="text-base leading-none">{item.emoji}</span>
                                                        <span className="text-[13px] text-ellipsis overflow-hidden whitespace-nowrap">
                                                            {item.title}
                                                        </span>
                                                    </NavLink>
                                                </SidebarMenuButton>

                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <SidebarMenuAction showOnHover>
                                                            <MoreHorizontal />
                                                            <span className="sr-only">More</span>
                                                        </SidebarMenuAction>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent
                                                        className="w-56 rounded-lg"
                                                        side={isMobile ? 'bottom' : 'right'}
                                                        align={isMobile ? 'end' : 'start'}
                                                    >
                                                        <DropdownMenuItem onClick={() => handleToggleFavorite(item.pageId)}>
                                                            {item.isFavorite ? (
                                                                <>
                                                                    <StarOff className="text-muted-foreground" />
                                                                    <span>取消收藏</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Star className="text-muted-foreground" />
                                                                    <span>收藏</span>
                                                                </>
                                                            )}
                                                        </DropdownMenuItem>
                                                        {folderList.length > 0 && (
                                                            <DropdownMenuSub>
                                                                <DropdownMenuSubTrigger>
                                                                    <FolderInput className="text-muted-foreground" />
                                                                    <span>移动到文件夹</span>
                                                                </DropdownMenuSubTrigger>
                                                                <DropdownMenuSubContent className="w-48">
                                                                    {item.folderId && (
                                                                        <DropdownMenuItem
                                                                            onClick={async () => {
                                                                                await srv.updatePage({
                                                                                    pageId: item.pageId,
                                                                                    folderId: null,
                                                                                })
                                                                                queryClient.invalidateQueries({ queryKey: ['pages'] })
                                                                            }}
                                                                        >
                                                                            <span>移出文件夹</span>
                                                                        </DropdownMenuItem>
                                                                    )}
                                                                    {folderList.map((folder: Folder) => (
                                                                        <DropdownMenuItem
                                                                            key={folder.folderId}
                                                                            onClick={async () => {
                                                                                await srv.updatePage({
                                                                                    pageId: item.pageId,
                                                                                    folderId: folder.folderId,
                                                                                })
                                                                                queryClient.invalidateQueries({ queryKey: ['pages'] })
                                                                            }}
                                                                        >
                                                                            <span>📁 {folder.name}</span>
                                                                            {item.folderId === folder.folderId && (
                                                                                <span className="ml-auto">✓</span>
                                                                            )}
                                                                        </DropdownMenuItem>
                                                                    ))}
                                                                </DropdownMenuSubContent>
                                                            </DropdownMenuSub>
                                                        )}
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem asChild>
                                                            <NavLink to={`/doc/${item.pageId}`} target="_blank">
                                                                <ArrowUpRight className="text-muted-foreground" />
                                                                <span>新标签打开</span>
                                                            </NavLink>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="data-[highlighted]:bg-destructive data-[highlighted]:text-destructive-foreground"
                                                            onClick={() => handleDelete(item.pageId)}
                                                        >
                                                            <Trash2 />
                                                            <span>删除</span>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </SidebarMenuItem>
                                        </Collapsible>
                                    </SortablePageItem>
                                ))}
                            </SidebarMenu>
                        </SidebarDndContext>
                    </SidebarGroup>

                    {sharedPages && sharedPages.length > 0 && (
                        <SidebarGroup>
                            <SidebarGroupLabel className="text-[#9b9a97] text-xs uppercase tracking-wider">与我共享</SidebarGroupLabel>
                            <SidebarMenu>
                                {sharedPages.map(item => (
                                    <SidebarMenuItem key={item.pageId}>
                                        <SidebarMenuButton
                                            asChild
                                            className={cn(
                                                'transition-colors duration-150 hover:bg-sidebar-accent',
                                                activeDocParams?.id === item.pageId &&
                                                    'bg-sidebar-accent font-semibold text-sidebar-foreground'
                                            )}
                                        >
                                            <NavLink to={`/doc/${item.pageId}`} title={item.title}>
                                                <span className="text-base leading-none">{item.emoji}</span>
                                                <span className="text-[13px] text-ellipsis overflow-hidden whitespace-nowrap">
                                                    {item.title}
                                                </span>
                                                <Share2 className="ml-auto h-3 w-3 text-zinc-400" />
                                            </NavLink>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroup>
                    )}

                    <SidebarGroup>
                        <Collapsible open={showTrash} onOpenChange={setShowTrash}>
                            <SidebarGroupLabel className="flex flex-row justify-between cursor-pointer">
                                <CollapsibleTrigger asChild>
                                    <button className="flex items-center gap-1 text-[#9b9a97] text-xs uppercase tracking-wider hover:text-foreground transition-colors">
                                        <Trash2 className="h-3 w-3" />
                                        回收站
                                        {trashPages && trashPages.length > 0 && (
                                            <span className="ml-1 text-[10px] bg-muted rounded-full px-1.5">{trashPages.length}</span>
                                        )}
                                    </button>
                                </CollapsibleTrigger>
                                {trashPages && trashPages.length > 0 && (
                                    <div className="flex items-center gap-1">
                                        {trashSelectionMode ? (
                                            <>
                                                <button
                                                    onClick={toggleTrashSelectAll}
                                                    title="全选"
                                                    className="h-5 w-5 flex items-center justify-center rounded-md text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                                                >
                                                    {trashPages && trashSelectedIds.size === trashPages.length ? (
                                                        <CheckSquare className="h-3.5 w-3.5 text-primary" />
                                                    ) : (
                                                        <Square className="h-3.5 w-3.5" />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => setBatchPermanentDeleteDialogOpen(true)}
                                                    title="批量永久删除"
                                                    className="h-5 w-5 flex items-center justify-center rounded-md text-destructive hover:bg-sidebar-accent transition-colors"
                                                    disabled={trashSelectedIds.size === 0}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                                <button
                                                    onClick={handleBatchRestore}
                                                    title="批量恢复"
                                                    className="h-5 w-5 flex items-center justify-center rounded-md text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                                                    disabled={trashSelectedIds.size === 0}
                                                >
                                                    <RotateCcw className="h-3.5 w-3.5" />
                                                </button>
                                                <button
                                                    onClick={exitTrashSelectionMode}
                                                    title="取消"
                                                    className="h-5 w-5 flex items-center justify-center rounded-md text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => setTrashSelectionMode(true)}
                                                    title="批量管理"
                                                    className="h-5 w-5 flex items-center justify-center rounded-md text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                                                >
                                                    <CheckSquare className="h-3.5 w-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => setClearTrashDialogOpen(true)}
                                                    title="清空回收站"
                                                    className="h-5 w-5 flex items-center justify-center rounded-md text-destructive hover:bg-sidebar-accent transition-colors"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </SidebarGroupLabel>
                            <CollapsibleContent>
                                <SidebarMenu>
                                    {trashPages?.map((item: Page) => (
                                        <SidebarMenuItem key={item.pageId}>
                                            <SidebarMenuButton
                                                className="opacity-60"
                                                onClick={trashSelectionMode ? () => toggleTrashSelect(item.pageId) : undefined}
                                            >
                                                {trashSelectionMode && (
                                                    <span className="shrink-0">
                                                        {trashSelectedIds.has(item.pageId) ? (
                                                            <CheckSquare size={14} className="text-primary" />
                                                        ) : (
                                                            <Square size={14} className="text-muted-foreground" />
                                                        )}
                                                    </span>
                                                )}
                                                <span className="text-base leading-none">{item.emoji}</span>
                                                <span className="text-[13px] text-ellipsis overflow-hidden whitespace-nowrap">
                                                    {item.title}
                                                </span>
                                            </SidebarMenuButton>
                                            {!trashSelectionMode && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <SidebarMenuAction showOnHover>
                                                            <MoreHorizontal />
                                                        </SidebarMenuAction>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent className="w-48 rounded-lg" side="right" align="start">
                                                        <DropdownMenuItem onClick={() => handleRestore(item.pageId)}>
                                                            <RotateCcw className="text-muted-foreground" />
                                                            <span>恢复</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="data-[highlighted]:bg-destructive data-[highlighted]:text-destructive-foreground"
                                                            onClick={() => handlePermanentDelete(item.pageId)}
                                                        >
                                                            <Trash2 />
                                                            <span>永久删除</span>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </SidebarMenuItem>
                                    ))}
                                    {(!trashPages || trashPages.length === 0) && (
                                        <div className="px-4 py-2 text-xs text-muted-foreground">回收站为空</div>
                                    )}
                                </SidebarMenu>
                            </CollapsibleContent>
                        </Collapsible>
                    </SidebarGroup>
                </SidebarContent>
                <SidebarFooter className="border-t border-sidebar-border">
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <SidebarMenuButton className="h-auto py-2">
                                        {currentUser && (
                                            <>
                                                <div className="h-7 w-7 rounded-full bg-[#6B45FF] flex items-center justify-center text-white text-xs font-medium shrink-0">
                                                    {currentUser.username.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-medium truncate">{currentUser.username}</span>
                                                </div>
                                            </>
                                        )}
                                    </SidebarMenuButton>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-48 rounded-lg" side="right" align="start">
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
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarFooter>
            </Sidebar>
            <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
            <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} username={currentUser?.username} />
            <AboutDialog open={aboutOpen} onOpenChange={setAboutOpen} />
            <TemplateDialog open={templateOpen} onOpenChange={setTemplateOpen} onSelectTemplate={handleSelectTemplate} />
            <ConfirmDialog
                open={clearTrashDialogOpen}
                onOpenChange={setClearTrashDialogOpen}
                title="清空回收站"
                description="确定清空回收站？所有文档将被永久删除，此操作不可恢复。"
                confirmText="清空"
                onConfirm={handleClearTrash}
                variant="destructive"
            />
            <ConfirmDialog
                open={batchPermanentDeleteDialogOpen}
                onOpenChange={setBatchPermanentDeleteDialogOpen}
                title="批量永久删除"
                description={`确定永久删除选中的 ${trashSelectedIds.size} 个文档？此操作不可恢复。`}
                confirmText="删除"
                onConfirm={handleBatchPermanentDelete}
                variant="destructive"
            />
        </>
    )
}
