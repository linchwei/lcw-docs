import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { LcwDocEditor, BlockSchema, InlineContentSchema, StyleSchema } from '@lcw-doc/core'

export const useEditorStore = defineStore('editor', () => {
    const editor = ref<LcwDocEditor<BlockSchema, InlineContentSchema, StyleSchema> | null>(null)

    function setEditor(e: LcwDocEditor<BlockSchema, InlineContentSchema, StyleSchema>) {
        editor.value = e
    }

    function clearEditor() {
        editor.value = null
    }

    return { editor, setEditor, clearEditor }
})
