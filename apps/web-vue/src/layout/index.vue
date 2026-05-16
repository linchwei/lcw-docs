<template>
    <NLayout has-sider position="absolute" style="height: 100vh">
        <NLayoutSider
            bordered
            collapse-mode="width"
            :collapsed-width="64"
            :width="260"
            content-style="display: flex; flex-direction: column; height: 100%; overflow: hidden;"
        >
            <!-- Header -->
            <div class="sidebar-header">
                <router-link to="/" class="brand-link">
                    <div class="brand-logo">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
                        </svg>
                    </div>
                    <span class="brand-text">协同文档</span>
                </router-link>
            </div>

            <!-- Search -->
            <div class="sidebar-search" @click="searchOpen = true">
                <div class="search-btn">
                    <Search :size="15" class="search-icon" />
                    <span class="search-text">搜索</span>
                    <kbd class="search-kbd"><span>⌘</span>K</kbd>
                </div>
            </div>

            <!-- Nav links -->
            <div class="sidebar-nav">
                <router-link to="/doc" class="nav-link" :class="{ active: route.path === '/doc' }">
                    <FileStack :size="18" class="nav-icon" />
                    <span>全部文档</span>
                </router-link>
                <router-link to="/doc/graph" class="nav-link" :class="{ active: route.path === '/doc/graph' }">
                    <Waypoints :size="18" class="nav-icon" />
                    <span>文档图谱</span>
                </router-link>
            </div>

            <!-- Scrollable content -->
            <div class="sidebar-scroll">
                <!-- Recent pages -->
                <div v-if="recentPages?.length" class="sidebar-section">
                    <div class="section-label">最近编辑</div>
                    <div class="section-items">
                        <router-link
                            v-for="item in recentPages.slice(0, 5)"
                            :key="item.pageId"
                            :to="`/doc/${item.pageId}`"
                            class="page-link"
                            :class="{ active: activeDocId === item.pageId }"
                            :title="item.title"
                        >
                            <span class="page-emoji">{{ item.emoji }}</span>
                            <span class="page-title">{{ item.title }}</span>
                            <Clock :size="12" class="page-icon" />
                        </router-link>
                    </div>
                </div>

                <!-- Favorites -->
                <div v-if="favoritePages.length" class="sidebar-section">
                    <div class="section-label">收藏</div>
                    <div class="section-items">
                        <router-link
                            v-for="item in favoritePages"
                            :key="item.pageId"
                            :to="`/doc/${item.pageId}`"
                            class="page-link"
                            :class="{ active: activeDocId === item.pageId }"
                            :title="item.title"
                        >
                            <span class="page-emoji">{{ item.emoji }}</span>
                            <span class="page-title">{{ item.title }}</span>
                            <Star :size="12" class="page-star" />
                        </router-link>
                    </div>
                </div>

                <!-- All documents -->
                <div class="sidebar-section">
                    <div class="section-label section-label-with-actions">
                        <span>所有文档</span>
                        <div class="section-actions">
                            <NTooltip trigger="hover">
                                <template #trigger>
                                    <NButton quaternary size="tiny" @click="handleCreateFolder">
                                        <template #icon><FolderPlus :size="14" /></template>
                                    </NButton>
                                </template>
                                新建文件夹
                            </NTooltip>
                            <NTooltip trigger="hover">
                                <template #trigger>
                                    <NButton quaternary size="tiny" @click="handleCreate">
                                        <template #icon><Plus :size="14" /></template>
                                    </NButton>
                                </template>
                                新建文档
                            </NTooltip>
                        </div>
                    </div>
                    <div class="section-items">
                        <!-- Folders -->
                        <template v-for="folder in folderList" :key="folder.folderId">
                            <div class="folder-group">
                                <div class="folder-header" @click="toggleFolder(folder.folderId)">
                                    <ChevronRight :size="14" class="folder-chevron" :class="{ rotated: openFolders[folder.folderId] }" />
                                    <span class="folder-emoji">📁</span>
                                    <span class="folder-name">{{ folder.name }}</span>
                                    <span class="folder-count">{{ folderPages(folder.folderId).length }}</span>
                                    <NDropdown :options="folderMenuOptions" placement="right" trigger="click" @select="(key: string) => handleFolderMenuSelect(key, folder)">
                                        <NButton quaternary size="tiny" class="folder-more">
                                            <template #icon><MoreHorizontal :size="14" /></template>
                                        </NButton>
                                    </NDropdown>
                                </div>
                                <div v-if="openFolders[folder.folderId]" class="folder-pages">
                                    <router-link
                                        v-for="item in folderPages(folder.folderId)"
                                        :key="item.pageId"
                                        :to="`/doc/${item.pageId}`"
                                        class="page-link folder-page-link"
                                        :class="{ active: activeDocId === item.pageId }"
                                        :title="item.title"
                                    >
                                        <span class="page-emoji">{{ item.emoji }}</span>
                                        <span class="page-title">{{ item.title }}</span>
                                    </router-link>
                                </div>
                            </div>
                        </template>
                        <!-- Root pages (no folder) -->
                        <template v-for="item in rootPages" :key="item.pageId">
                            <NDropdown :options="pageMenuOptions" placement="right" trigger="click" @select="(key: string) => handlePageMenuSelect(key, item)">
                                <div class="page-link" :class="{ active: activeDocId === item.pageId }">
                                    <span class="page-emoji">{{ item.emoji }}</span>
                                    <span class="page-title">{{ item.title }}</span>
                                </div>
                            </NDropdown>
                        </template>
                    </div>
                </div>

                <!-- Shared with me -->
                <div v-if="sharedPages?.length" class="sidebar-section">
                    <div class="section-label">与我共享</div>
                    <div class="section-items">
                        <router-link
                            v-for="item in sharedPages"
                            :key="item.pageId"
                            :to="`/doc/${item.pageId}`"
                            class="page-link"
                            :class="{ active: activeDocId === item.pageId }"
                            :title="item.title"
                        >
                            <span class="page-emoji">{{ item.emoji }}</span>
                            <span class="page-title">{{ item.title }}</span>
                            <Share2 :size="12" class="page-icon" />
                        </router-link>
                    </div>
                </div>

                <!-- Trash -->
                <div class="sidebar-section">
                    <div class="section-label section-label-clickable" @click="showTrash = !showTrash">
                        <Trash2 :size="12" class="trash-icon" />
                        <span>回收站</span>
                        <span v-if="trashPages?.length" class="trash-count">{{ trashPages.length }}</span>
                        <ChevronRight :size="14" class="folder-chevron" :class="{ rotated: showTrash }" />
                    </div>
                    <div v-if="showTrash" class="section-items">
                        <template v-for="item in trashPages" :key="item.pageId">
                            <NDropdown :options="trashMenuOptions" placement="right" trigger="click" @select="(key: string) => handleTrashMenuSelect(key, item)">
                                <div class="page-link trash-link">
                                    <span class="page-emoji">{{ item.emoji }}</span>
                                    <span class="page-title">{{ item.title }}</span>
                                </div>
                            </NDropdown>
                        </template>
                        <div v-if="!trashPages?.length" class="trash-empty">回收站为空</div>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="sidebar-footer">
                <div class="user-section">
                    <div class="user-avatar">{{ userInitial }}</div>
                    <div class="user-info" @click="handleConfetti">
                        <span class="user-name">{{ currentUser?.username || '用户' }}</span>
                        <span class="user-status">
                            <Sparkles :size="10" />
                            庆祝一下
                        </span>
                    </div>
                    <NDropdown :options="userMenuOptions" placement="top-end" trigger="click" @select="handleUserMenuSelect">
                        <NButton quaternary size="tiny" class="user-more-btn">
                            <template #icon><MoreHorizontal :size="16" /></template>
                        </NButton>
                    </NDropdown>
                </div>
            </div>
        </NLayoutSider>

        <NLayoutContent content-style="padding: 0; overflow-y: auto;">
            <router-view />
        </NLayoutContent>

        <!-- Dialogs -->
        <SearchDialog v-model:open="searchOpen" :on-open-change="(v: boolean) => searchOpen = v" />
        <SettingsDialog v-model:open="settingsOpen" :on-open-change="(v: boolean) => settingsOpen = v" :username="currentUser?.username" />
        <AboutDialog v-model:open="aboutOpen" :on-open-change="(v: boolean) => aboutOpen = v" />
    </NLayout>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { useMessage } from 'naive-ui'
