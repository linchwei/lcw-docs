<script setup lang="ts">
import { ref, onMounted, onUnmounted, getCurrentInstance } from 'vue'
import type { LcwDocEditor, BlockSchema, InlineContentSchema, StyleSchema } from '@lcw-doc/core'

const props = defineProps<{
    editor: LcwDocEditor<BlockSchema, InlineContentSchema, StyleSchema>
}>()

const rendererCount = ref(0)

onMounted(() => {
    const editor = props.editor._tiptapEditor as any
    const instance = getCurrentInstance()

    editor.contentComponent = {
        setRenderer(_id: string, _renderer: any) {
            rendererCount.value++
        },
        removeRenderer(_id: string) {
            rendererCount.value++
        },
    }

    if (instance) {
        editor.appContext = {
            ...instance.appContext,
            provides: (instance as any).provides,
        }
    }

    queueMicrotask(() => {
        editor.createNodeViews()
    })
})

onUnmounted(() => {
    const editor = props.editor._tiptapEditor as any
    editor.contentComponent = null
    editor.appContext = null
})
</script>

<template>
    <slot />
</template>
