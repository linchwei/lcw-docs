import { BlockSchema, InlineContentSchema, LcwDocEditor, StyleSchema } from '@lcw-doc/core'
import { ReactElement } from 'react'

import { DefaultReactSuggestionItem } from '../components/SuggestionMenu/types'

export function createAISlashMenuItem<BSchema extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema>(
    editor: LcwDocEditor<BSchema, I, S>,
    options: {
        onInsert: (blockId: string) => void
        icon?: ReactElement
    }
): DefaultReactSuggestionItem {
    return {
        title: 'AI',
        subtext: 'AI，让进取的人更具职业价值',
        onItemClick: () => {
            const currentBlock = editor.getTextCursorPosition().block
            const insertedBlocks = editor.insertBlocks([{ type: 'paragraph' as any }], currentBlock, 'after')
            const aiAnchorBlockId = insertedBlocks[0].id
            options.onInsert(aiAnchorBlockId)
        },
        aliases: ['ai', 'alert', 'notification', 'emphasize', 'warning', 'error', 'info', 'success'],
        icon: options.icon,
    }
}
