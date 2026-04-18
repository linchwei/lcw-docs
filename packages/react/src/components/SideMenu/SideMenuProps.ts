import {
    BlockSchema,
    DefaultBlockSchema,
    DefaultInlineContentSchema,
    DefaultStyleSchema,
    InlineContentSchema,
    LcwDocEditor,
    SideMenuState,
    StyleSchema,
    UiElementPosition,
} from '@lcw-doc/core'
import { FC } from 'react'

import { DragHandleMenuProps } from './DragHandleMenu/DragHandleMenuProps'

export type SideMenuProps<
    BSchema extends BlockSchema = DefaultBlockSchema,
    I extends InlineContentSchema = DefaultInlineContentSchema,
    S extends StyleSchema = DefaultStyleSchema,
> = {
    editor: LcwDocEditor<BSchema, I, S>
    dragHandleMenu?: FC<DragHandleMenuProps<BSchema, I, S>>
} & Omit<SideMenuState<BSchema, I, S>, keyof UiElementPosition> &
    Pick<LcwDocEditor<BSchema, I, S>['sideMenu'], 'blockDragStart' | 'blockDragEnd' | 'freezeMenu' | 'unfreezeMenu'>
