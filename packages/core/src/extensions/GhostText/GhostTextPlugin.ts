import { Plugin, PluginKey } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'

export interface GhostTextState {
    text: string
    from: number
    to: number
}

const PLUGIN_KEY = new PluginKey('lcwdoc-ghost-text')

export const ghostTextPluginKey = PLUGIN_KEY

export const createGhostTextPlugin = () => {
    return new Plugin({
        key: PLUGIN_KEY,
        state: {
            init: () => null as GhostTextState | null,
            apply: (tr, prev) => {
                const meta = tr.getMeta(PLUGIN_KEY) as
                    | { type: 'show'; text: string; from: number; to: number }
                    | { type: 'update'; text: string }
                    | { type: 'dismiss' }
                    | undefined

                if (!meta) {
                    if (prev && tr.docChanged) {
                        return null
                    }
                    if (prev && tr.selectionSet && (tr.selection.from !== prev.from || tr.selection.to !== prev.to)) {
                        return null
                    }
                    return prev
                }

                if (meta.type === 'show') {
                    return { text: meta.text, from: meta.from, to: meta.to }
                }
                if (meta.type === 'update' && prev) {
                    return { ...prev, text: meta.text }
                }
                if (meta.type === 'dismiss') {
                    return null
                }

                return prev
            },
        },
        props: {
            decorations: state => {
                const ghostState = PLUGIN_KEY.getState(state) as GhostTextState | null
                if (!ghostState || !ghostState.text) {
                    return null
                }

                const widget = document.createElement('span')
                widget.className = 'bn-ghost-text'
                widget.textContent = ghostState.text

                return DecorationSet.create(state.doc, [Decoration.widget(ghostState.to, widget)])
            },
            handleKeyDown: (view, event) => {
                const ghostState = PLUGIN_KEY.getState(view.state) as GhostTextState | null
                if (!ghostState) return false

                if (event.key === 'Tab') {
                    event.preventDefault()
                    const { text, to } = ghostState
                    const insertTr = view.state.tr.insertText(text, to, to)
                    insertTr.setMeta(PLUGIN_KEY, { type: 'dismiss' })
                    view.dispatch(insertTr)
                    return true
                }

                if (event.key === 'Escape') {
                    event.preventDefault()
                    view.dispatch(view.state.tr.setMeta(PLUGIN_KEY, { type: 'dismiss' }))
                    return true
                }

                return false
            },
        },
    })
}
