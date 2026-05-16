<script setup lang="ts">
import { ref, watch, onUnmounted, useAttrs } from 'vue'
import type { LcwDocEditor, BlockSchema, InlineContentSchema, StyleSchema } from '@lcw-doc/core'

import { usePrefersColorScheme } from '../composables/usePrefersColorScheme'
import { provideEditorContext } from './editorContext'
import { provideLcwDocEditor } from './inject'
import EditorContent from './EditorContent.vue'
import ElementRenderer from './ElementRenderer.vue'
import LcwDocDefaultUI from './LcwDocDefaultUI.vue'

export interface LcwDocViewProps {
    editor: LcwDocEditor<BlockSchema, InlineContentSchema, StyleSchema>
    theme?: 'light' | 'dark'
    editable?: boolean
    onSelectionChange?: () => void
    onChange?: () => void
    formattingToolbar?: boolean
    linkToolbar?: boolean
    slashMenu?: boolean
    sideMenu?: boolean
    filePanel?: boolean
    tableHandles?: boolean
    emojiPicker?: boolean
}

const props = defineProps<LcwDocViewProps>()
const emit = defineEmits<{
    selectionChange: []
    change: []
}>()
const attrs = useAttrs()

provideEditorContext(props.editor)
provideLcwDocEditor(props.editor)

const containerRef = ref<HTMLDivElement>()
const prefersColorScheme = usePrefersColorScheme()
const editorColorScheme = ref<'light' | 'dark' | 'no-preference'>('no-preference')
const contentEditableAttrs = ref<Record<string, string>>({})

watch(() => props.theme || prefersColorScheme.value, (val) => {
    editorColorScheme.value = val
}, { immediate: true })

watch(() => props.editable, (val) => {
    if (val === undefined) {
        contentEditableAttrs.value = {}
    } else {
        contentEditableAttrs.value = { contenteditable: val ? 'true' : 'false' }
    }
    if (val !== undefined) {
        props.editor.isEditable = val
    }
}, { immediate: true })

// 事件订阅管理
let onChangeCleanup: (() => void) | undefined
let onSelectionChangeCleanup: (() => void) | undefined

watch(() => props.onChange, (cb) => {
    onChangeCleanup?.()
    onChangeCleanup = cb ? props.editor.onChange(cb) : undefined
}, { immediate: true })

watch(() => props.onSelectionChange, (cb) => {
    onSelectionChangeCleanup?.()
    onSelectionChangeCleanup = cb ? props.editor.onSelectionChange(cb) : undefined
}, { immediate: true })

onUnmounted(() => {
    onChangeCleanup?.()
    onSelectionChangeCleanup?.()
})

const { class: _className, ...restAttrs } = attrs as Record<string, any>
</script>

<template>
    <ElementRenderer :editor="editor" />
    <EditorContent v-if="!editor.headless" :editor="editor">
        <div
            ref="containerRef"
            :class="['bn-container', editorColorScheme, attrs.class as string || '']"
            :data-color-scheme="editorColorScheme"
            v-bind="restAttrs"
        >
            <div
                aria-autocomplete="list"
                aria-haspopup="listbox"
                :ref="(el: any) => editor.mount(el)"
                v-bind="contentEditableAttrs"
            />
            <LcwDocDefaultUI
                :formatting-toolbar="formattingToolbar"
                :link-toolbar="linkToolbar"
                :slash-menu="slashMenu"
                :emoji-picker="emojiPicker"
                :side-menu="sideMenu"
                :file-panel="filePanel"
                :table-handles="tableHandles"
            >
                <slot />
            </LcwDocDefaultUI>
        </div>
    </EditorContent>
</template>
