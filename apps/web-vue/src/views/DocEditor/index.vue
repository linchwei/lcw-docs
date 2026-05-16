<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import {
    NButton,
    NDrawer,
    NDrawerContent,
    NSpin,
    NTag,
    NPopover,
    NBadge,
    NDropdown,
    NEmpty,
    NInput,
    NSpace,
    NAvatar,
    useMessage,
    useDialog,
    type DropdownOption,
} from 'naive-ui'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { WebsocketProvider } from 'y-websocket'
import { IndexeddbPersistence } from 'y-indexeddb'
import * as Y from 'yjs'
import { RouterLink, useRouter, useRoute } from 'vue-router'
import {
    Check,
    ChevronLeft,
    Cloud,
    CloudOff,
    Copy,
    Download,
    Eye,
    History,
    Home,
    Link2,
    Loader2,
    MessageSquare,
    MoreHorizontal,
    Plus,
    RotateCcw,
    Share2,
    Trash2,
    Users,
    WifiOff,
} from 'lucide-vue-next'
import { LcwDocEditor } from '@lcw-doc/core'

import * as srv from '@/services'
import { queryClient } from '@/utils/query-client'
import { debounce } from '@/utils/debounce'

import DocEditorInner from './DocEditorInner.vue'

const router = useRouter()
const route = useRoute()
const message = useMessage()
const dialog = useDialog()

const pageId = route.params.id as string

// Page data
const { data: page, isLoading } = useQuery({
    queryKey: ['page', pageId],
    queryFn: async () => {
        if (!pageId) return null
        const res = await srv.fetchPageDetail(pageId)
        return res.data
    },
    enabled: !!pageId,
})

// Comments
const { data: commentsData } = useQuery({
    queryKey: ['comments', pageId],
    queryFn: async () => {
        if (!pageId) return []
        const res = await srv.fetchComments(pageId)
        return res.data || []
    },
    enabled: !!pageId,
})
const commentCount = ref(0)
const commentInput = ref('')
const replyTo = ref<string | null>(null)
const replyInput = ref('')
const submittingComment = ref(false)

function handleAddComment() {
    const text = commentInput.value.trim()
    if (!text || !pageId) return
    submittingComment.value = true
    srv.createComment({ pageId, content: text })
        .then(() => {
            commentInput.value = ''
            queryClient.invalidateQueries({ queryKey: ['comments', pageId] })
            message.success('评论成功')
        })
        .catch(() => message.error('评论失败'))
        .finally(() => { submittingComment.value = false })
}

function handleReply(parentId: string) {
    const text = replyInput.value.trim()
    if (!text) return
    submittingComment.value = true
    srv.replyComment({ parentId, content: text })
        .then(() => {
            replyInput.value = ''
            replyTo.value = null
            queryClient.invalidateQueries({ queryKey: ['comments', pageId] })
            message.success('回复成功')
        })
        .catch(() => message.error('回复失败'))
        .finally(() => { submittingComment.value = false })
}

function handleResolve(commentId: string) {
    srv.resolveComment(commentId)
        .then(() => {
            queryClient.invalidateQueries({ queryKey: ['comments', pageId] })
        })
        .catch(() => message.error('操作失败'))
}

function confirmDeleteComment(commentId: string) {
    dialog.warning({
        title: '删除评论',
        content: '确定要删除此评论吗？',
        positiveText: '删除',
        negativeText: '取消',
        onPositiveClick: async () => {
            try {
                await srv.deleteComment(commentId)
                queryClient.invalidateQueries({ queryKey: ['comments', pageId] })
                message.success('删除成功')
            } catch {
                message.error('删除失败')
            }
        },
    })
}

// Panels state
const commentPanelOpen = ref(false)
const versionPanelOpen = ref(false)
const collaboratorPanelOpen = ref(false)
const backlinksPanelOpen = ref(false)
const exportDropdownShow = ref(false)

// Version history
const { data: versions, isLoading: versionsLoading } = useQuery({
    queryKey: ['versions', pageId],
    queryFn: async () => {
        if (!pageId) return []
        const res = await srv.fetchVersions(pageId)
        return res.data?.list || res.data || []
    },
    enabled: !!pageId,
})
const creatingVersion = ref(false)

async function handleCreateVersion() {
    if (!pageId) return
    creatingVersion.value = true
    try {
        await srv.createVersion({ pageId })
        message.success('版本已创建')
        queryClient.invalidateQueries({ queryKey: ['versions', pageId] })
    } catch {
        message.error('版本创建失败')
    } finally {
        creatingVersion.value = false
    }
}

async function handleRollback(versionId: string) {
    if (!pageId) return
    dialog.warning({
        title: '回滚版本',
        content: '回滚将恢复文档到该版本，确认继续？',
        positiveText: '确认回滚',
        negativeText: '取消',
        onPositiveClick: async () => {
            try {
                await srv.rollbackVersion(pageId, versionId)
                message.success('版本已回滚')
                queryClient.invalidateQueries({ queryKey: ['page', pageId] })
                queryClient.invalidateQueries({ queryKey: ['versions', pageId] })
            } catch {
                message.error('回滚失败')
            }
        },
    })
}

