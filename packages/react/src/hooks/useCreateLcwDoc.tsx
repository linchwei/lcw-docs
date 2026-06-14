import {
    BlockSchema,
    DefaultBlockSchema,
    DefaultInlineContentSchema,
    DefaultStyleSchema,
    InlineContentSchema,
    LcwDocEditor,
    LcwDocEditorOptions,
    StyleSchema,
} from '@lcw-doc/core'
import { DependencyList, useEffect, useMemo } from 'react'

export const useCreateLcwDoc = <
    BSchema extends BlockSchema = DefaultBlockSchema,
    ISchema extends InlineContentSchema = DefaultInlineContentSchema,
    SSchema extends StyleSchema = DefaultStyleSchema,
>(
    options: Partial<LcwDocEditorOptions<BSchema, ISchema, SSchema>> = {},
    deps: DependencyList = []
) => {
    const editor = useMemo(() => {
        const editor = LcwDocEditor.create<BSchema, ISchema, SSchema>(options)
        if (window) {
            ;(window as any).ProseMirror = editor._tiptapEditor
        }
        return editor
    }, deps)

    useEffect(() => {
        return () => {
            editor.unmount()
        }
    }, [editor])

    return editor
}

export const useLcwDoc = useCreateLcwDoc
