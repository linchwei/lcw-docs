import {
    BlockSchema,
    DefaultBlockSchema,
    DefaultInlineContentSchema,
    DefaultStyleSchema,
    InlineContentSchema,
    StyleSchema,
} from '@lcw-doc/core'
import { FC, useCallback, useState } from 'react'

import { useLcwDocEditor } from '../../hooks/useLcwDocEditor'
import { useUIElementPositioning } from '../../hooks/useUIElementPositioning'
import { useUIPluginState } from '../../hooks/useUIPluginState'
import { SideMenu } from './SideMenu'
import { SideMenuProps } from './SideMenuProps'

export const SideMenuController = <
    BSchema extends BlockSchema = DefaultBlockSchema,
    I extends InlineContentSchema = DefaultInlineContentSchema,
    S extends StyleSchema = DefaultStyleSchema,
>(props: {
    sideMenu?: FC<SideMenuProps<BSchema, I, S>>
}) => {
    const editor = useLcwDocEditor<BSchema, I, S>()
    const [isDragging, setIsDragging] = useState(false)

    const blockDragStart = useCallback(
        (event: { dataTransfer: DataTransfer | null; clientY: number }) => {
            setIsDragging(true)
            editor.sideMenu.blockDragStart(event)
        },
        [editor]
    )

    const blockDragEnd = useCallback(() => {
        editor.sideMenu.blockDragEnd()
        setIsDragging(false)
    }, [editor])

    const callbacks = {
        blockDragStart,
        blockDragEnd,
        freezeMenu: editor.sideMenu.freezeMenu,
        unfreezeMenu: editor.sideMenu.unfreezeMenu,
    }

    const state = useUIPluginState(editor.sideMenu.onUpdate.bind(editor.sideMenu))
    const { isMounted, ref, style, getFloatingProps } = useUIElementPositioning(state?.show || false, state?.referencePos || null, 1000, {
        placement: 'left-start',
        isDragging,
    })

    if (!isMounted || !state) {
        return null
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { show, referencePos, ...data } = state

    const Component = props.sideMenu || SideMenu

    return (
        <div ref={ref} style={style} {...getFloatingProps()}>
            <Component {...data} {...callbacks} editor={editor} />
        </div>
    )
}
