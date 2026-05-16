<script setup lang="ts">
import { computed, h, ref } from 'vue'
import type { ComputedRef } from 'vue'
import { useRouter } from 'vue-router'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import {
    NButton,
    NEmpty,
    NModal,
    NInput,
    NDropdown,
    NSpace,
    useMessage,
    type DropdownOption,
} from 'naive-ui'
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
} from 'lucide-vue-next'
import { formatDistanceToNowStrict } from 'date-fns'

import * as srv from '@/services'
import { queryClient } from '@/utils/query-client'
import { randomEmoji } from '@/utils/randomEmoji'

const router = useRouter()
const message = useMessage()

// Data
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

const { data: allTags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
        const res = await srv.fetchTags()
        return res.data || []
    },
})

const pageIds = computed(() => pages.value?.map((p: any) => p.pageId) || [])
const sharedPageIds = computed(() => sharedPages.value?.map((p: any) => p.pageId) || [])
const allPageIds = computed(() => [...pageIds.value, ...sharedPageIds.value])

const { data: batchPageTags = {} } = useQuery({
    queryKey: ['batchPageTags', allPageIds],
    queryFn: async () => {
        if (allPageIds.value.length === 0) return {}
        const res = await srv.batchFetchPageTags(allPageIds.value)
        return res.data || {}
    },
    enabled: computed(() => allPageIds.value.length > 0),
})

// Drag state
const isDragging = ref(false)
const dragCounter = ref(0)

// File upload
const fileInputRef = ref<HTMLInputElement>()
const uploadLoading = ref(false)

async function handleFileUpload(e: Event) {
    const target = e.target as HTMLInputElement
    const file = target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.md') && !file.name.endsWith('.markdown')) {
        message.error('请选择 .md 文件')
        return
    }

    uploadLoading.value = true
    try {
        const text = await file.text()
        sessionStorage.setItem('md-pending-markdown', text)
        const res = await srv.createPage({ emoji: randomEmoji(), title: file.name.replace(/\.(md|markdown)$/i, '') })
        router.push(`/doc/${res.data.pageId}`)
        message.success('文件导入成功')
    } catch {
        message.error('文件导入失败')
    } finally {
        uploadLoading.value = false
        target.value = ''
    }
}

// Dialogs
const mdDialogOpen = ref(false)
const templateOpen = ref(false)
const deleteTagDialogOpen = ref(false)
const pendingDeleteTag = ref<{ tagId: string; tagName: string } | null>(null)
const tagPickerPageId = ref<string | null>(null)
const tagPickerOpen = computed({
    get: () => tagPickerPageId.value !== null,
    set: (v: boolean) => { if (!v) tagPickerPageId.value = null },
})
const coverPickerPageId = ref<string | null>(null)
const newTagName = ref('')
const newTagColor = ref('#6B45FF')

const TAG_COLORS = ['#6B45FF', '#E11D48', '#0891B2', '#059669', '#D97706', '#7C3AED', '#DB2777', '#2563EB']

// Handlers
async function handleCreate() {
    const res = await srv.createPage({ emoji: randomEmoji(), title: '未命名文档' })
    router.push(`/doc/${res.data.pageId}`)
    refetch()
}

async function handleDelete(pageId: string) {
    await srv.removePage(pageId)
    queryClient.invalidateQueries({ queryKey: ['pages'] })
    queryClient.invalidateQueries({ queryKey: ['trash'] })
}

async function handleToggleFavorite(pageId: string) {
    await srv.toggleFavorite(pageId)
    queryClient.invalidateQueries({ queryKey: ['pages'] })
}

async function handleAddCover(pageId: string, coverUrl: string) {
    const covers = getCoverImages()
    const url = coverUrl === '__random__' ? covers[Math.floor(Math.random() * covers.length)] : coverUrl
    await srv.updatePage({ pageId, coverImage: url })
    queryClient.invalidateQueries({ queryKey: ['pages'] })
    coverPickerPageId.value = null
}

async function handleRemoveCover(pageId: string) {
    await srv.updatePage({ pageId, coverImage: null })
    queryClient.invalidateQueries({ queryKey: ['pages'] })
}

