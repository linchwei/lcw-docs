import type { BlockSchema, InlineContentSchema, LcwDocEditor, StyleSchema } from '@lcw-doc/core'
import { defineStore } from 'pinia'
import { ref } from 'vue'

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
