import { Editor } from '@tiptap/core'
import { useEffect, useState } from 'react'

function useForceUpdate() {
    const [, setValue] = useState(0)

    return () => setValue(value => value + 1)
}

export const useEditorForceUpdate = (editor: Editor) => {
    const forceUpdate = useForceUpdate()

    useEffect(() => {
        const callback = () => {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    forceUpdate()
                })
            })
        }

        editor.on('transaction', callback)
        return () => {
            editor.off('transaction', callback)
        }
    }, [editor])
}