async function handleDeleteVersion(versionId: string) {
    dialog.warning({
        title: '删除版本',
        content: '确定要删除此版本吗？',
        positiveText: '删除',
        negativeText: '取消',
        onPositiveClick: async () => {
            try {
                await srv.deleteVersion(versionId)
                queryClient.invalidateQueries({ queryKey: ['versions', pageId] })
                message.success('版本已删除')
            } catch {
                message.error('删除失败')
            }
        },
    })
}

// Collaborators
const { data: collaborators, isLoading: collabLoading } = useQuery({
    queryKey: ['collaborators', pageId],
    queryFn: async () => {
        if (!pageId) return []
        const res = await srv.fetchCollaborators(pageId)
        return res.data || []
    },
    enabled: !!pageId,
})
const addCollabVisible = ref(false)
const collabUsername = ref('')
const collabPermission = ref<'viewer' | 'commenter' | 'editor'>('editor')
const addingCollab = ref(false)

async function handleAddCollaborator() {
    if (!pageId || !collabUsername.value.trim()) return
    addingCollab.value = true
    try {
        await srv.addCollaborator(pageId, {
            username: collabUsername.value.trim(),
            role: collabPermission.value,
        })
        message.success('已添加协作者')
        collabUsername.value = ''
        addCollabVisible.value = false
        queryClient.invalidateQueries({ queryKey: ['collaborators', pageId] })
    } catch (e: any) {
        message.error(e?.response?.data?.message || '添加失败')
    } finally {
        addingCollab.value = false
    }
}

function handleRemoveCollaborator(collabId: string) {
    dialog.warning({
        title: '移除协作者',
        content: '确定移除此协作者？',
        positiveText: '移除',
        negativeText: '取消',
        onPositiveClick: async () => {
            try {
                await srv.removeCollaborator(collabId)
                queryClient.invalidateQueries({ queryKey: ['collaborators', pageId] })
                message.success('已移除')
            } catch {
                message.error('移除失败')
            }
        },
    })
}

// Backlinks
const { data: backlinks, isLoading: backlinksLoading } = useQuery({
    queryKey: ['backlinks', pageId],
    queryFn: async () => {
        if (!pageId) return []
        const res = await srv.fetchBacklinks(pageId)
        return res.data || []
    },
    enabled: !!pageId,
})

// Share dialog
const shareDialogOpen = ref(false)
const shareUrl = ref('')
const sharePermission = ref<'view' | 'comment' | 'edit'>('view')
const sharePassword = ref('')
const shareExpireDays = ref(7)
const creatingShare = ref(false)

async function handleCreateShare() {
    if (!pageId) return
    creatingShare.value = true
    try {
        const res = await srv.createShare({
            pageId,
            permission: sharePermission.value,
            password: sharePassword.value || undefined,
            expiresAt: shareExpireDays.value
                ? new Date(Date.now() + shareExpireDays.value * 86400000).toISOString()
                : undefined,
        })
        shareUrl.value = `${window.location.origin}/share/${res.data.shareId || res.data.id}`
        message.success('分享链接已创建')
    } catch {
        message.error('创建分享失败')
    } finally {
        creatingShare.value = false
    }
}

function handleCopyShareLink() {
    if (!shareUrl.value) return
    navigator.clipboard.writeText(shareUrl.value)
    message.success('链接已复制')
}

function handleRemoveShare(shareId: string) {
    dialog.warning({
        title: '删除分享',
        content: '确定删除此分享链接？',
        positiveText: '删除',
        negativeText: '取消',
        onPositiveClick: async () => {
            try {
                await srv.deleteShare(shareId)
                message.success('分享已删除')
            } catch {
                message.error('删除失败')
            }
        },
    })
}

// Editor state
const editorInstance = shallowRef<LcwDocEditor<any, any, any> | null>(null)
const saveStatus = ref<'saving' | 'saved' | 'idle'>('idle')
const pageRef = ref<any>(null)

// YJS
const doc = new Y.Doc()
const wsUrl = (window as any).__WS_URL__ || 'ws://localhost:8082'
const lsToken = localStorage.getItem('token')
const wsParams = lsToken ? { connect: false, params: { token: lsToken } } : { connect: false }
const provider = new WebsocketProvider(wsUrl, `doc-yjs-${pageId}`, doc, wsParams)
const indexeddbProvider = new IndexeddbPersistence(`doc-yjs-${pageId}`, doc)
const syncStatus = ref<'connecting' | 'connected' | 'disconnected'>('connecting')
const remoteUsers = ref<Map<number, { name: string; color: string }>>(new Map())

// Title
const titleRef = ref<HTMLDivElement>()

const handleTitleInput = debounce((e: Event) => {
    const currentPage = pageRef.value
    if (!currentPage) return
    const title = (e.target as HTMLDivElement).innerText
    saveStatus.value = 'saving'
    srv.updatePage({ pageId: currentPage.pageId, title })
        .then(() => {
            saveStatus.value = 'saved'
            setTimeout(() => { saveStatus.value = 'idle' }, 2000)
            queryClient.invalidateQueries({ queryKey: ['page', pageId] })
        })
        .catch(() => {
            saveStatus.value = 'idle'
        })
    queryClient.invalidateQueries({ queryKey: ['pages'] })
})

