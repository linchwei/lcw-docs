import { Extension } from '@tiptap/core'

import { createGhostTextPlugin, ghostTextPluginKey } from './GhostTextPlugin'

export interface GhostTextStorage {
    abortController: AbortController | null
}

export const GhostTextExtension = Extension.create<{ enabled: boolean }, GhostTextStorage>({
    name: 'ghostText',

    addOptions() {
        return { enabled: true }
    },

    addStorage() {
        return { abortController: null }
    },

    addProseMirrorPlugins() {
        if (!this.options.enabled) return []
        return [createGhostTextPlugin()]
    },
})

export function showGhostText(editor: any, text: string) {
    const { from, to } = editor.state.selection
    editor.view.dispatch(editor.state.tr.setMeta(ghostTextPluginKey, { type: 'show', text, from, to }))
}

export function updateGhostText(editor: any, text: string) {
    editor.view.dispatch(editor.state.tr.setMeta(ghostTextPluginKey, { type: 'update', text }))
}

export function dismissGhostText(editor: any) {
    const ghostState = ghostTextPluginKey.getState(editor.state)
    if (!ghostState) return
    editor.view.dispatch(editor.state.tr.setMeta(ghostTextPluginKey, { type: 'dismiss' }))
}
