import { inject, provide, ref, type InjectionKey, type Ref } from 'vue'
import type { LcwDocEditor, BlockSchema, InlineContentSchema, StyleSchema } from '@lcw-doc/core'

interface EditorContextValue {
    editor: LcwDocEditor<BlockSchema, InlineContentSchema, StyleSchema>
    contentEditableProps: Ref<Record<string, string>>
}

const EDITOR_CONTEXT_KEY: InjectionKey<EditorContextValue> = Symbol('lcwDocEditorContext')

export function provideEditorContext(editor: LcwDocEditor<BlockSchema, InlineContentSchema, StyleSchema>) {
    const contentEditableProps = ref<Record<string, string>>({})
    provide(EDITOR_CONTEXT_KEY, { editor, contentEditableProps })
}

export function useEditorContext(): EditorContextValue {
    const ctx = inject(EDITOR_CONTEXT_KEY)
    if (!ctx) {
        throw new Error('useEditorContext must be used within a LcwDocView component')
    }
    return ctx
}
