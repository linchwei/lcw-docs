import {
    BlockSchema,
    DefaultBlockSchema,
    DefaultInlineContentSchema,
    DefaultStyleSchema,
    InlineContentSchema,
    StyleSchema,
} from '@lcw-doc/core'
import { ReactNode, useMemo } from 'react'

import { useComponentsContext } from '../../editor/ComponentsContext'
import { AddBlockButton } from './DefaultButtons/AddBlockButton'
import { DragHandleButton } from './DefaultButtons/DragHandleButton'
import { SideMenuProps } from './SideMenuProps'

export const SideMenu = <
    BSchema extends BlockSchema = DefaultBlockSchema,
    I extends InlineContentSchema = DefaultInlineContentSchema,
    S extends StyleSchema = DefaultStyleSchema,
>(
    props: SideMenuProps<BSchema, I, S> & { children?: ReactNode }
) => {
    const Components = useComponentsContext()!

    const dataAttributes = useMemo(() => {
        const attrs: Record<string, string> = {
            'data-block-type': props.block.type,
        }

        if (props.block.type === 'heading') {
            attrs['data-level'] = props.block.props.level.toString()
        }

        if (props.editor.schema.blockSchema[props.block.type].isFileBlock) {
            if (props.block.props.url) {
                attrs['data-url'] = 'true'
            } else {
                attrs['data-url'] = 'false'
            }
        }

        return attrs
    }, [props.block, props.editor.schema.blockSchema])

    return (
        <Components.SideMenu.Root className={'bn-side-menu'} {...dataAttributes}>
            {props.children || (
                <>
                    <AddBlockButton {...props} />
                    <DragHandleButton {...props} />
                </>
            )}
        </Components.SideMenu.Root>
    )
}
