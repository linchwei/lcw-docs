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
import { Button } from '@lcw-doc/shadcn-shared-ui/components/ui/button'
import { SidebarInset, SidebarTrigger } from '@lcw-doc/shadcn-shared-ui/components/ui/sidebar'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNowStrict } from 'date-fns'
import {
    ArrowUpRight,
    Eye,
    FileUp,
    Image,
    LayoutTemplate,
    MessageSquare,
    MoreVertical,
    Plus,
    Shield,
    Star,
    Tag,
    Trash2,
    X,
} from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState'
import { MarkdownUploadDialog } from '@/components/MarkdownUploadDialog'
import { TemplateDialog } from '@/components/TemplateDialog'
import * as srv from '@/services'
import { Template } from '@/data/templates'
import { Tag as TagType } from '@/types/api'
import { randomEmoji } from '@/utils/randomEmoji'

import styles from './DocList.module.css'

const COVER_IMAGES = [
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&h=300&fit=crop',
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=300&fit=crop',
    'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&h=300&fit=crop',
    'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=800&h=300&fit=crop',
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&h=300&fit=crop',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&h=300&fit=crop',
]

const TAG_COLORS = ['#6B45FF', '#E11D48', '#0891B2', '#059669', '#D97706', '#7C3AED', '#DB2777', '#2563EB']

