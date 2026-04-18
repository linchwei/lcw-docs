import { LcwDocEditor, StyleSchema } from '@lcw-doc/core'
import { useState } from 'react'

import { useLcwDocContext } from '../editor/LcwDocContext'
import { useEditorChange } from './useEditorChange'
import { useEditorSelectionChange } from './useEditorSelectionChange'

export function useActiveStyles<T extends StyleSchema>(editor?: LcwDocEditor<any, any, T>) {
    const editorContext = useLcwDocContext<any, any, T>()
    if (!editor) {
        editor = editorContext?.editor
    }

    if (!editor) {
        throw new Error("'editor' is required, either from LcwDocContext or as a function argument")
    }

    const e = editor

    const [styles, setStyles] = useState(() => e.getActiveStyles())

    useEditorChange(() => {
        setStyles(e.getActiveStyles())
    }, e)

    useEditorSelectionChange(() => {
        setStyles(e.getActiveStyles())
    }, e)

    return styles
}
