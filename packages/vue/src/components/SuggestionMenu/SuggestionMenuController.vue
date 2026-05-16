<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { filterSuggestionItems, getDefaultSlashMenuItems } from '@lcw-doc/core'
import { useLcwDocEditor } from '../../editor/inject'
import { useUIElementPositioning } from '../../composables/useUIElementPositioning'
import { useUIPluginState } from '../../composables/useUIPluginState'

const props = withDefaults(defineProps<{
    triggerCharacter: string
    getItems?: (query: string) => Promise<any[]>
}>(), {})

const editor = useLcwDocEditor()

const getItemsOrDefault = props.getItems || (
    async (query: string) => {
        if (!editor) return []
        return filterSuggestionItems(getDefaultSlashMenuItems(editor as any), query)
    }
)

const callbacks = {
    closeMenu: editor!.suggestionMenus.closeMenu,
    clearQuery: editor!.suggestionMenus.clearQuery,
}

const cb = (callback: (state: any) => void) => {
    return editor!.suggestionMenus.onUpdate(props.triggerCharacter, callback)
}

const state = useUIPluginState(cb)

// Load items asynchronously
const items = ref<any[]>([])
const loadingState = ref<'loading-initial' | 'loading' | 'loaded'>('loading-initial')
const usedQuery = ref<string | undefined>(undefined)
let cancelled = false

const currentQuery = computed(() => state.value?.query || '')

watch(currentQuery, async (query) => {
    cancelled = false
    const thisQuery = query
    loadingState.value = 'loading'

    try {
        const result = await getItemsOrDefault(query)
        if (cancelled) return
        items.value = result
        usedQuery.value = thisQuery
        loadingState.value = 'loaded'
    } catch {
        if (cancelled) return
        items.value = []
        loadingState.value = 'loaded'
    }
}, { immediate: true })

onUnmounted(() => { cancelled = true })

const effectiveLoadingState = computed(() => {
    if (usedQuery.value === undefined) return 'loading-initial' as const
    return loadingState.value
})

// Keyboard navigation
const selectedIndex = ref(0)

function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowUp') {
        event.preventDefault()
        if (items.value.length) {
            selectedIndex.value = (selectedIndex.value - 1 + items.value.length) % items.value.length
        }
        return true
    }

    if (event.key === 'ArrowDown') {
        event.preventDefault()
        if (items.value.length) {
            selectedIndex.value = (selectedIndex.value + 1) % items.value.length
        }
        return true
    }

    if (event.key === 'Enter' && !event.isComposing) {
        event.preventDefault()
        if (items.value.length) {
            const item = items.value[selectedIndex.value]
            callbacks.closeMenu()
            callbacks.clearQuery()
            item.onItemClick(editor)
        }
        return true
    }

    return false
}

onMounted(() => {
    const el = (editor as any).domElement as HTMLElement
    if (el) {
        el.addEventListener('keydown', handleKeyDown, true)
    }
})

onUnmounted(() => {
    const el = (editor as any).domElement as HTMLElement
    if (el) {
        el.removeEventListener('keydown', handleKeyDown, true)
    }
})

watch(currentQuery, () => {
    selectedIndex.value = 0
})

// Floating UI positioning
const showMenu = computed(() => state.value?.show || false)
const referencePos = computed(() => state.value?.referencePos || null)

const { isMounted, ref: floatingRef, style: menuStyle, getFloatingProps } = useUIElementPositioning(
    showMenu,
    referencePos,
    2000,
    {
        placement: 'bottom-start',
    }
)

const effectiveSelectedIndex = computed(() =>
    items.value.length === 0 ? undefined : selectedIndex.value
)

function handleItemClick(item: any) {
    callbacks.closeMenu()
    callbacks.clearQuery()
    item.onItemClick(editor)
}

function setFloatingRef(el: any) {
    floatingRef.value = el as HTMLElement | null
}
</script>

<template>
    <div
        v-if="isMounted && state"
        :ref="setFloatingRef"
        v-bind="getFloatingProps()"
        :style="{ ...menuStyle, zIndex: 2000 }"
        class="bn-suggestion-menu"
        id="bn-suggestion-menu"
    >
        <div
            v-for="(item, idx) in items"
            :key="item.title || idx"
            class="bn-suggestion-menu-item"
            :class="{ 'bn-selected': idx === effectiveSelectedIndex }"
            :id="`bn-suggestion-menu-item-${idx}`"
            @click="handleItemClick(item)"
        >
            <span v-if="item.icon" class="bn-suggestion-menu-item-icon">
                <component :is="item.icon" v-if="typeof item.icon === 'object'" />
                <span v-else>{{ item.icon }}</span>
            </span>
            <div class="bn-suggestion-menu-item-content">
                <div class="bn-suggestion-menu-item-title">{{ item.title }}</div>
                <div v-if="item.subtext" class="bn-suggestion-menu-item-subtext">{{ item.subtext }}</div>
            </div>
        </div>
        <div
            v-if="items.length === 0 && effectiveLoadingState !== 'loading-initial' && effectiveLoadingState !== 'loading'"
            class="bn-suggestion-menu-empty"
        >
            No items
        </div>
    </div>
</template>

<style scoped>
.bn-suggestion-menu {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.12);
    min-width: 200px;
    max-height: 300px;
    overflow-y: auto;
    padding: 4px;
}

.bn-suggestion-menu-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    border-radius: 4px;
    cursor: pointer;
}

.bn-suggestion-menu-item:hover,
.bn-suggestion-menu-item.bn-selected {
    background-color: #f3f4f6;
}

.bn-suggestion-menu-item-icon {
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
}

.bn-suggestion-menu-item-content {
    flex: 1;
    min-width: 0;
}

.bn-suggestion-menu-item-title {
    font-size: 14px;
    font-weight: 500;
    color: #374151;
}

.bn-suggestion-menu-item-subtext {
    font-size: 11px;
    color: #9ca3af;
    margin-top: 1px;
}

.bn-suggestion-menu-empty {
    padding: 8px;
    color: #9ca3af;
    font-size: 13px;
    text-align: center;
}
</style>
