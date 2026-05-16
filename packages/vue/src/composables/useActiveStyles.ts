import { ref, onMounted } from 'vue'
import type { LcwDocEditor, StyleSchema } from '@lcw-doc/core'
import { injectEditor } from '../editor/inject'
import { useEditorChange } from './useEditorChange'
import { useEditorSelectionChange } from './useEditorSelectionChange'

export function useActiveStyles<T extends StyleSchema>(editor?: LcwDocEditor<any, any, T>) {
    const contextEditor = injectEditor() as LcwDocEditor<any, any, T> | null
    const resolvedEditor = editor || contextEditor

    if (!resolvedEditor) {
        throw new Error("'editor' is required, either from provideLcwDocEditor or as a function argument")
    }

    const e = resolvedEditor
    const styles = ref<Record<string, any>>(e.getActiveStyles())

    onMounted(() => {
        styles.value = e.getActiveStyles()
    })

    useEditorChange(() => {
        styles.value = e.getActiveStyles()
    }, e)

    useEditorSelectionChange(() => {
        styles.value = e.getActiveStyles()
    }, e)

    return styles
}
