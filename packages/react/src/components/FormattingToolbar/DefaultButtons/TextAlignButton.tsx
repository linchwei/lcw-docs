import {
    BlockSchema,
    checkBlockHasDefaultProp,
    checkBlockTypeHasDefaultProp,
    DefaultProps,
    InlineContentSchema,
    StyleSchema,
} from '@lcw-doc/core'
import { IconType } from 'react-icons'
import { RiAlignCenter, RiAlignJustify, RiAlignLeft, RiAlignRight } from 'react-icons/ri'

import { useComponentsContext } from '../../../editor/ComponentsContext'
import { useLcwDocEditor } from '../../../hooks/useLcwDocEditor'
import { useSelectedBlocks } from '../../../hooks/useSelectedBlocks'
import { useDictionary } from '../../../i18n/dictionary'

type TextAlignment = DefaultProps['textAlignment']

const icons: Record<TextAlignment, IconType> = {
    left: RiAlignLeft,
    center: RiAlignCenter,
    right: RiAlignRight,
    justify: RiAlignJustify,
}

export const TextAlignButton = (props: { textAlignment: TextAlignment }) => {
    const Components = useComponentsContext()!
    const dict = useDictionary()

    const editor = useLcwDocEditor<BlockSchema, InlineContentSchema, StyleSchema>()

    const selectedBlocks = useSelectedBlocks(editor)

    const textAlignment = (() => {
        const block = selectedBlocks[0]

        if (checkBlockHasDefaultProp('textAlignment', block, editor)) {
            return block.props.textAlignment
        }

        return
    })()

    const setTextAlignment = (textAlignment: TextAlignment) => {
        editor.focus()

        for (const block of selectedBlocks) {
            if (checkBlockTypeHasDefaultProp('textAlignment', block.type, editor)) {
                editor.updateBlock(block, {
                    props: { textAlignment: textAlignment },
                })
            }
        }
    }

    const show = !!selectedBlocks.find(block => 'textAlignment' in block.props)

    if (!show || !editor.isEditable) {
        return null
    }

    const Icon: IconType = icons[props.textAlignment]
    return (
        <Components.FormattingToolbar.Button
            className={'bn-button'}
            data-test={`alignText${props.textAlignment.slice(0, 1).toUpperCase() + props.textAlignment.slice(1)}`}
            onClick={() => setTextAlignment(props.textAlignment)}
            isSelected={textAlignment === props.textAlignment}
            label={dict.formatting_toolbar[`align_${props.textAlignment}`].tooltip}
            mainTooltip={dict.formatting_toolbar[`align_${props.textAlignment}`].tooltip}
            icon={<Icon />}
        />
    )
}
