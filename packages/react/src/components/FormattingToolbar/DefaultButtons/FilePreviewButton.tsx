import {
    BlockSchema,
    checkBlockIsFileBlockWithPlaceholder,
    checkBlockIsFileBlockWithPreview,
    InlineContentSchema,
    StyleSchema,
} from '@lcw-doc/core'
import { RiImageAddFill } from 'react-icons/ri'

import { useComponentsContext } from '../../../editor/ComponentsContext'
import { useLcwDocEditor } from '../../../hooks/useLcwDocEditor'
import { useSelectedBlocks } from '../../../hooks/useSelectedBlocks'
import { useDictionary } from '../../../i18n/dictionary'

export const FilePreviewButton = () => {
    const dict = useDictionary()
    const Components = useComponentsContext()!

    const editor = useLcwDocEditor<BlockSchema, InlineContentSchema, StyleSchema>()

    const selectedBlocks = useSelectedBlocks(editor)

    const fileBlock = (() => {
        if (selectedBlocks.length !== 1) {
            return undefined
        }

        const block = selectedBlocks[0]

        if (checkBlockIsFileBlockWithPreview(block, editor)) {
            return block
        }

        return undefined
    })()

    const onClick = () => {
        if (fileBlock) {
            editor.updateBlock(fileBlock, {
                props: {
                    showPreview: !fileBlock.props.showPreview as any,
                },
            })
        }
    }

    if (!fileBlock || checkBlockIsFileBlockWithPlaceholder(fileBlock, editor) || !editor.isEditable) {
        return null
    }

    return (
        <Components.FormattingToolbar.Button
            className={'bn-button'}
            label={'Toggle preview'}
            mainTooltip={dict.formatting_toolbar.file_preview_toggle.tooltip}
            icon={<RiImageAddFill />}
            isSelected={fileBlock.props.showPreview}
            onClick={onClick}
        />
    )
}
