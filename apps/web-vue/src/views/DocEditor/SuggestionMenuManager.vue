<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'
import { filterSuggestionItems, getDefaultSlashMenuItems } from '@lcw-doc/core'
import { useLcwDocEditor } from '@lcw-doc/vue'
import type { LcwDocEditor } from '@lcw-doc/core'

const props = defineProps<{
    mentionQuery: (query: string) => Promise<any[]>
}>()

const editor = useLcwDocEditor()!

const slashMenuItems = computed(() => {
    return getDefaultSlashMenuItems(editor)
})

editor.suggestionMenus.addTriggerCharacter('/')
editor.suggestionMenus.addTriggerCharacter('@')

const items = ref<any[]>([])
const selectedIndex = ref(0)
const style = ref<Record<string, string>>({ display: 'none' })

function updateItems(query: string) {
    items.value = filterSuggestionItems(slashMenuItems.value, query)
}

function subscribeTrigger(trigger: string) {
    editor.suggestionMenus.onUpdate(trigger, (state: any) => {
        nextTick(() => {
            if (state?.show && state.referencePos) {
                style.value = {
                    position: 'fixed',
                    left: state.referencePos.x + 'px',
                    top: (state.referencePos.y + 24) + 'px',
                    zIndex: '2000',
                }
                if (trigger === '/') {
                    updateItems(state.query || '')
                } else if (trigger === '@') {
                    props.mentionQuery(state.query || '').then(r => {
                        items.value = r
                    })
                }
            } else {
                style.value = { display: 'none' }
                items.value = []
            }
        })
    })
}

subscribeTrigger('/')
subscribeTrigger('@')

const showMenu = computed(() => items.value.length > 0)

function handleItemClick(item: any) {
    editor.suggestionMenus.closeMenu()
    editor.suggestionMenus.clearQuery()
    item.onItemClick(editor)
}
</script>

<template>
    <div
        v-if="showMenu"
        :style="style"
        class="bn-suggestion-menu"
        id="bn-suggestion-menu"
    >
        <div
            v-for="(item, idx) in items"
            :key="item.title || idx"
            class="bn-suggestion-menu-item"
            :class="{ 'bn-selected': idx === selectedIndex }"
            @click="handleItemClick(item)"
        >
            <span v-if="item.icon" class="bn-suggestion-menu-item-icon">
                <span v-if="typeof item.icon === 'string'">{{ item.icon }}</span>
                <component :is="item.icon" v-else />
            </span>
            <div class="bn-suggestion-menu-item-content">
                <div class="bn-suggestion-menu-item-title">{{ item.title }}</div>
                <div v-if="item.subtext" class="bn-suggestion-menu-item-subtext">{{ item.subtext }}</div>
            </div>
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
</style>