export function DocList() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const contentRef = useRef<HTMLDivElement>(null)
    const [mdDialogOpen, setMdDialogOpen] = useState(false)
    const [templateOpen, setTemplateOpen] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const dragCounterRef = useRef(0)
    const [coverPickerPageId, setCoverPickerPageId] = useState<string | null>(null)
    const [tagPickerPageId, setTagPickerPageId] = useState<string | null>(null)
    const [deleteTagDialogOpen, setDeleteTagDialogOpen] = useState(false)
    const [pendingDeleteTag, setPendingDeleteTag] = useState<{ tagId: string; tagName: string } | null>(null)
    const [newTagName, setNewTagName] = useState('')
    const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0])

    const { data: pages, refetch } = useQuery({
        queryKey: ['pages'],
        queryFn: async () => {
            return (await srv.fetchPageList()).data.pages
        },
    })

    const { data: sharedPages } = useQuery({
        queryKey: ['sharedPages'],
        queryFn: async () => {
            const res = await srv.fetchSharedPages()
            return res.data || []
        },
    })

    const { data: allTags = [] } = useQuery<TagType[]>({
        queryKey: ['tags'],
        queryFn: async () => {
            const res = await srv.fetchTags()
            return res.data || []
        },
    })

    const pageIds = pages?.map(p => p.pageId) || []
    const sharedPageIds = sharedPages?.map(p => p.pageId) || []
    const allPageIds = [...pageIds, ...sharedPageIds]

    const { data: batchPageTags = {} } = useQuery<Record<string, TagType[]>>({
        queryKey: ['batchPageTags', allPageIds.sort().join(',')],
        queryFn: async () => {
            if (allPageIds.length === 0) return {}
            const res = await srv.batchFetchPageTags(allPageIds)
            return res.data || {}
        },
        enabled: allPageIds.length > 0,
    })

    const handleCreate = async () => {
        const res = await srv.createPage({ emoji: randomEmoji(), title: '未命名文档' })
        navigate(`/doc/${res.data.pageId}`)
        refetch()
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
    }

    const handleToggleFavorite = async (pageId: string) => {
        await srv.toggleFavorite(pageId)
        queryClient.invalidateQueries({ queryKey: ['pages'] })
    }

    const handleAddCover = async (pageId: string, coverUrl: string) => {
        await srv.updatePage({ pageId, coverImage: coverUrl })
        queryClient.invalidateQueries({ queryKey: ['pages'] })
        setCoverPickerPageId(null)
    }

    const handleRemoveCover = async (pageId: string) => {
        await srv.updatePage({ pageId, coverImage: null })
        queryClient.invalidateQueries({ queryKey: ['pages'] })
    }

    const handleAddTag = async (pageId: string, tagId: string) => {
        await srv.addPageTag({ pageId, tagId })
        queryClient.invalidateQueries({ queryKey: ['batchPageTags'] })
        setTagPickerPageId(null)
    }

    const handleRemoveTag = async (pageId: string, tagId: string) => {
        await srv.removePageTag(pageId, tagId)
        queryClient.invalidateQueries({ queryKey: ['batchPageTags'] })
    }

    const handleCreateTag = async (pageId: string) => {
        if (!newTagName.trim()) return
        const res = await srv.createTag({ name: newTagName.trim(), color: newTagColor })
        const created = res.data
        if (created?.tagId) {
            await srv.addPageTag({ pageId, tagId: created.tagId })
            queryClient.invalidateQueries({ queryKey: ['tags'] })
            queryClient.invalidateQueries({ queryKey: ['batchPageTags'] })
        }
        setNewTagName('')
        setTagPickerPageId(null)
    }

    const handleDeleteTag = (tagId: string, tagName: string) => {
        setPendingDeleteTag({ tagId, tagName })
        setDeleteTagDialogOpen(true)
    }

    const confirmDeleteTag = async () => {
        if (!pendingDeleteTag) return
        await srv.deleteTag(pendingDeleteTag.tagId)
        queryClient.invalidateQueries({ queryKey: ['tags'] })
        queryClient.invalidateQueries({ queryKey: ['batchPageTags'] })
        setPendingDeleteTag(null)
    }

    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        dragCounterRef.current++
        const items = e.dataTransfer.items
        let hasMd = false
        for (let i = 0; i < items.length; i++) {
            if (items[i].type === '' || items[i].type.includes('text') || items[i].kind === 'file') {
                hasMd = true
                break
            }
        }
        if (hasMd) setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        dragCounterRef.current--
        if (dragCounterRef.current === 0) setIsDragging(false)
    }, [])

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        dragCounterRef.current = 0
        setIsDragging(false)

        const file = e.dataTransfer.files?.[0]
        if (file && file.name.endsWith('.md')) {
            setMdDialogOpen(true)
        }
    }, [])

    const renderCardMenu = (pageId: string, isOwner: boolean) => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={ev => {
                        ev.stopPropagation()
                        ev.preventDefault()
                    }}
                >
                    <MoreVertical size={16} />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-52 rounded-lg" align="end" onClick={e => e.stopPropagation()}>
                {isOwner && (
                    <>
                        <DropdownMenuItem onClick={() => handleToggleFavorite(pageId)}>
                            <Star className="text-muted-foreground" />
                            <span>收藏</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                    </>
                )}
                <DropdownMenuItem asChild>
                    <Link to={`/doc/${pageId}`} target="_blank" onClick={e => e.stopPropagation()}>
                        <ArrowUpRight className="text-muted-foreground" />
                        <span>新标签打开</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                        <Image className="text-muted-foreground" />
                        <span>封面</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-64 p-2">
                        <div className="grid grid-cols-3 gap-1.5 mb-2">
                            {COVER_IMAGES.map((url, i) => (
                                <button
                                    key={i}
                                    className="h-12 rounded overflow-hidden hover:ring-2 ring-primary transition-all"
                                    onClick={e => {
                                        e.stopPropagation()
                                        handleAddCover(pageId, url)
                                    }}
                                >
                                    <img src={url} alt="" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={e => {
                                e.stopPropagation()
                                handleRemoveCover(pageId)
                            }}
                        >
                            <X className="text-destructive" />
                            <span>移除封面</span>
                        </DropdownMenuItem>
                    </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                        <Tag className="text-muted-foreground" />
                        <span>标签</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-56 p-2">
                        {allTags.length > 0 && (
                            <div className="max-h-32 overflow-y-auto mb-1">
                                {allTags.map(tag => (
                                    <div key={tag.tagId} className="w-full flex items-center gap-1 px-2 py-1.5 text-xs hover:bg-accent rounded group">
                                        <button
                                            className="flex-1 text-left flex items-center gap-2"
                                            onClick={e => {
                                                e.stopPropagation()
                                                handleAddTag(pageId, tag.tagId)
                                            }}
                                        >
                                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
                                            {tag.name}
                                        </button>
                                        <button
                                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                                            onClick={e => {
                                                e.stopPropagation()
                                                e.preventDefault()
                                                handleDeleteTag(tag.tagId, tag.name)
                                            }}
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <DropdownMenuSeparator />
                        <div className="space-y-2">
                            <input
                                className="w-full px-2 py-1 text-xs border rounded"
                                placeholder="新标签名称"
                                value={newTagName}
                                onChange={e => setNewTagName(e.target.value)}
                                onClick={e => e.stopPropagation()}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                        e.stopPropagation()
                                        handleCreateTag(pageId)
                                    }
                                }}
                            />
                            <div className="flex gap-1.5 flex-wrap">
                                {TAG_COLORS.map(c => (
                                    <button
                                        key={c}
                                        className="w-5 h-5 rounded-full transition-all"
                                        style={{
                                            backgroundColor: c,
                                            boxShadow: newTagColor === c ? `0 0 0 2px var(--background), 0 0 0 4px ${c}` : 'none',
                                            transform: newTagColor === c ? 'scale(1.15)' : 'scale(1)',
                                        }}
                                        onClick={e => {
                                            e.stopPropagation()
                                            setNewTagColor(c)
                                        }}
                                    />
                                ))}
                            </div>
                            <Button
                                size="sm"
                                className="w-full h-6 text-xs"
                                onClick={e => {
                                    e.stopPropagation()
                                    handleCreateTag(pageId)
                                }}
                                disabled={!newTagName.trim()}
                            >
                                创建并添加
                            </Button>
                        </div>
                    </DropdownMenuSubContent>
                </DropdownMenuSub>
                {isOwner && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="data-[highlighted]:bg-destructive data-[highlighted]:text-destructive-foreground"
                            onClick={() => handleDelete(pageId)}
                        >
                            <Trash2 />
                            <span>删除</span>
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )

    return (
        <SidebarInset>
            <div className={styles.page}>
                <div className={styles.toolbar}>
                    <div className={styles.toolbarLeft}>
                        <SidebarTrigger />
                        <h1 className={styles.title} style={{ fontFamily: '"Noto Serif SC", Georgia, serif' }}>
                            全部文档
                        </h1>
                    </div>
                    <div className={styles.toolbarRight}>
                        <Button size="sm" variant="outline" onClick={() => setMdDialogOpen(true)}>
                            <FileUp size={16} />
                            上传 Markdown
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setTemplateOpen(true)}>
                            <LayoutTemplate size={16} />
                            从模板创建
                        </Button>
                        <Button size="sm" onClick={handleCreate} style={{ background: '#097fe8' }}>
                            <Plus size={16} />
                            新建文档
                        </Button>
                    </div>
                </div>
                <div
                    className={styles.content}
                    ref={contentRef}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                >
                    {isDragging && (
                        <div className={styles.dragOverlay}>
                            <FileUp size={48} className={styles.dragOverlayIcon} />
                            <p className={styles.dragOverlayText}>释放以导入 Markdown 文件</p>
                        </div>
                    )}
                    {pages && pages.length > 0 ? (
                        <div className={styles.grid}>
                            {pages.map((page, index) => (
                                <PageCard
                                    key={page.pageId}
                                    page={page}
                                    index={index}
                                    allTags={allTags}
                                    onRemoveTag={handleRemoveTag}
                                    menu={renderCardMenu(page.pageId, true)}
                                    pageTags={batchPageTags[page.pageId] || []}
                                />
                            ))}
                        </div>
                    ) : (
                        <EmptyState onCreate={handleCreate} />
                    )}
                    {sharedPages && sharedPages.length > 0 && (
                        <div className="mt-8">
                            <h2
                                className="text-lg font-semibold text-zinc-700 mb-4"
                                style={{ fontFamily: '"Noto Serif SC", Georgia, serif' }}
                            >
                                与我共享
                            </h2>
                            <div className={styles.grid}>
                                {sharedPages.map((page, index) => (
                                    <SharedPageCard
                                        key={page.pageId}
                                        page={page}
                                        index={index}
                                        allTags={allTags}
                                        onRemoveTag={handleRemoveTag}
                                        menu={renderCardMenu(page.pageId, page.role === 'owner' || page.role === 'editor')}
                                        pageTags={batchPageTags[page.pageId] || []}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <MarkdownUploadDialog open={mdDialogOpen} onOpenChange={setMdDialogOpen} />
            <TemplateDialog open={templateOpen} onOpenChange={setTemplateOpen} onSelectTemplate={handleSelectTemplate} />
            <ConfirmDialog
                open={deleteTagDialogOpen}
                onOpenChange={setDeleteTagDialogOpen}
                title="删除标签"
                description={`确定删除标签「${pendingDeleteTag?.tagName || ''}」？删除后将从所有页面移除该标签`}
                confirmText="删除"
                onConfirm={confirmDeleteTag}
                variant="destructive"
            />
        </SidebarInset>
    )
}

function PageCard({
    page,
    index,
    allTags,
    onRemoveTag,
    menu,
    pageTags,
}: {
    page: any
    index: number
    allTags: TagType[]
    onRemoveTag: (pageId: string, tagId: string) => void
    menu: React.ReactNode
    pageTags: TagType[]
}) {
    return (
        <Link to={`/doc/${page.pageId}`} className={styles.card} style={{ animationDelay: `${index * 60}ms` }}>
            {page.coverImage ? (
                <div className={styles.cardCover}>
                    <img src={page.coverImage} alt="" />
                </div>
            ) : (
                <div className={styles.cardEmoji}>{page.emoji}</div>
            )}
            <div className={styles.cardBody}>
                <p className={styles.cardTitle}>{page.title}</p>
                <div className={styles.cardMeta}>
                    <span className={styles.cardTime}>{formatDistanceToNowStrict(page.createdAt)}前</span>
                    {pageTags.length > 0 && (
                        <div className={styles.cardTags}>
                            {pageTags.slice(0, 2).map(tag => (
                                <span
                                    key={tag.tagId}
                                    className={styles.cardTag}
                                    style={{ backgroundColor: tag.color + '18', color: tag.color }}
                                >
                                    {tag.name}
                                </span>
                            ))}
                            {pageTags.length > 2 && <span className={styles.cardTagMore}>+{pageTags.length - 2}</span>}
                        </div>
                    )}
                </div>
            </div>
            <div className={styles.cardActions}>{menu}</div>
        </Link>
    )
}

function SharedPageCard({
    page,
    index,
    allTags,
    onRemoveTag,
    menu,
    pageTags,
}: {
    page: any
    index: number
    allTags: TagType[]
    onRemoveTag: (pageId: string, tagId: string) => void
    menu: React.ReactNode
    pageTags: TagType[]
}) {
    return (
        <Link to={`/doc/${page.pageId}`} className={styles.card} style={{ animationDelay: `${index * 60}ms` }}>
            {page.coverImage ? (
                <div className={styles.cardCover}>
                    <img src={page.coverImage} alt="" />
                </div>
            ) : (
                <div className={styles.cardEmoji}>{page.emoji}</div>
            )}
            <div className={styles.cardBody}>
                <p className={styles.cardTitle}>{page.title}</p>
                <div className="flex items-center gap-2 mt-1">
                    {page.role === 'viewer' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-zinc-400">
                            <Eye size={10} />
                            只读
                        </span>
                    ) : page.role === 'commenter' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-500">
                            <MessageSquare size={10} />
                            可评论
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-blue-500">
                            <Shield size={10} />
                            可编辑
                        </span>
                    )}
                    <span className="text-[10px] text-zinc-400">来自 {page.ownerName}</span>
                </div>
                {pageTags.length > 0 && (
                    <div className={styles.cardTags}>
                        {pageTags.slice(0, 2).map(tag => (
                            <span
                                key={tag.tagId}
                                className={styles.cardTag}
                                style={{ backgroundColor: tag.color + '18', color: tag.color }}
                            >
                                {tag.name}
                            </span>
                        ))}
                        {pageTags.length > 2 && <span className={styles.cardTagMore}>+{pageTags.length - 2}</span>}
                    </div>
                )}
            </div>
            <div className={styles.cardActions}>{menu}</div>
        </Link>
    )
}
