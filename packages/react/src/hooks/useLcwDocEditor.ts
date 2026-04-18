import {
    BlockSchema,
    DefaultBlockSchema,
    DefaultInlineContentSchema,
    DefaultStyleSchema,
    InlineContentSchema,
    LcwDocEditor,
    LcwDocSchema,
    StyleSchema,
} from '@lcw-doc/core'

import { useLcwDocContext } from '../editor/LcwDocContext'

export function useLcwDocEditor<
    BSchema extends BlockSchema = DefaultBlockSchema,
    ISchema extends InlineContentSchema = DefaultInlineContentSchema,
    SSchema extends StyleSchema = DefaultStyleSchema,
>(_schema?: LcwDocSchema<BSchema, ISchema, SSchema>): LcwDocEditor<BSchema, ISchema, SSchema> {
    const context = useLcwDocContext(_schema)

    if (!context?.editor) {
        throw new Error('useLcwDocEditor was called outside of a LcwDocContext provider or LcwDocView component')
    }

    return context.editor
}
