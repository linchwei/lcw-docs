import type { LcwDocEditor } from '@lcw-doc/core'
import { onMounted, onUnmounted } from 'vue'

import { injectEditor } from '../editor/inject'

export function useEditorChange(callback: () => void, editor?: LcwDocEditor<any, any, any>) {
    const contextEditor = injectEditor()
    const resolvedEditor = editor || contextEditor

    if (!resolvedEditor) {
        throw new Error("'editor' is required, either from provideLcwDocEditor or as a function argument")
    }

    let cleanup: (() => void) | undefined

    onMounted(() => {
        cleanup = resolvedEditor.onChange(callback)
    })

    onUnmounted(() => {
        cleanup?.()
    })
}