async function handleAddTag(pageId: string, tagId: string) {
    await srv.addPageTag({ pageId, tagId })
    queryClient.invalidateQueries({ queryKey: ['batchPageTags'] })
    tagPickerPageId.value = null
}

async function handleRemoveTag(pageId: string, tagId: string) {
    await srv.removePageTag(pageId, tagId)
    queryClient.invalidateQueries({ queryKey: ['batchPageTags'] })
}

async function handleCreateTag(pageId: string) {
    if (!newTagName.value.trim()) return
    const res = await srv.createTag({ name: newTagName.value.trim(), color: newTagColor.value })
    const created = res.data
    if (created?.tagId) {
        await srv.addPageTag({ pageId, tagId: created.tagId })
        queryClient.invalidateQueries({ queryKey: ['tags'] })
        queryClient.invalidateQueries({ queryKey: ['batchPageTags'] })
    }
    newTagName.value = ''
    tagPickerPageId.value = null
}

function confirmDeleteTag(tagId: string, tagName: string) {
    pendingDeleteTag.value = { tagId, tagName }
    deleteTagDialogOpen.value = true
}

async function doDeleteTag() {
    if (!pendingDeleteTag.value) return
    await srv.deleteTag(pendingDeleteTag.value.tagId)
    queryClient.invalidateQueries({ queryKey: ['tags'] })
    queryClient.invalidateQueries({ queryKey: ['batchPageTags'] })
    pendingDeleteTag.value = null
}

function getCoverImages() {
    return [
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&h=300&fit=crop',
        'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=300&fit=crop',
        'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&h=300&fit=crop',
        'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=800&h=300&fit=crop',
        'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&h=300&fit=crop',
        'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&h=300&fit=crop',
    ]
}

// Drag & drop handlers
function handleDragEnter(e: DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.value++
    const items = e.dataTransfer?.items
    let hasMd = false
    if (items) {
        for (let i = 0; i < items.length; i++) {
            if (items[i].type === '' || items[i].type.includes('text') || items[i].kind === 'file') {
                hasMd = true
                break
            }
        }
    }
    if (hasMd) isDragging.value = true
}

function handleDragLeave(e: DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.value--
    if (dragCounter.value === 0) isDragging.value = false
}

function handleDragOver(e: DragEvent) {
    e.preventDefault()
    e.stopPropagation()
}

function handleDrop(e: DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.value = 0
    isDragging.value = false
    const file = e.dataTransfer?.files?.[0]
    if (file && file.name.endsWith('.md')) {
        mdDialogOpen.value = true
    }
}

function getPageTags(pageId: string) {
    return ((batchPageTags.value || {}) as Record<string, any[]>)[pageId] || []
}

const coverImages = getCoverImages()

function buildCardMenu(pageId: string): DropdownOption[] {
    return [
        {
            label: '收藏',
            key: 'favorite',
            icon: () => h(Star, { size: 14 }),
        },
        {
            type: 'divider' as const,
            key: 'd1',
        },
        {
            label: '新标签打开',
            key: 'open-new',
            icon: () => h(ArrowUpRight, { size: 14 }),
        },
        {
            type: 'divider' as const,
            key: 'd2',
        },
        {
            label: '封面',
            key: 'cover',
            icon: () => h(Image, { size: 14 }),
            children: [
                ...coverImages.map((url, i) => ({
                    label: `封面 ${i + 1}`,
                    key: `cover-${url}`,
                })),
                {
                    type: 'divider' as const,
                    key: 'cd1',
                },
                {
                    label: '移除封面',
                    key: 'remove-cover',
                },
            ],
        },
        {
            label: '标签',
            key: 'tags',
            icon: () => h(Tag, { size: 14 }),
        },
        {
            type: 'divider' as const,
            key: 'd3',
        },
        {
            label: '删除',
            key: 'delete',
            icon: () => h(Trash2, { size: 14 }),
        },
    ]
}