function handleEditorReady(editor: LcwDocEditor<any, any, any>) {
    editorInstance.value = editor

    // Check for pending markdown import
    const pendingMarkdown = sessionStorage.getItem('md-pending-markdown')
    if (pendingMarkdown) {
        sessionStorage.removeItem('md-pending-markdown')
        editor.tryParseMarkdownToBlocks(pendingMarkdown)
            .then((blocks: any) => {
                if (Array.isArray(blocks) && blocks.length > 0) {
                    editor.replaceBlocks(editor.document, blocks)
                }
            })
            .catch(console.error)
    }

    const pendingTemplate = sessionStorage.getItem('template-pending-markdown')
    if (pendingTemplate) {
        sessionStorage.removeItem('template-pending-markdown')
        editor.tryParseMarkdownToBlocks(pendingTemplate)
            .then((blocks: any) => {
                if (Array.isArray(blocks) && blocks.length > 0) {
                    editor.replaceBlocks(editor.document, blocks)
                }
            })
            .catch(console.error)
    }
}

// YJS awareness - remote users
onMounted(() => {
    const changeHandler = () => {
        const states = provider.awareness.getStates()
        const users = new Map<number, { name: string; color: string }>()
        for (const [key, value] of states) {
            if (key === provider.awareness.clientID) continue
            users.set(key, value.user)
        }
        remoteUsers.value = users
    }
    provider.awareness.on('change', changeHandler)

    const statusHandler = ({ status }: { status: 'connecting' | 'connected' | 'disconnected' }) => {
        syncStatus.value = status
    }
    provider.on('status', statusHandler)

    // Connect after local sync
    indexeddbProvider.whenSynced.then(() => {
        provider.connect()
    })

    // Update comment count when data changes
    if (commentsData.value) {
        commentCount.value = (commentsData.value as any[]).filter((c: any) => !c.resolvedAt).length
    }
})

onBeforeUnmount(() => {
    provider.disconnect()
    doc.destroy()
})

// Title sync from data
watch(page, (p) => {
    pageRef.value = p
    if (titleRef.value && p?.title !== undefined) {
        if (document.activeElement !== titleRef.value) {
            titleRef.value.innerText = p.title
        }
    }
}, { immediate: true })

// Cover image
const covers = [
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&h=400&fit=crop',
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&h=400&fit=crop',
    'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=1200&h=400&fit=crop',
    'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=1200&h=400&fit=crop',
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200&h=400&fit=crop',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&h=400&fit=crop',
]

async function addCover() {
    const cover = covers[Math.floor(Math.random() * covers.length)]
    await srv.updatePage({ pageId: page!.value!.pageId, coverImage: cover })
    queryClient.invalidateQueries({ queryKey: ['page', pageId] })
}

async function removeCover() {
    await srv.updatePage({ pageId: page!.value!.pageId, coverImage: null })
    queryClient.invalidateQueries({ queryKey: ['page', pageId] })
}

