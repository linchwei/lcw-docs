import {
    BlockSchema,
    DefaultBlockSchema,
    DefaultInlineContentSchema,
    DefaultStyleSchema,
    InlineContentSchema,
    StyleSchema,
} from '@lcw-doc/core'
import { ReactNode } from 'react'

import { useComponentsContext } from '../../../editor/ComponentsContext'
import { useDictionary } from '../../../i18n/dictionary'
import { BlockColorsItem } from './DefaultItems/BlockColorsItem'
import { RemoveBlockItem } from './DefaultItems/RemoveBlockItem'
import { DragHandleMenuProps } from './DragHandleMenuProps'

export const DragHandleMenu = <
    BSchema extends BlockSchema = DefaultBlockSchema,
    I extends InlineContentSchema = DefaultInlineContentSchema,
    S extends StyleSchema = DefaultStyleSchema,
>(
    props: DragHandleMenuProps<BSchema, I, S> & { children?: ReactNode }
) => {
    const Components = useComponentsContext()!
    const dict = useDictionary()

    return (
        <Components.Generic.Menu.Dropdown className={'bn-menu-dropdown bn-drag-handle-menu'}>
            {props.children || (
                <>
                    <RemoveBlockItem {...props}>{dict.drag_handle.delete_menuitem}</RemoveBlockItem>
                    <BlockColorsItem {...props}>{dict.drag_handle.colors_menuitem}</BlockColorsItem>
                </>
            )}
        </Components.Generic.Menu.Dropdown>
    )
}