function handleCardAction(key: string, pageId: string) {
    if (key === 'favorite') {
        handleToggleFavorite(pageId)
    } else if (key === 'open-new') {
        window.open(`/doc/${pageId}`, '_blank')
    } else if (key === 'remove-cover') {
        handleRemoveCover(pageId)
    } else if (key === 'delete') {
        handleDelete(pageId)
    } else if (key.startsWith('cover-')) {
        handleAddCover(pageId, key.slice(6))
    } else if (key === 'tags') {
        tagPickerPageId.value = pageId
    }
}
</script>

<template>
    <div class="doclist-page">
        <!-- Toolbar -->
        <div class="doclist-toolbar">
            <div class="toolbar-left">
                <h1 class="toolbar-title">全部文档</h1>
            </div>
            <div class="toolbar-right">
                <NButton size="small" @click="mdDialogOpen = true">
                    <template #icon><FileUp :size="16" /></template>
                    上传 Markdown
                </NButton>
                <NButton size="small" @click="templateOpen = true">
                    <template #icon><LayoutTemplate :size="16" /></template>
                    从模板创建
                </NButton>
                <NButton type="primary" size="small" @click="handleCreate">
                    <template #icon><Plus :size="16" /></template>
                    新建文档
                </NButton>
            </div>
        </div>

        <!-- Content area with drag support -->
        <div
            class="doclist-content"
            @dragenter="handleDragEnter"
            @dragleave="handleDragLeave"
            @dragover="handleDragOver"
            @drop="handleDrop"
        >
            <!-- Drag overlay -->
            <div v-if="isDragging" class="drag-overlay">
                <FileUp :size="48" />
                <p>释放以导入 Markdown 文件</p>
            </div>

            <!-- Page grid -->
            <div v-if="pages && pages.length > 0" class="page-grid">
                <div
                    v-for="(page, index) in pages"
                    :key="page.pageId"
                    class="page-card"
                    :style="{ animationDelay: `${index * 60}ms` }"
                    @click="router.push(`/doc/${page.pageId}`)"
                >
                    <div v-if="page.coverImage" class="card-cover">
                        <img :src="page.coverImage" alt="" />
                    </div>
                    <div v-else class="card-emoji">{{ page.emoji }}</div>
                    <div class="card-body">
                        <p class="card-title">{{ page.title }}</p>
                        <div class="card-meta">
                            <span class="card-time">{{ formatDistanceToNowStrict(page.createdAt) }}前</span>
                            <div v-if="getPageTags(page.pageId).length > 0" class="card-tags">
                                <span
                                    v-for="tag in getPageTags(page.pageId).slice(0, 2)"
                                    :key="tag.tagId"
                                    class="card-tag"
                                    :style="{ backgroundColor: tag.color + '18', color: tag.color }"
                                >
                                    {{ tag.name }}
                                </span>
                                <span
                                    v-if="getPageTags(page.pageId).length > 2"
                                    class="card-tag-more"
                                >
                                    +{{ getPageTags(page.pageId).length - 2 }}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="card-actions" @click.stop>
                        <NDropdown
                            trigger="click"
                            placement="bottom-end"
                            :options="buildCardMenu(page.pageId)"
                            @select="(key: string) => handleCardAction(key, page.pageId)"
                        >
                            <NButton quaternary size="tiny" circle>
                                <template #icon><MoreVertical :size="16" /></template>
                            </NButton>
                        </NDropdown>
                    </div>
                </div>
            </div>

            <!-- Empty state -->
            <div v-else class="empty-state">
                <NEmpty description="暂无文档">
                    <template #extra>
                        <NButton type="primary" @click="handleCreate">新建文档</NButton>
                    </template>
                </NEmpty>
            </div>

            <!-- Shared pages -->
            <div v-if="sharedPages && sharedPages.length > 0" class="shared-section">
                <h2 class="shared-title">与我共享</h2>
                <div class="page-grid">
                    <div
                        v-for="(page, index) in sharedPages"
                        :key="page.pageId"
                        class="page-card"
                        :style="{ animationDelay: `${index * 60}ms` }"
                        @click="router.push(`/doc/${page.pageId}`)"
                    >
                        <div v-if="page.coverImage" class="card-cover">
                            <img :src="page.coverImage" alt="" />
                        </div>
                        <div v-else class="card-emoji">{{ page.emoji }}</div>
                        <div class="card-body">
                            <p class="card-title">{{ page.title }}</p>
                            <div class="shared-meta">
                                <span v-if="page.role === 'viewer'" class="role-tag viewer">
                                    <Eye :size="10" /> 只读
                                </span>
                                <span v-else-if="page.role === 'commenter'" class="role-tag commenter">
                                    <MessageSquare :size="10" /> 可评论
                                </span>
                                <span v-else class="role-tag editor-role">
                                    <Shield :size="10" /> 可编辑
                                </span>
                                <span class="owner-name">来自 {{ page.ownerName }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Markdown upload dialog -->
        <NModal v-model:show="mdDialogOpen" title="上传 Markdown" preset="card" style="width: 500px">
            <div class="md-upload-body">
                <p class="text-sm text-gray-400 mb-4">选择 Markdown 文件导入为文档</p>
                <input
                    ref="fileInputRef"
                    type="file"
                    accept=".md,.markdown"
                    style="display: none"
                    @change="handleFileUpload"
                />
                <div class="md-upload-actions">
                    <NButton :loading="uploadLoading" @click="fileInputRef?.click()">
                        <template #icon><FileUp :size="16" /></template>
                        选择文件
                    </NButton>
                    <NButton @click="mdDialogOpen = false">取消</NButton>
                </div>
            </div>
        </NModal>

        <!-- Tag picker dialog -->
        <NModal
            v-if="tagPickerPageId"
            v-model:show="tagPickerOpen"
            title="管理标签"
            preset="card"
            style="width: 420px"
        >
            <div class="tag-picker-body">
                <div class="tag-picker-existing">
                    <div
                        v-for="tag in allTags"
                        :key="tag.tagId"
                        class="tag-picker-item"
                    >
                        <span
                            class="tag-chip"
                            :style="{
                                backgroundColor: tag.color + '18',
                                color: tag.color,
                                border: '1px solid ' + tag.color + '30'
                            }"
                            @click="handleAddTag(tagPickerPageId, tag.tagId)"
                        >
                            {{ tag.name }}
                        </span>
                        <NButton text size="tiny" type="error" @click="confirmDeleteTag(tag.tagId, tag.name)">
                            <template #icon><Trash2 :size="12" /></template>
                        </NButton>
                    </div>
                    <div v-if="allTags.length === 0" class="tag-picker-empty">
                        暂无标签，创建一个
                    </div>
                </div>
                <div class="tag-picker-new">
                    <span class="tag-picker-new-label">新建标签</span>
                    <div class="tag-picker-new-row">
                        <NInput
                            v-model:value="newTagName"
                            placeholder="标签名称"
                            size="small"
                        />
                        <div class="tag-color-picker">
                            <button
                                v-for="color in TAG_COLORS"
                                :key="color"
                                :class="['tag-color-btn', { active: newTagColor === color }]"
                                :style="{ backgroundColor: color }"
                                @click="newTagColor = color"
                            />
                        </div>
                        <NButton
                            size="small"
                            type="primary"
                            :disabled="!newTagName.trim()"
                            @click="handleCreateTag(tagPickerPageId)"
                        >
                            创建
                        </NButton>
                    </div>
                </div>
            </div>
        </NModal>

        <!-- Template dialog -->
        <NModal v-model:show="templateOpen" title="从模板创建" preset="card" style="width: 600px">
            <p class="text-sm text-gray-400 mb-4">模板功能待实现</p>
            <NButton @click="templateOpen = false">关闭</NButton>
        </NModal>

        <!-- Delete tag confirm -->
        <NModal v-model:show="deleteTagDialogOpen" title="删除标签" preset="card" style="width: 400px">
            <p class="mb-4">确定删除标签「{{ pendingDeleteTag?.tagName || '' }}」？</p>
            <template #footer>
                <NSpace justify="end">
                    <NButton @click="deleteTagDialogOpen = false">取消</NButton>
                    <NButton type="error" @click="doDeleteTag">删除</NButton>
                </NSpace>
            </template>
        </NModal>
    </div>
