import { Block, BlockSchema, Dictionary, InlineContentSchema, StyleSchema } from '@lcw-doc/core'
import { useState } from 'react'
import type { IconType } from 'react-icons'
import { RiDoubleQuotesR, RiH1, RiH2, RiH3, RiListCheck3, RiListOrdered, RiListUnordered, RiText } from 'react-icons/ri'

import { ComponentProps, useComponentsContext } from '../../../editor/ComponentsContext'
import { useEditorContentOrSelectionChange } from '../../../hooks/useEditorContentOrSelectionChange'
import { useLcwDocEditor } from '../../../hooks/useLcwDocEditor'
import { useSelectedBlocks } from '../../../hooks/useSelectedBlocks'
import { useDictionary } from '../../../i18n/dictionary'

const HeadingIcon = ({ level }: { level: number }) => <span style={{ fontWeight: 700, fontSize: '14px', lineHeight: 1 }}>H{level}</span>

export type BlockTypeSelectItem = {
    name: string
    type: string
    props?: Record<string, boolean | number | string>
    icon: IconType
    isSelected: (block: Block<BlockSchema, InlineContentSchema, StyleSchema>) => boolean
}

export const blockTypeSelectItems = (dict: Dictionary): BlockTypeSelectItem[] => [
    {
        name: dict.slash_menu.paragraph.title,
        type: 'paragraph',
        icon: RiText,
        isSelected: block => block.type === 'paragraph',
    },
    {
        name: dict.slash_menu.heading.title,
        type: 'heading',
        props: { level: 1 },
        icon: RiH1,
        isSelected: block => block.type === 'heading' && 'level' in block.props && block.props.level === 1,
    },
    {
        name: dict.slash_menu.heading_2.title,
        type: 'heading',
        props: { level: 2 },
        icon: RiH2,
        isSelected: block => block.type === 'heading' && 'level' in block.props && block.props.level === 2,
    },
    {
        name: dict.slash_menu.heading_3.title,
        type: 'heading',
        props: { level: 3 },
        icon: RiH3,
        isSelected: block => block.type === 'heading' && 'level' in block.props && block.props.level === 3,
    },
    {
        name: dict.slash_menu.heading_4.title,
        type: 'heading',
        props: { level: 4 },
        icon: (() => {
            const H = () => <HeadingIcon level={4} />
            return H as any
        })(),
        isSelected: block => block.type === 'heading' && 'level' in block.props && block.props.level === 4,
    },
    {
        name: dict.slash_menu.heading_5.title,
        type: 'heading',
        props: { level: 5 },
        icon: (() => {
            const H = () => <HeadingIcon level={5} />
            return H as any
        })(),
        isSelected: block => block.type === 'heading' && 'level' in block.props && block.props.level === 5,
    },
    {
        name: dict.slash_menu.heading_6.title,
        type: 'heading',
        props: { level: 6 },
        icon: (() => {
            const H = () => <HeadingIcon level={6} />
            return H as any
        })(),
        isSelected: block => block.type === 'heading' && 'level' in block.props && block.props.level === 6,
    },
    {
        name: dict.slash_menu.bullet_list.title,
        type: 'bulletListItem',
        icon: RiListUnordered,
        isSelected: block => block.type === 'bulletListItem',
    },
    {
        name: dict.slash_menu.numbered_list.title,
        type: 'numberedListItem',
        icon: RiListOrdered,
        isSelected: block => block.type === 'numberedListItem',
    },
    {
        name: dict.slash_menu.check_list.title,
        type: 'checkListItem',
        icon: RiListCheck3,
        isSelected: block => block.type === 'checkListItem',
    },
    {
        name: '引用',
        type: 'blockquote',
        icon: RiDoubleQuotesR,
        isSelected: block => block.type === 'blockquote',
    },
]

export const BlockTypeSelect = (props: { items?: BlockTypeSelectItem[] }) => {
    const Components = useComponentsContext()!
    const dict = useDictionary()

    const editor = useLcwDocEditor<BlockSchema, InlineContentSchema, StyleSchema>()

    const selectedBlocks = useSelectedBlocks(editor)

    const [block, setBlock] = useState(editor.getTextCursorPosition().block)

    const filteredItems: BlockTypeSelectItem[] = (props.items || blockTypeSelectItems(dict)).filter(
        item => item.type in editor.schema.blockSchema
    )

    const shouldShow: boolean = filteredItems.find(item => item.type === block.type) !== undefined

    const fullItems: ComponentProps['FormattingToolbar']['Select']['items'] = (() => {
        const onClick = (item: BlockTypeSelectItem) => {
            editor.focus()

            for (const block of selectedBlocks) {
                editor.updateBlock(block, {
                    type: item.type as any,
                    props: item.props as any,
                })
            }
        }

        return filteredItems.map(item => {
            const Icon = item.icon

            return {
                text: item.name,
                icon: <Icon size={16} />,
                onClick: () => onClick(item),
                isSelected: item.isSelected(block),
            }
        })
    })()

    useEditorContentOrSelectionChange(() => {
        setBlock(editor.getTextCursorPosition().block)
    }, editor)

    if (!shouldShow || !editor.isEditable) {
        return null
    }

    return <Components.FormattingToolbar.Select className={'bn-select'} items={fullItems} />
}