function formatRelativeTime(dateStr: string) {
    if (!dateStr) return ''
    const now = Date.now()
    const date = new Date(dateStr).getTime()
    const diff = now - date
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return '刚刚'
    if (mins < 60) return `${mins}分钟前`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}小时前`
    const days = Math.floor(hours / 24)
    if (days < 30) return `${days}天前`
    return new Date(dateStr).toLocaleDateString('zh-CN')
}

function goBack() {
    router.push('/doc')
}

// Export dropdown options
const exportOptions: DropdownOption[] = [
    { label: '导出为 Markdown', key: 'markdown' },
    { label: '导出为 HTML', key: 'html' },
    { label: '导出为 Word', key: 'docx' },
]

function handleExport(key: string) {
    const editor = editorInstance.value
    if (!editor) return

    const title = page?.value?.title || 'document'

    if (key === 'markdown') {
        import('@/utils/exportDocument').then(({ exportAsMarkdown }) => {
            exportAsMarkdown(editor, title)
            message.success('Markdown 导出成功')
        })
    } else if (key === 'html') {
        import('@/utils/exportDocument').then(({ exportAsHtml }) => {
            exportAsHtml(editor, title)
            message.success('HTML 导出成功')
        })
    } else if (key === 'docx') {
        import('@/utils/exportDocument').then(({ exportAsDocx }) => {
            exportAsDocx(editor, title)
            message.success('Word 导出成功')
        })
    }
}
</script>

<template>
    <div class="doc-editor-page">
        <!-- Header -->
        <header class="doc-header">
            <div class="header-left">
                <NButton quaternary size="small" @click="goBack" class="back-btn">
                    <template #icon><ChevronLeft :size="16" /></template>
                </NButton>
                <RouterLink to="/doc" class="home-link">
                    <Home :size="16" />
                </RouterLink>
                <span class="breadcrumb-sep">/</span>
                <span class="page-title-label">{{ page?.title || '文档' }}</span>

                <!-- Save status -->
                <span v-if="saveStatus === 'saving'" class="status-badge saving">
                    <Loader2 :size="14" class="spin-icon" />
                    保存中...
                </span>
                <span v-if="saveStatus === 'saved'" class="status-badge saved">
                    <Check :size="14" />
                    已保存
                </span>

                <!-- Sync status -->
                <span v-if="syncStatus === 'connecting'" class="status-badge syncing">
                    <Loader2 :size="14" class="spin-icon" />
                    同步中...
                </span>
                <span v-if="syncStatus === 'connected'" class="status-badge synced">
                    <Cloud :size="14" />
                    已同步
                </span>
                <span v-if="syncStatus === 'disconnected'" class="status-badge disconnected">
                    <WifiOff :size="14" />
                    连接断开
                </span>
            </div>
            <div class="header-right">
                <!-- Remote users -->
                <div v-if="remoteUsers.size > 0" class="remote-users">
                    <div
                        v-for="[id, user] in remoteUsers"
                        :key="id"
                        class="remote-avatar"
                        :style="{ backgroundColor: user.color }"
                        :title="user.name"
                    >
                        {{ user.name?.charAt(0)?.toUpperCase() || '?' }}
                    </div>
                </div>

                <!-- Export -->
                <NDropdown
                    :options="exportOptions"
                    placement="bottom-end"
                    trigger="click"
                    @select="handleExport"
                >
                    <NButton quaternary size="small">
                        <template #icon><Download :size="16" /></template>
                    </NButton>
                </NDropdown>

                <!-- Comment -->
                <NButton quaternary size="small" @click="commentPanelOpen = !commentPanelOpen">
                    <template #icon>
                        <NBadge :value="commentCount" :max="99">
                            <MessageSquare :size="16" />
                        </NBadge>
                    </template>
                </NButton>

                <!-- Version history -->
                <NButton quaternary size="small" @click="versionPanelOpen = !versionPanelOpen">
                    <template #icon><History :size="16" /></template>
                </NButton>

                <!-- Collaborators -->
                <NButton quaternary size="small" @click="collaboratorPanelOpen = !collaboratorPanelOpen">
                    <template #icon><Users :size="16" /></template>
                </NButton>

                <!-- Share -->
                <NButton quaternary size="small" @click="shareDialogOpen = true">
                    <template #icon><Share2 :size="16" /></template>
                </NButton>

                <!-- Backlinks -->
                <NButton quaternary size="small" @click="backlinksPanelOpen = !backlinksPanelOpen">
                    <template #icon><Link2 :size="16" /></template>
                </NButton>
            </div>
        </header>

        <!-- Content -->
        <div class="doc-content">
            <div class="doc-scroll">
                <div class="doc-inner">
                    <!-- Loading -->
                    <div v-if="isLoading" class="loading-state">
                        <NSpin />
                        <span class="ml-2 text-gray-400">加载中...</span>
                    </div>

                    <template v-else>
                        <!-- Cover image -->
                        <div v-if="page?.coverImage" class="cover-section">
                            <img :src="page.coverImage" alt="cover" class="cover-image" />
                            <button class="remove-cover-btn" @click="removeCover">移除封面</button>
                        </div>
                        <div v-else class="add-cover-section">
                            <button class="add-cover-btn" @click="addCover">+ 添加封面</button>
                        </div>

                        <!-- Title -->
                        <h1 class="doc-title">
                            <div
                                ref="titleRef"
                                contenteditable
                                class="title-editable"
                                data-placeholder="无标题"
                                @input="handleTitleInput"
                            />
                        </h1>

                        <!-- Role badge -->
                        <div v-if="page?.role === 'viewer'" class="role-badge viewer">
                            <Eye :size="14" />
                            只读模式 - 你只能查看此文档
                        </div>
                        <div v-if="page?.role === 'commenter'" class="role-badge commenter">
                            <Eye :size="14" />
                            评论模式 - 你可以查看和评论此文档
                        </div>

                        <!-- Editor -->
                        <DocEditorInner
                            :key="page?.pageId || 'fallback'"
                            :page-id="page?.pageId || 'pagekSZ4PZ'"
                            :editable="page?.role === 'editor' || page?.role === 'owner'"
                            @editor-ready="handleEditorReady"
                        />
                    </template>
                </div>
            </div>

            <!-- Comment drawer -->
            <NDrawer v-if="commentPanelOpen" v-model:show="commentPanelOpen" placement="right" :width="380">
                <NDrawerContent title="评论" class="comment-drawer">
                    <div class="comment-list">
                        <template v-if="commentsData && commentsData.length > 0">
                            <div
                                v-for="c in commentsData"
                                :key="c.commentId || c.id"
                                :class="['comment-item', { 'comment-resolved': c.resolvedAt }]"
                            >
                                <div class="comment-header">
                                    <NAvatar
                                        size="small"
                                        round
                                        :style="{ backgroundColor: c.user?.color || '#6B45FF' }"
                                    >
                                        {{ (c.user?.username || '?').charAt(0).toUpperCase() }}
                                    </NAvatar>
                                    <span class="comment-author">{{ c.user?.username || '匿名' }}</span>
                                    <span class="comment-time">{{ formatRelativeTime(c.createdAt) }}</span>
                                    <div class="comment-actions">
                                        <NButton
                                            v-if="!c.resolvedAt"
                                            text
                                            size="tiny"
                                            type="success"
                                            @click="handleResolve(c.commentId || c.id)"
                                        >
                                            解决
                                        </NButton>
                                        <NButton
                                            text
                                            size="tiny"
                                            type="error"
                                            @click="confirmDeleteComment(c.commentId || c.id)"
                                        >
                                            删除
                                        </NButton>
                                    </div>
                                </div>
                                <div class="comment-body">{{ c.content }}</div>
                                <div v-if="c.resolvedAt" class="comment-resolved-badge">
                                    <Check :size="12" /> 已解决
                                </div>

                                <!-- Replies -->
                                <div v-if="c.replies?.length" class="comment-replies">
                                    <div
                                        v-for="r in c.replies"
                                        :key="r.commentId || r.id"
                                        class="reply-item"
                                    >
                                        <div class="reply-header">
                                            <span class="reply-author">{{ r.user?.username || '匿名' }}</span>
                                            <span class="reply-time">{{ formatRelativeTime(r.createdAt) }}</span>
                                        </div>
                                        <div class="reply-body">{{ r.content }}</div>
                                    </div>
                                </div>

                                <!-- Reply input -->
                                <div v-if="!c.resolvedAt" class="comment-reply-area">
                                    <NButton
                                        v-if="replyTo !== (c.commentId || c.id)"
                                        text
                                        size="tiny"
                                        @click="replyTo = c.commentId || c.id"
                                    >
                                        回复
                                    </NButton>
                                    <div v-else class="reply-input-row">
                                        <NInput
                                            v-model:value="replyInput"
                                            type="textarea"
                                            size="small"
                                            placeholder="输入回复..."
                                            :autosize="{ minRows: 2, maxRows: 4 }"
                                            @keyup.ctrl.enter="handleReply(c.commentId || c.id)"
                                        />
                                <NSpace class="reply-actions" justify="end">
                                    <NButton size="tiny" quaternary @click="replyTo = null; replyInput = ''">
                                        取消
                                    </NButton>
                                    <NButton
                                        size="tiny"
                                        type="primary"
                                        :loading="submittingComment"
                                        :disabled="!replyInput.trim()"
                                        @click="handleReply(c.commentId || c.id)"
                                    >
                                        回复
                                    </NButton>
                                </NSpace>
                            </div>
                        </div>
                    </div>
                </template>
                <NEmpty v-else description="暂无评论" />
            </div>

            <!-- New comment input -->
            <div class="comment-new">
                <NInput
                    v-model:value="commentInput"
                    type="textarea"
                    placeholder="输入评论内容..."
                    :autosize="{ minRows: 2, maxRows: 6 }"
                />
                <NSpace class="comment-new-actions" justify="end">
                    <NButton
                        type="primary"
                        size="small"
                        :loading="submittingComment"
                        :disabled="!commentInput.trim()"
                        @click="handleAddComment"
                    >
                        发表评论
                    </NButton>
                </NSpace>
            </div>
        </NDrawerContent>
    </NDrawer>

            <!-- Version history drawer -->
            <NDrawer v-if="versionPanelOpen" v-model:show="versionPanelOpen" placement="right" :width="380">
                <NDrawerContent title="版本历史" class="version-drawer">
                    <div class="version-list">
                        <NSpin v-if="versionsLoading" class="version-loading" />
                        <template v-else-if="versions && versions.length > 0">
                            <div
                                v-for="v in versions"
                                :key="v.versionId || v.id"
                                class="version-item"
                            >
                                <div class="version-icon">
                                    <History :size="16" />
                                </div>
                                <div class="version-info">
                                    <span class="version-label">{{ v.label || `版本 ${v.versionNumber || ''}` }}</span>
                                    <span class="version-time">{{ formatRelativeTime(v.createdAt) }}</span>
                                    <span v-if="v.description" class="version-desc">{{ v.description }}</span>
                                </div>
                                <div class="version-actions">
                                    <NButton
                                        size="tiny"
                                        text
                                        type="warning"
                                        title="回滚到此版本"
                                        @click="handleRollback(v.versionId || v.id)"
                                    >
                                        <template #icon><RotateCcw :size="14" /></template>
                                    </NButton>
                                    <NButton
                                        size="tiny"
                                        text
                                        type="error"
                                        title="删除版本"
                                        @click="handleDeleteVersion(v.versionId || v.id)"
                                    >
                                        <template #icon><Trash2 :size="14" /></template>
                                    </NButton>
                                </div>
                            </div>
                        </template>
                        <NEmpty v-else description="暂无版本记录" />
                    </div>
                    <div class="version-footer">
                        <NButton
                            block
                            size="small"
                            :loading="creatingVersion"
                            @click="handleCreateVersion"
                        >
                            创建版本快照
                        </NButton>
                    </div>
                </NDrawerContent>
            </NDrawer>

            <!-- Collaborator drawer -->
            <NDrawer v-if="collaboratorPanelOpen" v-model:show="collaboratorPanelOpen" placement="right" :width="380">
                <NDrawerContent title="协作者" class="collab-drawer">
                    <div class="collab-list">
                        <NSpin v-if="collabLoading" class="collab-loading" />
                        <template v-else-if="collaborators && collaborators.length > 0">
                            <div
                                v-for="c in collaborators"
                                :key="c.id || c.collaboratorId"
                                class="collab-item"
                            >
                                <NAvatar
                                    size="small"
                                    round
                                    :style="{ backgroundColor: c.user?.color || '#6B45FF' }"
                                >
                                    {{ (c.user?.username || '?').charAt(0).toUpperCase() }}
                                </NAvatar>
                                <div class="collab-info">
                                    <span class="collab-name">{{ c.user?.username || '未知用户' }}</span>
                                    <span class="collab-role">{{ c.role === 'owner' ? '所有者' : c.role === 'editor' ? '可编辑' : c.role === 'commenter' ? '可评论' : '只读' }}</span>
                                </div>
                                <NButton
                                    v-if="c.role !== 'owner'"
                                    text
                                    size="tiny"
                                    type="error"
                                    @click="handleRemoveCollaborator(c.id || c.collaboratorId)"
                                >
                                    <template #icon><Trash2 :size="14" /></template>
                                </NButton>
                            </div>
                        </template>
                        <NEmpty v-else description="暂无协作者" />
                    </div>
                    <div class="collab-footer">
                        <NButton
                            v-if="!addCollabVisible"
                            block
                            size="small"
                            @click="addCollabVisible = true"
                        >
                            <template #icon><Plus :size="14" /></template>
                            添加协作者
                        </NButton>
                        <div v-else class="collab-add-form">
                            <NInput
                                v-model:value="collabUsername"
                                placeholder="输入用户名"
                                size="small"
                            />
                            <NSpace class="collab-add-actions" justify="end">
                                <NButton size="tiny" quaternary @click="addCollabVisible = false; collabUsername = ''">
                                    取消
                                </NButton>
                                <NButton
                                    size="tiny"
                                    type="primary"
                                    :loading="addingCollab"
                                    :disabled="!collabUsername.trim()"
                                    @click="handleAddCollaborator"
                                >
                                    添加
                                </NButton>
                            </NSpace>
                        </div>
                    </div>
                </NDrawerContent>
            </NDrawer>

            <!-- Backlinks drawer -->
            <NDrawer v-if="backlinksPanelOpen" v-model:show="backlinksPanelOpen" placement="right" :width="380">
                <NDrawerContent title="反向链接" class="backlinks-drawer">
                    <div class="backlinks-list">
                        <NSpin v-if="backlinksLoading" class="backlinks-loading" />
                        <template v-else-if="backlinks && backlinks.length > 0">
                            <div
                                v-for="bl in backlinks"
                                :key="bl.pageId || bl.id"
                                class="backlink-item"
                                @click="router.push(`/doc/${bl.pageId || bl.id}`)"
                            >
                                <div class="backlink-icon">
                                    <Link2 :size="14" />
                                </div>
                                <div class="backlink-info">
                                    <span class="backlink-title">{{ bl.title || '未命名文档' }}</span>
                                    <span class="backlink-time">{{ formatRelativeTime(bl.updatedAt || bl.createdAt) }}</span>
                                </div>
                            </div>
                        </template>
                        <NEmpty v-else description="暂无反向链接" />
                    </div>
                </NDrawerContent>
            </NDrawer>

            <!-- Share dialog -->
            <NModal v-model:show="shareDialogOpen" preset="card" title="分享文档" style="width: 460px">
                <div class="share-dialog-body">
                    <div v-if="!shareUrl" class="share-form">
                        <div class="share-form-row">
                            <span class="share-label">权限</span>
                            <NSpace>
                                <NButton
                                    size="tiny"
                                    :type="sharePermission === 'view' ? 'primary' : 'default'"
                                    @click="sharePermission = 'view'"
                                >只读</NButton>
                                <NButton
                                    size="tiny"
                                    :type="sharePermission === 'comment' ? 'primary' : 'default'"
                                    @click="sharePermission = 'comment'"
                                >可评论</NButton>
                                <NButton
                                    size="tiny"
                                    :type="sharePermission === 'edit' ? 'primary' : 'default'"
                                    @click="sharePermission = 'edit'"
                                >可编辑</NButton>
                            </NSpace>
                        </div>
                        <div class="share-form-row">
                            <span class="share-label">密码（可选）</span>
                            <NInput
                                v-model:value="sharePassword"
                                placeholder="留空则无需密码"
                                size="small"
                            />
                        </div>
                        <div class="share-form-row">
                            <span class="share-label">有效期</span>
                            <NSpace>
                                <NButton
                                    size="tiny"
                                    :type="shareExpireDays === 1 ? 'primary' : 'default'"
                                    @click="shareExpireDays = 1"
                                >1天</NButton>
                                <NButton
                                    size="tiny"
                                    :type="shareExpireDays === 7 ? 'primary' : 'default'"
                                    @click="shareExpireDays = 7"
                                >7天</NButton>
                                <NButton
                                    size="tiny"
                                    :type="shareExpireDays === 30 ? 'primary' : 'default'"
                                    @click="shareExpireDays = 30"
                                >30天</NButton>
                                <NButton
                                    size="tiny"
                                    :type="shareExpireDays === 0 ? 'primary' : 'default'"
                                    @click="shareExpireDays = 0"
                                >永久</NButton>
                            </NSpace>
                        </div>
                        <NButton
                            block
                            type="primary"
                            :loading="creatingShare"
                            @click="handleCreateShare"
                        >
                            生成分享链接
                        </NButton>
                    </div>
                    <div v-else class="share-result">
                        <div class="share-url-box">
                            <span class="share-url-text">{{ shareUrl }}</span>
                            <NButton text type="primary" @click="handleCopyShareLink">
                                <template #icon><Copy :size="14" /></template>
                            </NButton>
                        </div>
                        <NSpace justify="end">
                            <NButton size="tiny" @click="shareUrl = ''">重新生成</NButton>
                            <NButton size="tiny" type="primary" @click="shareDialogOpen = false">完成</NButton>
                        </NSpace>
                    </div>
                </div>
            </NModal>
        </div>

        <!-- Status bar -->
        <div v-if="editorInstance" class="doc-status-bar">
            <span class="status-item">{{ page?.title || 'Untitled' }}</span>
            <span class="status-item" v-if="editorInstance">
                {{ editorInstance.words?.() || 0 }} 字
            </span>
        </div>
    </div>
</template>

<style scoped>
.doc-editor-page {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: hsl(var(--background));
}

.doc-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 52px;
    padding: 0 16px;
    border-bottom: 1px solid hsl(var(--border));
    flex-shrink: 0;
    background: hsl(var(--card));
}

.header-left {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
}

.header-right {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
}

.home-link {
    color: hsl(var(--muted-foreground));
    transition: color 0.15s;
    display: flex;
    align-items: center;
}

.home-link:hover {
    color: hsl(var(--foreground));
}

.breadcrumb-sep {
    color: hsl(var(--muted-foreground));
    font-size: 14px;
    margin: 0 2px;
}

.page-title-label {
    font-size: 14px;
    font-weight: 500;
    color: hsl(var(--foreground));
    max-width: 240px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.status-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 5px;
    font-weight: 500;
    margin-left: 6px;
}

.status-badge.saving {
    color: hsl(var(--muted-foreground));
    background: hsl(var(--muted));
}
.status-badge.saved {
    color: #16a34a;
    background: #f0fdf4;
}
.status-badge.syncing {
    color: #ca8a04;
    background: #fefce8;
}
.status-badge.synced {
    color: #16a34a;
    background: #f0fdf4;
}
.status-badge.disconnected {
    color: #dc2626;
    background: #fef2f2;
}

.spin-icon {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.remote-users {
    display: flex;
    align-items: center;
}

.remote-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 600;
    color: white;
    border: 2px solid hsl(var(--card));
    margin-left: -6px;
    cursor: default;
}

.remote-avatar:first-child {
    margin-left: 0;
}

.doc-content {
    flex: 1;
    overflow: hidden;
    display: flex;
}

.doc-scroll {
    flex: 1;
    overflow-y: auto;
    min-width: 0;
}

.doc-scroll::-webkit-scrollbar {
    width: 6px;
}

.doc-scroll::-webkit-scrollbar-thumb {
    background: hsl(var(--border));
    border-radius: 3px;
}

.doc-inner {
    max-width: 760px;
    margin: 0 auto;
    padding: 0 24px 80px;
}

.loading-state {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 100px 0;
}

.cover-section {
    position: relative;
    margin: 0 -24px;
    border-radius: 12px;
    overflow: hidden;
}

.cover-image {
    width: 100%;
    height: 220px;
    object-fit: cover;
    display: block;
}

.remove-cover-btn {
    position: absolute;
    top: 12px;
    right: 12px;
    height: 28px;
    padding: 0 12px;
    font-size: 12px;
    background: rgba(0,0,0,0.5);
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.15s;
    backdrop-filter: blur(4px);
}

.cover-section:hover .remove-cover-btn {
    opacity: 1;
}

.add-cover-section {
    padding: 20px 0 12px;
}

.add-cover-btn {
    font-size: 13px;
    color: hsl(var(--muted-foreground));
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px 0;
    transition: color 0.15s;
}

.add-cover-btn:hover {
    color: hsl(var(--foreground));
}

.doc-title {
    font-size: 42px;
    font-weight: 750;
    line-height: 1.2;
    margin: 20px 0 12px;
    letter-spacing: -0.03em;
}

.title-editable {
    outline: none;
    color: hsl(var(--foreground));
}

.title-editable:empty::before {
    content: attr(data-placeholder);
    color: hsl(var(--muted-foreground) / 0.5);
}

.role-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 12px;
    margin-bottom: 16px;
    font-weight: 500;
}

.role-badge.viewer {
    background: hsl(var(--muted));
    color: hsl(var(--muted-foreground));
}

.role-badge.commenter {
    background: #fffbeb;
    color: #d97706;
}

/* Comment drawer */
.comment-drawer {
    --n-body-padding: 0;
}
.comment-list {
    flex: 1;
    overflow-y: auto;
    padding: 12px 16px;
}
.comment-item {
    border-bottom: 1px solid hsl(var(--border));
    padding: 12px 0;
}
.comment-item.comment-resolved {
    opacity: 0.55;
}
.comment-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
}
.comment-author {
    font-size: 13px;
    font-weight: 600;
    color: hsl(var(--foreground));
}
.comment-time {
    font-size: 11px;
    color: hsl(var(--muted-foreground));
    flex-shrink: 0;
}
.comment-actions {
    margin-left: auto;
    display: flex;
    gap: 4px;
}
.comment-body {
    font-size: 14px;
    color: hsl(var(--foreground));
    line-height: 1.5;
    padding-left: 36px;
    white-space: pre-wrap;
    word-break: break-word;
}
.comment-resolved-badge {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 11px;
    color: #16a34a;
    padding-left: 36px;
    margin-top: 4px;
}
.comment-replies {
    margin: 8px 0 4px 36px;
    padding: 8px 12px;
    background: hsl(var(--muted));
    border-radius: 8px;
}
.reply-item {
    padding: 4px 0;
}
.reply-header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 2px;
}
.reply-author {
    font-size: 12px;
    font-weight: 600;
    color: hsl(var(--foreground));
}
.reply-time {
    font-size: 10px;
    color: hsl(var(--muted-foreground));
}
.reply-body {
    font-size: 13px;
    color: hsl(var(--foreground));
    line-height: 1.4;
    white-space: pre-wrap;
    word-break: break-word;
}
.comment-reply-area {
    padding-left: 36px;
    margin-top: 6px;
}
.reply-input-row {
    display: flex;
    flex-direction: column;
    gap: 6px;
}
.reply-actions {
    display: flex;
    gap: 4px;
}
.comment-new {
    padding: 12px 16px;
    border-top: 1px solid hsl(var(--border));
    display: flex;
    flex-direction: column;
    gap: 8px;
}
.comment-new-actions {
    display: flex;
    gap: 4px;
}

/* Collaborator drawer */
.collab-drawer {
    --n-body-padding: 0;
}
.collab-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px 0;
}
.collab-loading {
    display: flex;
    justify-content: center;
    padding: 40px 0;
}
.collab-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 16px;
}
.collab-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1px;
}
.collab-name {
    font-size: 13px;
    font-weight: 600;
    color: hsl(var(--foreground));
}
.collab-role {
    font-size: 11px;
    color: hsl(var(--muted-foreground));
}
.collab-footer {
    padding: 12px 16px;
    border-top: 1px solid hsl(var(--border));
}
.collab-add-form {
    display: flex;
    flex-direction: column;
    gap: 8px;
}
.collab-add-actions {
    display: flex;
    gap: 4px;
}

/* Backlinks drawer */
.backlinks-drawer {
    --n-body-padding: 0;
}
.backlinks-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px 0;
}
.backlinks-loading {
    display: flex;
    justify-content: center;
    padding: 40px 0;
}
.backlink-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
    cursor: pointer;
    transition: background 0.1s;
}
.backlink-item:hover {
    background: hsl(var(--muted));
}
.backlink-icon {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    background: hsl(var(--muted));
    display: flex;
    align-items: center;
    justify-content: center;
    color: hsl(var(--muted-foreground));
    flex-shrink: 0;
}
.backlink-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1px;
}
.backlink-title {
    font-size: 13px;
    font-weight: 600;
    color: hsl(var(--foreground));
}
.backlink-time {
    font-size: 11px;
    color: hsl(var(--muted-foreground));
}

/* Share dialog */
.share-dialog-body {
    display: flex;
    flex-direction: column;
    gap: 16px;
}
.share-form {
    display: flex;
    flex-direction: column;
    gap: 14px;
}
.share-form-row {
    display: flex;
    flex-direction: column;
    gap: 6px;
}
.share-label {
    font-size: 13px;
    font-weight: 500;
    color: hsl(var(--foreground));
}
.share-result {
    display: flex;
    flex-direction: column;
    gap: 12px;
}
.share-url-box {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    background: hsl(var(--muted));
    border-radius: 8px;
    border: 1px solid hsl(var(--border));
}
.share-url-text {
    flex: 1;
    font-size: 13px;
    color: hsl(var(--foreground));
    word-break: break-all;
}

/* Version drawer */
.version-drawer {
    --n-body-padding: 0;
}
.version-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px 0;
}
.version-loading {
    display: flex;
    justify-content: center;
    padding: 40px 0;
}
.version-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 16px;
    border-bottom: 1px solid hsl(var(--border));
    transition: background 0.1s;
}
.version-item:hover {
    background: hsl(var(--muted));
}
.version-icon {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    background: hsl(var(--muted));
    display: flex;
    align-items: center;
    justify-content: center;
    color: hsl(var(--muted-foreground));
    flex-shrink: 0;
}
.version-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
}
.version-label {
    font-size: 13px;
    font-weight: 600;
    color: hsl(var(--foreground));
}
.version-time {
    font-size: 11px;
    color: hsl(var(--muted-foreground));
}
.version-desc {
    font-size: 12px;
    color: hsl(var(--muted-foreground));
    margin-top: 2px;
}
.version-actions {
    display: flex;
    gap: 2px;
    flex-shrink: 0;
}
.version-footer {
    padding: 12px 16px;
    border-top: 1px solid hsl(var(--border));
}

.doc-status-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 32px;
    padding: 0 16px;
    border-top: 1px solid hsl(var(--border));
    font-size: 11px;
    color: hsl(var(--muted-foreground));
    flex-shrink: 0;
    background: hsl(var(--card));
}
</style>
