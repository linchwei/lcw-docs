import type { Block, BlockSchema, InlineContentSchema, LcwDocEditor, StyleSchema } from '@lcw-doc/core'
import { onMounted, ref } from 'vue'

import { injectEditor } from '../editor/inject'
import { useEditorContentOrSelectionChange } from './useEditorContentOrSelectionChange'

export function useSelectedBlocks<BSchema extends BlockSchema, ISchema extends InlineContentSchema, SSchema extends StyleSchema>(
    editor?: LcwDocEditor<BSchema, ISchema, SSchema>
) {
    const contextEditor = injectEditor() as LcwDocEditor<BSchema, ISchema, SSchema> | null
    const resolvedEditor = editor || contextEditor

    if (!resolvedEditor) {
        throw new Error("'editor' is required, either from provideLcwDocEditor or as a function argument")
    }

    const e = resolvedEditor
    const selectedBlocks = ref<Block<BSchema, ISchema, SSchema>[]>([])

    onMounted(() => {
        selectedBlocks.value = e.getSelection()?.blocks || [e.getTextCursorPosition().block]
    })

    useEditorContentOrSelectionChange(() => {
        selectedBlocks.value = e.getSelection()?.blocks || [e.getTextCursorPosition().block]
    }, e)

    return selectedBlocks
}
