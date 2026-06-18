import { Extension } from '@tiptap/core'

import { createOutlinePlugin, HeadingItem, outlinePluginKey, OutlineState } from './OutlinePlugin'

export interface OutlineStorage {
    headings: HeadingItem[]
    activeHeadingId: string | null
}

export const OutlineExtension = Extension.create<Record<string, unknown>, OutlineStorage>({
    name: 'outline',

    addStorage() {
        return {
            headings: [] as HeadingItem[],
            activeHeadingId: null as string | null,
        }
    },

    addProseMirrorPlugins() {
        return [createOutlinePlugin()]
    },

    onUpdate() {
        const state = outlinePluginKey.getState(this.editor.state) as OutlineState | undefined
        if (state) {
            this.storage.headings = state.headings
            this.storage.activeHeadingId = state.activeHeadingId
        }
    },

    onSelectionUpdate() {
        const state = outlinePluginKey.getState(this.editor.state) as OutlineState | undefined
        if (state) {
            this.storage.activeHeadingId = state.activeHeadingId
        }
    },
})