import {
    NLayout, NLayoutSider, NLayoutContent, NIcon, NButton, NDropdown, NTooltip,
} from 'naive-ui'
import {
    Search, FileStack, Waypoints, Plus, FolderPlus, MoreHorizontal,
    Settings, MessageCircleQuestion, LogOut, Star, Clock, Share2,
    Trash2, RotateCcw, ChevronRight, Sparkles,
} from 'lucide-vue-next'
import * as srv from '@/services'
import { randomEmoji } from '@/utils/randomEmoji'
import { queryClient } from '@/utils/query-client'
import type { Page } from '@/types/page'
import type { Folder } from '@/types/api'
import SearchDialog from '@/components/LayoutAside/SearchDialog.vue'
import SettingsDialog from '@/components/LayoutAside/SettingsDialog.vue'
import AboutDialog from '@/components/LayoutAside/AboutDialog.vue'

const router = useRouter()
const route = useRoute()
const message = useMessage()

const searchOpen = ref(false)
const settingsOpen = ref(false)
const aboutOpen = ref(false)
const showTrash = ref(false)
const openFolders = ref<Record<string, boolean>>({})

const activeDocId = computed(() => {
    const match = route.path.match(/^\/doc\/(.+)/)
    return match ? match[1] : null
})

const { data: pages, refetch: refetchPages } = useQuery({
    queryKey: ['pages'],
    queryFn: async () => (await srv.fetchPageList()).data.pages,
})

