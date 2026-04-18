import {
    DefaultBlockSchema,
    DefaultInlineContentSchema,
    DefaultStyleSchema,
    InlineContentSchema,
    LcwDocEditor,
    StyleSchema,
    TableHandlesState,
} from '@lcw-doc/core'

export type ExtendButtonProps<I extends InlineContentSchema = DefaultInlineContentSchema, S extends StyleSchema = DefaultStyleSchema> = {
    editor: LcwDocEditor<
        {
            table: DefaultBlockSchema['table']
        },
        I,
        S
    >
    onMouseDown: () => void
    onMouseUp: () => void
    orientation: 'addOrRemoveRows' | 'addOrRemoveColumns'
} & Pick<TableHandlesState<I, S>, 'block'>
