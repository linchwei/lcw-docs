import { Block, BlockSchema, InlineContentSchema, LcwDocEditor, StyleSchema } from '@lcw-doc/core'
import { useState } from 'react'

import { useLcwDocContext } from '../editor/LcwDocContext'
import { useEditorContentOrSelectionChange } from './useEditorContentOrSelectionChange'

export function useSelectedBlocks<BSchema extends BlockSchema, ISchema extends InlineContentSchema, SSchema extends StyleSchema>(
    editor?: LcwDocEditor<BSchema, ISchema, SSchema>
) {
    const editorContext = useLcwDocContext<BSchema, ISchema, SSchema>()
    if (!editor) {
        editor = editorContext?.editor
    }

    if (!editor) {
        throw new Error("'editor' is required, either from LcwDocContext or as a function argument")
    }

    const e = editor

    const [selectedBlocks, setSelectedBlocks] = useState<Block<BSchema, ISchema, SSchema>[]>(
        () => e.getSelection()?.blocks || [e.getTextCursorPosition().block]
    )

    useEditorContentOrSelectionChange(() => setSelectedBlocks(e.getSelection()?.blocks || [e.getTextCursorPosition().block]), e)

    return selectedBlocks
}