const { data: trashPages } = useQuery({
    queryKey: ['trash'],
    queryFn: async () => (await srv.fetchTrashList()).data,
})

const { data: recentPages } = useQuery({
    queryKey: ['recentPages'],
    queryFn: async () => (await srv.fetchRecentPages()).data,
})

const { data: folders } = useQuery({
    queryKey: ['folders'],
    queryFn: async () => (await srv.fetchFolders()).data,
})

const { data: sharedPages } = useQuery({
    queryKey: ['sharedPages'],
    queryFn: async () => (await srv.fetchSharedPages()).data,
})

const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => (await srv.currentUser()).data,
})

const favoritePages = computed(() => (pages.value || []).filter((p: Page) => p.isFavorite))
const normalPages = computed(() => (pages.value || []).filter((p: Page) => !p.isFavorite))
const rootPages = computed(() => normalPages.value.filter((p: Page) => !p.folderId))
const folderList = computed(() => folders.value || [])

const userInitial = computed(() => {
    const name = currentUser.value?.username
    return name ? name.charAt(0).toUpperCase() : 'U'
})

function folderPages(folderId: string) {
    return normalPages.value.filter((p: Page) => p.folderId === folderId)
}

function toggleFolder(id: string) {
    openFolders.value[id] = !openFolders.value[id]
}

async function handleCreate() {
    const res = await srv.createPage({ emoji: randomEmoji(), title: '未命名文档' })
    router.push(`/doc/${res.data.pageId}`)
    refetchPages()
}

async function handleCreateFolder() {
    const name = prompt('请输入文件夹名称')
    if (!name?.trim()) return
    await srv.createFolder({ name: name.trim() })
    queryClient.invalidateQueries({ queryKey: ['folders'] })
    message.success('文件夹已创建')
}

async function handleDelete(pageId: string) {
    await srv.removePage(pageId)
    queryClient.invalidateQueries({ queryKey: ['pages'] })
    queryClient.invalidateQueries({ queryKey: ['trash'] })
    message.success('文档已移至回收站')
    if (activeDocId.value === pageId) {
        router.push('/doc')
    }
}

async function handleToggleFavorite(pageId: string) {
    await srv.toggleFavorite(pageId)
    queryClient.invalidateQueries({ queryKey: ['pages'] })
}

async function handleRestore(pageId: string) {
    await srv.restorePage(pageId)
    queryClient.invalidateQueries({ queryKey: ['pages'] })
    queryClient.invalidateQueries({ queryKey: ['trash'] })
    message.success('文档已恢复')
}

async function handlePermanentDelete(pageId: string) {
    await srv.permanentDeletePage(pageId)
    queryClient.invalidateQueries({ queryKey: ['trash'] })
    message.success('文档已永久删除')
}

async function handleDeleteFolder(folderId: string) {
    await srv.deleteFolder(folderId)
    queryClient.invalidateQueries({ queryKey: ['folders'] })
    queryClient.invalidateQueries({ queryKey: ['pages'] })
    message.success('文件夹已删除')
}

