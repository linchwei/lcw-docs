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

export const DragHandleButton = <
    BSchema extends BlockSchema = DefaultBlockSchema,
    I extends InlineContentSchema = DefaultInlineContentSchema,
    S extends StyleSchema = DefaultStyleSchema,
>(
    props: Omit<SideMenuProps<BSchema, I, S>, 'addBlock'>
) => {
    const Components = useComponentsContext()!
    const dict = useDictionary()

    return (
        <Components.SideMenu.Button
            label={dict.side_menu.drag_handle_label}
            draggable={true}
            onDragStart={props.blockDragStart}
            onDragEnd={props.blockDragEnd}
            className={'bn-button'}
            icon={<MdDragIndicator size={24} data-test="dragHandle" />}
        />
    )
}
