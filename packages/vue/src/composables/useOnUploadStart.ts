import { onMounted, onUnmounted } from 'vue'

import { useLcwDocEditor } from '../editor/inject'

export function useOnUploadStart(callback: (blockId?: string) => void) {
    const editor = useLcwDocEditor()

    let cleanup: (() => void) | undefined

    onMounted(() => {
        cleanup = editor.onUploadStart(callback)
    })

    onUnmounted(() => {
        cleanup?.()
    })
}
