import {
    BlockSchema,
    DefaultBlockSchema,
    DefaultInlineContentSchema,
    DefaultStyleSchema,
    InlineContentSchema,
    StyleSchema,
} from '@lcw-doc/core'
import { MdDragIndicator } from 'react-icons/md'

import { useComponentsContext } from '../../../editor/ComponentsContext'
import { useDictionary } from '../../../i18n/dictionary'
import { SideMenuProps } from '../SideMenuProps'

function getBlockTypeIcon(block: any): React.ReactNode {
    switch (block.type) {
        case 'heading': {
            const level = block.props?.level || 1
            return <span className="text-[10px] font-bold text-blue-500">H{level}</span>
        }
        case 'bulletListItem':
            return (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-zinc-500"
                >
                    <line x1="8" y1="6" x2="21" y2="6"></line>
                    <line x1="8" y1="12" x2="21" y2="12"></line>
                    <line x1="8" y1="18" x2="21" y2="18"></line>
                    <line x1="3" y1="6" x2="3.01" y2="6"></line>
                    <line x1="3" y1="12" x2="3.01" y2="12"></line>
                    <line x1="3" y1="18" x2="3.01" y2="18"></line>
                </svg>
            )
        case 'numberedListItem':
            return (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-zinc-500"
                >
                    <line x1="10" y1="6" x2="21" y2="6"></line>
                    <line x1="10" y1="12" x2="21" y2="12"></line>
                    <line x1="10" y1="18" x2="21" y2="18"></line>
                    <path d="M4 6h1v4"></path>
                    <path d="M4 10h2"></path>
                    <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path>
                </svg>
            )
        case 'codeBlock':
            return (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-zinc-500"
                >
                    <polyline points="16 18 22 12 16 6"></polyline>
                    <polyline points="8 6 2 12 8 18"></polyline>
                </svg>
            )
        case 'paragraph':
            return <span className="text-[12px] font-bold text-blue-500">T</span>
        default:
            return <MdDragIndicator size={24} data-test="dragHandle" />
    }
}

export const DragHandleButton = <
    BSchema extends BlockSchema = DefaultBlockSchema,
    I extends InlineContentSchema = DefaultInlineContentSchema,
    S extends StyleSchema = DefaultStyleSchema,
>(
    props: Omit<SideMenuProps<BSchema, I, S>, 'addBlock'>
) => {
    const Components = useComponentsContext()!
    const dict = useDictionary()

    const blockIcon = getBlockTypeIcon(props.block)

    return (
        <Components.SideMenu.Button
            label={dict.side_menu.drag_handle_label}
            draggable={true}
            onDragStart={props.blockDragStart}
            onDragEnd={props.blockDragEnd}
            className={'bn-button'}
            icon={blockIcon}
        />
    )
}
