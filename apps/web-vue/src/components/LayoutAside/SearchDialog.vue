<template>
    <NModal v-model:show="modelOpen" preset="card" style="width: 560px" title="搜索文档" @update:show="onOpenChange">
        <div class="search-container">
            <div class="search-input-wrapper">
                <NInput
                    v-model:value="query"
                    placeholder="搜索文档标题或内容..."
                    :clearable="true"
                    autofocus
                    @keyup.enter="selectFirst"
                />
            </div>

            <div class="search-results">
                <div v-if="displayResults.length > 0" class="results-list">
                    <div
                        v-for="item in displayResults"
                        :key="item.pageId"
                        class="result-item"
                        @click="handleSelect(item.pageId)"
                    >
                        <span class="result-emoji">{{ item.emoji || '📄' }}</span>
                        <div class="result-info">
                            <div class="result-title">{{ item.title }}</div>
                            <div v-if="item.snippet" class="result-snippet">{{ item.snippet }}</div>
                        </div>
                    </div>
                </div>
                <div v-else class="results-empty">
                    {{ isSearchMode ? '未找到匹配文档' : '输入关键词搜索文档内容' }}
                </div>
            </div>
        </div>
    </NModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { NModal, NInput } from 'naive-ui'
import { useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import * as srv from '@/services'

interface Props {
    open: boolean
    onOpenChange: (open: boolean) => void
}

const props = defineProps<Props>()
const emit = defineEmits<{
    'update:open': [value: boolean]
}>()

const router = useRouter()
const modelOpen = computed({
    get: () => props.open,
    set: (val: boolean) => {
        emit('update:open', val)
        props.onOpenChange(val)
    },
})

const query = ref('')
const debouncedQuery = ref('')

let debounceTimer: ReturnType<typeof setTimeout> | null = null
watch(query, (val) => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
        debouncedQuery.value = val
    }, 300)
})

const isSearchMode = computed(() => debouncedQuery.value.trim().length > 0)

const { data: pages } = useQuery({
    queryKey: ['pages'],
    queryFn: async () => (await srv.fetchPageList()).data.pages,
})

const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: async () => {
        const res = await srv.searchPages(debouncedQuery.value)
        return res.data || []
    },
    enabled: isSearchMode,
})

const titleFiltered = computed(() => {
    if (!pages.value) return []
    if (!query.value.trim()) return pages.value
    return pages.value.filter((p: any) => p.title.toLowerCase().includes(query.value.toLowerCase()))
})

const displayResults = computed(() => {
    if (isSearchMode.value) return searchResults.value
    return titleFiltered.value.map((p: any) => ({
        pageId: p.pageId,
        emoji: p.emoji,
        title: p.title,
        snippet: '',
        updatedAt: p.updatedAt,
        matchType: 'title',
    }))
})

function handleSelect(pageId: string) {
    modelOpen.value = false
    query.value = ''
    debouncedQuery.value = ''
    router.push(`/doc/${pageId}`)
}

function selectFirst() {
    if (displayResults.value.length > 0) {
        handleSelect(displayResults.value[0].pageId)
    }
}

watch(() => props.open, (val) => {
    if (!val) {
        query.value = ''
        debouncedQuery.value = ''
    }
})
</script>

<style scoped>
.search-container {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.search-input-wrapper {
    width: 100%;
}

.search-results {
    max-height: 320px;
    overflow-y: auto;
}

.results-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.result-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.15s;
}

.result-item:hover {
    background-color: #f5f5f4;
}

.result-emoji {
    font-size: 16px;
    flex-shrink: 0;
    margin-top: 1px;
}

.result-info {
    flex: 1;
    min-width: 0;
}

.result-title {
    font-size: 14px;
    color: #37352f;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.result-snippet {
    font-size: 12px;
    color: #9b9a97;
    margin-top: 2px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.results-empty {
    padding: 32px 0;
    text-align: center;
    font-size: 14px;
    color: #9b9a97;
}
</style>