function handleConfetti() {
    import('canvas-confetti').then((m) => {
        m.default({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
    })
}

function handleLogout() {
    localStorage.removeItem('token')
    router.push('/account/login')
}

// Keyboard shortcut for search
function handleKeydown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        searchOpen.value = true
    }
}
if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleKeydown)
}

// NDropdown menu options
const pageMenuOptions = [
    { label: '收藏', key: 'favorite', icon: () => h(Star, { size: 14 }) },
    { type: 'divider' as const },
    { label: '新标签页打开', key: 'new-tab', icon: () => h(Share2, { size: 14 }) },
    { type: 'divider' as const },
    { label: '删除', key: 'delete', icon: () => h(Trash2, { size: 14 }) },
]

const folderMenuOptions = [
    { label: '删除文件夹', key: 'delete-folder', icon: () => h(Trash2, { size: 14 }) },
]

const trashMenuOptions = [
    { label: '恢复', key: 'restore', icon: () => h(RotateCcw, { size: 14 }) },
    { type: 'divider' as const },
    { label: '永久删除', key: 'permanent-delete', icon: () => h(Trash2, { size: 14 }) },
]

const userMenuOptions = [
    { label: '设置', key: 'settings', icon: () => h(Settings, { size: 14 }) },
    { label: '关于', key: 'about', icon: () => h(MessageCircleQuestion, { size: 14 }) },
    { type: 'divider' as const },
    { label: '退出登录', key: 'logout', icon: () => h(LogOut, { size: 14 }) },
]

function handleUserMenuSelect(key: string) {
    if (key === 'settings') settingsOpen.value = true
    else if (key === 'about') aboutOpen.value = true
    else if (key === 'logout') handleLogout()
}

function handlePageMenuSelect(key: string, item: Page) {
    switch (key) {
        case 'favorite':
            handleToggleFavorite(item.pageId)
            break
        case 'new-tab':
            window.open(`/doc/${item.pageId}`, '_blank')
            break
        case 'delete':
            handleDelete(item.pageId)
            break
    }
}

function handleFolderMenuSelect(key: string, folder: Folder) {
    if (key === 'delete-folder') {
        handleDeleteFolder(folder.folderId)
    }
}

function handleTrashMenuSelect(key: string, item: Page) {
    switch (key) {
        case 'restore':
            handleRestore(item.pageId)
            break
        case 'permanent-delete':
            handlePermanentDelete(item.pageId)
            break
    }
}
</script>

<style scoped>
.sidebar-header {
    display: flex;
    align-items: center;
    height: 56px;
    padding: 0 16px;
    border-bottom: 1px solid hsl(var(--border));
    flex-shrink: 0;
}

.brand-link {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
    color: hsl(var(--foreground));
}

.brand-logo {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: hsl(var(--foreground));
    color: hsl(var(--background));
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.brand-text {
    font-size: 16px;
    font-weight: 650;
    letter-spacing: -0.02em;
}

.sidebar-search {
    padding: 8px 12px;
    flex-shrink: 0;
}

.search-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    height: 32px;
    background: hsl(var(--muted));
    border-radius: 6px;
    padding: 0 10px;
    cursor: pointer;
    transition: background 0.15s;
    box-sizing: border-box;
}

.search-btn:hover {
    background: hsl(var(--border));
}

.search-icon {
    color: hsl(var(--muted-foreground));
    flex-shrink: 0;
}

.search-text {
    color: hsl(var(--muted-foreground));
    font-size: 13px;
    flex: 1;
}

.search-kbd {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 18px;
    min-width: 24px;
    padding: 0 5px;
    border-radius: 4px;
    border: 1px solid hsl(var(--border));
    background: hsl(var(--background));
    font-family: inherit;
    font-size: 10px;
    color: hsl(var(--muted-foreground));
}

.sidebar-nav {
    padding: 4px 8px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    border-bottom: 1px solid hsl(var(--border));
    flex-shrink: 0;
}

.nav-link {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 7px 10px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    color: hsl(var(--foreground));
    text-decoration: none;
    transition: background-color 0.15s;
}

.nav-link:hover {
    background: hsl(var(--muted));
}

.nav-link.active {
    background: hsl(var(--muted));
    font-weight: 600;
}

.nav-icon {
    color: hsl(var(--muted-foreground));
    flex-shrink: 0;
}

