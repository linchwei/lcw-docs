import { inject, provide, type InjectionKey } from 'vue'
import type { LcwDocEditor, BlockSchema, InlineContentSchema, StyleSchema } from '@lcw-doc/core'

const EDITOR_KEY: InjectionKey<LcwDocEditor<BlockSchema, InlineContentSchema, StyleSchema>> = Symbol('lcwDocEditor')

export function provideLcwDocEditor(editor: LcwDocEditor<BlockSchema, InlineContentSchema, StyleSchema>) {
    provide(EDITOR_KEY, editor)
}

export function useLcwDocEditor(): LcwDocEditor<BlockSchema, InlineContentSchema, StyleSchema> {
    const editor = inject(EDITOR_KEY)
    if (!editor) {
        throw new Error('useLcwDocEditor must be used within a component that provides LcwDocEditor')
    }
    return editor
}

/** 内部使用：安全 inject，不存在时返回 null */
export function injectEditor(): LcwDocEditor<BlockSchema, InlineContentSchema, StyleSchema> | null {
    return inject(EDITOR_KEY, null)
}
