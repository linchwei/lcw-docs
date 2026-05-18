import { onMounted, onUnmounted } from 'vue'

import { useLcwDocEditor } from '../editor/inject'

export function useOnUploadEnd(callback: (blockId?: string) => void) {
    const editor = useLcwDocEditor()

    let cleanup: (() => void) | undefined

    onMounted(() => {
        cleanup = editor.onUploadEnd(callback)
    })

    onUnmounted(() => {
        cleanup?.()
    })
}
