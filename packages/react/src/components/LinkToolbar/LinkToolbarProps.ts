import { BlockSchema, InlineContentSchema, LcwDocEditor, LinkToolbarState, StyleSchema, UiElementPosition } from '@lcw-doc/core'

export type LinkToolbarProps = Omit<LinkToolbarState, keyof UiElementPosition> &
    Pick<
        LcwDocEditor<BlockSchema, InlineContentSchema, StyleSchema>['linkToolbar'],
        'deleteLink' | 'editLink' | 'startHideTimer' | 'stopHideTimer'
    >
