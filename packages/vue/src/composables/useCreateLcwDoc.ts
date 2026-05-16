import { LcwDocEditor } from '@lcw-doc/core'
import type {
    BlockSchema,
    DefaultBlockSchema,
    DefaultInlineContentSchema,
    DefaultStyleSchema,
    InlineContentSchema,
    LcwDocEditorOptions,
    StyleSchema,
} from '@lcw-doc/core'

export function useCreateLcwDoc<
    BSchema extends BlockSchema = DefaultBlockSchema,
    ISchema extends InlineContentSchema = DefaultInlineContentSchema,
    SSchema extends StyleSchema = DefaultStyleSchema,
>(options: Partial<LcwDocEditorOptions<BSchema, ISchema, SSchema>> = {}) {
    const editor = LcwDocEditor.create<BSchema, ISchema, SSchema>(options)
    if (typeof window !== 'undefined') {
        ;(window as any).ProseMirror = editor._tiptapEditor
    }
    return editor
}