</template>

<style scoped>
.doclist-page {
    padding: 24px 32px;
    height: 100%;
    display: flex;
    flex-direction: column;
}

.doclist-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 28px;
    flex-shrink: 0;
}

.toolbar-title {
    font-size: 26px;
    font-weight: 700;
    color: hsl(var(--foreground));
    margin: 0;
    letter-spacing: -0.02em;
}

.toolbar-right {
    display: flex;
    gap: 8px;
}

.doclist-content {
    position: relative;
    flex: 1;
    min-height: 300px;
}

.drag-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: hsl(var(--background) / 0.92);
    border: 2px dashed hsl(var(--border));
    border-radius: 12px;
    z-index: 10;
    color: hsl(var(--muted-foreground));
    gap: 12px;
}

.page-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 14px;
}

.page-card {
    border: 1px solid hsl(var(--border));
    border-radius: 10px;
    overflow: hidden;
    cursor: pointer;
    transition: box-shadow 0.2s, transform 0.15s;
    animation: cardFadeIn 0.35s ease-out both;
    position: relative;
    background: hsl(var(--card));
}

.page-card:hover {
    box-shadow: 0 4px 16px hsl(var(--foreground) / 0.06);
    transform: translateY(-2px);
}

@keyframes cardFadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
}

.card-cover {
    height: 110px;
    overflow: hidden;
}

