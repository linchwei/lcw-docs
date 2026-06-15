import { Plugin, PluginKey } from 'prosemirror-state'

export interface HeadingItem {
    id: string
    level: number
    text: string
}

export interface OutlineState {
    headings: HeadingItem[]
    activeHeadingId: string | null
}

const PLUGIN_KEY = new PluginKey('lcwdoc-outline')

export const outlinePluginKey = PLUGIN_KEY

function extractHeadings(doc: any): HeadingItem[] {
    const headings: HeadingItem[] = []

    doc.descendants((node: any) => {
        if (node.type.name === 'blockContainer' && node.firstChild?.type.name === 'heading') {
            const headingNode = node.firstChild
            const id = node.attrs.id
            const level = headingNode.attrs.level ?? 1
            const text = headingNode.textContent

            if (id) {
                headings.push({ id, level, text })
            }
        }
    })

    return headings
}

function findActiveHeadingId(doc: any, selection: any, headings: HeadingItem[]): string | null {
    if (headings.length === 0) return null

    const { from } = selection
    let activeId: string | null = null

    doc.descendants((node: any, pos: number) => {
        if (node.type.name === 'blockContainer' && node.firstChild?.type.name === 'heading') {
            const id = node.attrs.id
            if (id && pos < from) {
                activeId = id
            }
        }
    })

    return activeId ?? headings[0]?.id ?? null
}

export const createOutlinePlugin = () => {
    return new Plugin({
        key: PLUGIN_KEY,
        state: {
            init: (_, { doc, selection }) => ({
                headings: extractHeadings(doc),
                activeHeadingId: findActiveHeadingId(doc, selection, extractHeadings(doc)),
            }),
            apply: (tr, _prev, oldState, newState) => {
                const prevOutline = PLUGIN_KEY.getState(oldState) as OutlineState | null

                if (!prevOutline) {
                    const headings = extractHeadings(newState.doc)
                    const activeHeadingId = findActiveHeadingId(newState.doc, newState.selection, headings)
                    return { headings, activeHeadingId }
                }

                if (tr.docChanged) {
                    const headings = extractHeadings(newState.doc)
                    const activeHeadingId = findActiveHeadingId(newState.doc, newState.selection, headings)
                    return { headings, activeHeadingId }
                }

                if (tr.selectionSet) {
                    const activeHeadingId = findActiveHeadingId(newState.doc, newState.selection, prevOutline.headings)
                    if (activeHeadingId !== prevOutline.activeHeadingId) {
                        return { ...prevOutline, activeHeadingId }
                    }
                }

                return prevOutline
            },
        },
    })
}