.sidebar-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 8px 0;
}

.sidebar-scroll::-webkit-scrollbar {
    width: 4px;
}

.sidebar-scroll::-webkit-scrollbar-thumb {
    background: transparent;
    border-radius: 4px;
}

.sidebar-scroll:hover::-webkit-scrollbar-thumb {
    background: hsl(var(--border));
}

.sidebar-section {
    padding: 4px 0;
}

.section-label {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    font-size: 11px;
    font-weight: 600;
    color: hsl(var(--muted-foreground));
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.section-label-with-actions {
    justify-content: space-between;
}

.section-actions {
    display: flex;
    gap: 2px;
    opacity: 0;
    transition: opacity 0.15s;
}

.section-label-with-actions:hover .section-actions {
    opacity: 1;
}

.section-label-clickable {
    cursor: pointer;
    transition: color 0.15s;
}

.section-label-clickable:hover {
    color: hsl(var(--foreground));
}

.section-items {
    display: flex;
    flex-direction: column;
    gap: 1px;
}

.page-link {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 5px 14px 5px 32px;
    font-size: 14px;
    color: hsl(var(--foreground));
    text-decoration: none;
    border-radius: 0;
    transition: background-color 0.1s;
    cursor: pointer;
    position: relative;
}

.page-link:hover {
    background: hsl(var(--muted));
}

.page-link.active {
    background: hsl(var(--secondary));
    font-weight: 500;
}

.page-emoji {
    font-size: 15px;
    line-height: 1;
    flex-shrink: 0;
}

.page-title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    font-size: 13.5px;
}

.page-icon {
    color: hsl(var(--muted-foreground));
    flex-shrink: 0;
    opacity: 0.6;
}

.page-star {
    color: #f59e0b;
    fill: #f59e0b;
    width: 12px;
    height: 12px;
    flex-shrink: 0;
}

.folder-group {
    margin: 0;
}

.folder-header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 5px 14px 5px 20px;
    cursor: pointer;
    font-size: 14px;
    color: hsl(var(--foreground));
    transition: background-color 0.1s;
}

.folder-header:hover {
    background: hsl(var(--muted));
}

.folder-chevron {
    transition: transform 0.15s;
    color: hsl(var(--muted-foreground));
    flex-shrink: 0;
}

.folder-chevron.rotated {
    transform: rotate(90deg);
}

.folder-emoji {
    font-size: 15px;
    line-height: 1;
}

.folder-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    font-size: 13.5px;
}

.folder-count {
    font-size: 11px;
    color: hsl(var(--muted-foreground));
    background: hsl(var(--muted));
    padding: 0 6px;
    border-radius: 8px;
    line-height: 18px;
}

.folder-more {
    opacity: 0;
    transition: opacity 0.1s;
}

.folder-header:hover .folder-more {
    opacity: 1;
}

.folder-page-link {
    padding-left: 52px;
}

.trash-link {
    opacity: 0.55;
}

.trash-count {
    font-size: 10px;
    background: hsl(var(--muted));
    border-radius: 8px;
    padding: 1px 6px;
    color: hsl(var(--muted-foreground));
    line-height: 16px;
}

.trash-empty {
    padding: 8px 32px;
    font-size: 12px;
    color: hsl(var(--muted-foreground));
}

.trash-icon {
    width: 12px;
    height: 12px;
    flex-shrink: 0;
}

.sidebar-footer {
    border-top: 1px solid hsl(var(--border));
    padding: 10px 12px;
    flex-shrink: 0;
}

.user-section {
    display: flex;
    align-items: center;
    gap: 8px;
}

.user-avatar {
    width: 30px;
    height: 30px;
    border-radius: 7px;
    background: hsl(var(--accent));
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 600;
    flex-shrink: 0;
}

.user-info {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
    cursor: pointer;
    padding: 2px 0;
}

.user-name {
    font-size: 13px;
    font-weight: 600;
    color: hsl(var(--foreground));
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 1.3;
}

.user-status {
    font-size: 11px;
    color: hsl(var(--muted-foreground));
    display: flex;
    align-items: center;
    gap: 3px;
    line-height: 1.3;
}

.user-more-btn {
    opacity: 0;
    transition: opacity 0.15s;
}

.user-section:hover .user-more-btn {
    opacity: 1;
}
</style>