.card-cover img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s;
}

.page-card:hover .card-cover img {
    transform: scale(1.03);
}

.card-emoji {
    height: 110px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 42px;
    background: hsl(var(--muted));
}

.card-body {
    padding: 12px 14px;
}

.card-title {
    font-size: 14px;
    font-weight: 600;
    color: hsl(var(--foreground));
    margin: 0 0 8px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.card-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}

.card-time {
    font-size: 12px;
    color: hsl(var(--muted-foreground));
}

.card-tags {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
}

.card-tag {
    font-size: 11px;
    padding: 1px 6px;
    border-radius: 4px;
    font-weight: 500;
}

.card-tag-more {
    font-size: 11px;
    color: hsl(var(--muted-foreground));
}

.card-actions {
    position: absolute;
    top: 8px;
    right: 8px;
    opacity: 0;
    transition: opacity 0.15s;
}

.page-card:hover .card-actions {
    opacity: 1;
}

.shared-section {
    margin-top: 36px;
}

.shared-title {
    font-size: 16px;
    font-weight: 600;
    color: hsl(var(--foreground));
    margin: 0 0 14px;
}

.shared-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
}

.role-tag {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    font-size: 10px;
    font-weight: 500;
}

.role-tag.viewer { color: hsl(var(--muted-foreground)); }
.role-tag.commenter { color: #d97706; }
.role-tag.editor-role { color: hsl(var(--accent)); }

.owner-name {
    color: hsl(var(--muted-foreground));
    font-size: 10px;
}

/* Markdown upload */
.md-upload-body {
    display: flex;
    flex-direction: column;
    gap: 16px;
}
.md-upload-actions {
    display: flex;
    gap: 8px;
}

/* Tag picker */
.tag-picker-body {
    display: flex;
    flex-direction: column;
    gap: 16px;
}
.tag-picker-existing {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
}
.tag-picker-item {
    display: flex;
    align-items: center;
    gap: 4px;
}
.tag-chip {
    font-size: 12px;
    padding: 2px 10px;
    border-radius: 999px;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.15s;
}
.tag-chip:hover {
    opacity: 0.7;
}
.tag-picker-empty {
    font-size: 13px;
    color: hsl(var(--muted-foreground));
}
.tag-picker-new {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-top: 12px;
    border-top: 1px solid hsl(var(--border));
}
.tag-picker-new-label {
    font-size: 13px;
    font-weight: 500;
    color: hsl(var(--foreground));
}
.tag-picker-new-row {
    display: flex;
    gap: 8px;
    align-items: center;
}
.tag-color-picker {
    display: flex;
    gap: 4px;
}
.tag-color-btn {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 2px solid transparent;
    cursor: pointer;
    padding: 0;
}
.tag-color-btn.active {
    border-color: hsl(var(--foreground));
}

.empty-state {
    display: flex;
    justify-content: center;
    padding: 80px 0;
}

:deep(.n-dropdown-menu) {
    min-width: 180px;
}
</style>
