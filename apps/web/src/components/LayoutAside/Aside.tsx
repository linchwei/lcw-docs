import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@lcw-doc/shadcn-shared-ui/components/ui/collapsible'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
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
    Clock,
    FileStack,
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
    Sparkles,
    Star,
    Trash2,
    Waypoints,
} from 'lucide-react'
import { useState } from 'react'
import { NavLink, useMatch, useNavigate } from 'react-router-dom'

import * as srv from '@/services'
import { lcwConfetti } from '@/utils/lcw-confetti'
import { queryClient } from '@/utils/query-client'
import { randomEmoji } from '@/utils/randomEmoji'

import { AboutDialog } from './AboutDialog'
import { SearchDialog } from './SearchDialog'
import { SettingsDialog } from './SettingsDialog'
import { TemplateDialog } from '@/components/TemplateDialog'
import { Template } from '@/data/templates'

export function Aside() {
    const [searchOpen, setSearchOpen] = useState(false)
    const [settingsOpen, setSettingsOpen] = useState(false)
    const [aboutOpen, setAboutOpen] = useState(false)
    const [showTrash, setShowTrash] = useState(false)
    const [templateOpen, setTemplateOpen] = useState(false)
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

    const handleConfetti = () => {
        lcwConfetti.firework()
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
        <Sidebar variant="inset" collapsible="icon">
            <SidebarHeader>
                <div className="flex h-14 items-center px-4 lg:h-[60px] border-b border-sidebar-border">
                    <a href="/" className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-md bg-[#6B45FF] flex items-center justify-center relative overflow-hidden">
                            <div className="absolute w-3.5 h-4 rounded-[2px] bg-white/90 top-1.5 left-1.5" />
                            <div className="absolute w-3.5 h-4 rounded-[2px] bg-white/60 bottom-1 right-1" />
                            <div className="absolute w-1 h-1 rounded-full bg-white top-2 right-2" />
                        </div>
                        <p className="font-semibold text-base tracking-tight text-[#37352f]">协同文档</p>
                    </a>
                </div>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton className="bg-[#ebebea] hover:bg-[#e9e9e7] rounded-md transition-colors" onClick={() => setSearchOpen(true)}>
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
                        <SidebarGroupLabel className="text-[#9b9a97] text-xs uppercase tracking-wider">
                            最近编辑
                        </SidebarGroupLabel>
                        <SidebarMenu>
                            {recentPages.slice(0, 5).map(item => (
                                <SidebarMenuItem key={item.pageId}>
                                    <SidebarMenuButton
                                        asChild
                                        className={cn(
                                            'transition-colors duration-150 hover:bg-sidebar-accent',
                                            activeDocParams?.id === item.pageId && 'bg-sidebar-accent font-semibold text-sidebar-foreground'
                                        )}
                                    >
                                        <NavLink to={`/doc/${item.pageId}`} title={item.title}>
                                            <span className="text-base leading-none">{item.emoji}</span>
                                            <span className="text-[13px] text-ellipsis overflow-hidden whitespace-nowrap">{item.title}</span>
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
                        <SidebarGroupLabel className="text-[#9b9a97] text-xs uppercase tracking-wider">
                            收藏
                        </SidebarGroupLabel>
                        <SidebarMenu>
                            {favoritePages.map(item => (
                                <SidebarMenuItem key={item.pageId}>
                                    <SidebarMenuButton
                                        asChild
                                        className={cn(
                                            'transition-colors duration-150 hover:bg-sidebar-accent',
                                            activeDocParams?.id === item.pageId && 'bg-sidebar-accent font-semibold text-sidebar-foreground'
                                        )}
                                    >
                                        <NavLink to={`/doc/${item.pageId}`} title={item.title}>
                                            <span className="text-base leading-none">{item.emoji}</span>
                                            <span className="text-[13px] text-ellipsis overflow-hidden whitespace-nowrap">{item.title}</span>
                                            <Star className="ml-auto h-3 w-3 text-amber-400 fill-amber-400" />
                                        </NavLink>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroup>
                )}

                <SidebarGroup>
                    <SidebarGroupLabel className="flex flex-row justify-between">
                        <span className="text-[#9b9a97] text-xs uppercase tracking-wider">所有文档</span>
                        <div className="flex items-center gap-1">
                            <button onClick={handleCreateFolder} title="新建文件夹" className="h-5 w-5 flex items-center justify-center rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
                                <FolderPlus className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => setTemplateOpen(true)} title="从模板创建" className="h-5 w-5 flex items-center justify-center rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
                                <LayoutTemplate className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={handleCreate} title="新建文档" className="h-5 w-5 flex items-center justify-center rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
                                <Plus />
                            </button>
                        </div>
                    </SidebarGroupLabel>
                    <SidebarMenu>
                        {folderList.map(folder => {
                            const folderPages = normalPages.filter(p => p.folderId === folder.folderId)
                            return (
                                <Collapsible key={folder.folderId}>
                                    <SidebarMenuItem>
                                        <CollapsibleTrigger asChild>
                                            <SidebarMenuButton className="transition-colors duration-150 hover:bg-sidebar-accent">
                                                <span className="text-base leading-none">📁</span>
                                                <span className="text-[13px] text-ellipsis overflow-hidden whitespace-nowrap">{folder.name}</span>
                                                <span className="ml-auto text-[10px] text-muted-foreground">{folderPages.length}</span>
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
                                                <SidebarMenuButton
                                                    key={item.pageId}
                                                    asChild
                                                    className={cn(
                                                        'transition-colors duration-150 hover:bg-sidebar-accent pl-8',
                                                        activeDocParams?.id === item.pageId && 'bg-sidebar-accent font-semibold text-sidebar-foreground'
                                                    )}
                                                >
                                                    <NavLink to={`/doc/${item.pageId}`} title={item.title}>
                                                        <span className="text-base leading-none">{item.emoji}</span>
                                                        <span className="text-[13px] text-ellipsis overflow-hidden whitespace-nowrap">{item.title}</span>
                                                    </NavLink>
                                                </SidebarMenuButton>
                                            ))}
                                        </CollapsibleContent>
                                    </SidebarMenuItem>
                                </Collapsible>
                            )
                        })}
                        {rootPages?.map(item => (
                            <Collapsible key={item.pageId}>
                                <SidebarMenuItem key={item.pageId}>
                                    <SidebarMenuButton
                                        asChild
                                        className={cn(
                                            'transition-colors duration-150 hover:bg-sidebar-accent',
                                            activeDocParams?.id === item.pageId && 'bg-sidebar-accent font-semibold text-sidebar-foreground'
                                        )}
                                    >
                                        <NavLink key={`/doc/${item.pageId}`} to={`/doc/${item.pageId}`} title={item.title}>
                                            <span className="text-base leading-none">{item.emoji}</span>
                                            <span className="text-[13px] text-ellipsis overflow-hidden whitespace-nowrap">{item.title}</span>
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
                                                <Star className="text-muted-foreground" />
                                                <span>收藏</span>
                                            </DropdownMenuItem>
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
                        ))}
                    </SidebarMenu>
                </SidebarGroup>

                {sharedPages && sharedPages.length > 0 && (
                    <SidebarGroup>
                        <SidebarGroupLabel className="text-[#9b9a97] text-xs uppercase tracking-wider">
                            与我共享
                        </SidebarGroupLabel>
                        <SidebarMenu>
                            {sharedPages.map(item => (
                                <SidebarMenuItem key={item.pageId}>
                                    <SidebarMenuButton
                                        asChild
                                        className={cn(
                                            'transition-colors duration-150 hover:bg-sidebar-accent',
                                            activeDocParams?.id === item.pageId && 'bg-sidebar-accent font-semibold text-sidebar-foreground'
                                        )}
                                    >
                                        <NavLink to={`/doc/${item.pageId}`} title={item.title}>
                                            <span className="text-base leading-none">{item.emoji}</span>
                                            <span className="text-[13px] text-ellipsis overflow-hidden whitespace-nowrap">{item.title}</span>
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
                        </SidebarGroupLabel>
                        <CollapsibleContent>
                            <SidebarMenu>
                                {trashPages?.map(item => (
                                    <SidebarMenuItem key={item.pageId}>
                                        <SidebarMenuButton className="opacity-60">
                                            <span className="text-base leading-none">{item.emoji}</span>
                                            <span className="text-[13px] text-ellipsis overflow-hidden whitespace-nowrap">{item.title}</span>
                                        </SidebarMenuButton>
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
                <SidebarMenu className="gap-0.5">
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            className="h-auto py-2"
                            onClick={handleConfetti}
                        >
                            {currentUser && (
                                <>
                                    <div className="h-7 w-7 rounded-full bg-[#6B45FF] flex items-center justify-center text-white text-xs font-medium shrink-0">
                                        {currentUser.username.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-sm font-medium truncate">{currentUser.username}</span>
                                        <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                                            <Sparkles className="h-2.5 w-2.5" />
                                            庆祝一下
                                        </span>
                                    </div>
                                </>
                            )}
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => setSettingsOpen(true)}>
                            <Settings />
                            设置
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => setAboutOpen(true)}>
                            <MessageCircleQuestion />
                            关于
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={handleLogout}>
                            <LogOut />
                            退出登录
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
        <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
        <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} username={currentUser?.username} />
        <AboutDialog open={aboutOpen} onOpenChange={setAboutOpen} />
        <TemplateDialog open={templateOpen} onOpenChange={setTemplateOpen} onSelectTemplate={handleSelectTemplate} />
    </>
    )
}
