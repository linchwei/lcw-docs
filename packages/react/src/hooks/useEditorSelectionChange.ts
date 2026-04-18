import type { LcwDocEditor } from '@lcw-doc/core'
import { useEffect } from 'react'

import { useLcwDocContext } from '../editor/LcwDocContext'

export function useEditorSelectionChange(callback: () => void, editor?: LcwDocEditor<any, any, any>) {
    const editorContext = useLcwDocContext()
    if (!editor) {
        editor = editorContext?.editor
    }

    useEffect(() => {
        if (!editor) {
            throw new Error("'editor' is required, either from LcwDocContext or as a function argument")
        }
        return editor.onSelectionChange(callback)
    }, [callback, editor])
}
