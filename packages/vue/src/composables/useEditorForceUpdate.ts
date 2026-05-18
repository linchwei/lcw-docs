import type { Editor } from '@tiptap/core'
import { onMounted, onUnmounted, shallowRef } from 'vue'

export const useEditorForceUpdate = (editor: Editor) => {
    const forceUpdateCounter = shallowRef(0)

    onMounted(() => {
        const callback = () => {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    forceUpdateCounter.value++
                })
            })
        }

        editor.on('transaction', callback)
        onUnmounted(() => {
            editor.off('transaction', callback)
        })
    })

    return forceUpdateCounter
}
