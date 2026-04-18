import { getBlockInfoFromSelection, updateBlockCommand } from '@lcw-doc/core'
import { Extension, InputRule } from '@tiptap/core'

export const CustomInputRules = Extension.create({
    name: 'customInputRules',

    addInputRules() {
        return [
            new InputRule({
                find: /^>\s$/,
                handler: ({ state, chain, range }) => {
                    const blockInfo = getBlockInfoFromSelection(state)
                    if (blockInfo.blockContent.node.type.spec.content !== 'inline*') {
                        return
                    }
                    chain()
                        .command(
                            updateBlockCommand(this.options.editor, blockInfo.blockContainer.beforePos, {
                                type: 'blockquote',
                                props: {},
                            })
                        )
                        .deleteRange({ from: range.from, to: range.to })
                        .run()
                },
            }),
            new InputRule({
                find: /^(---|\*\*\*|___)\s$/,
                handler: ({ state, chain, range }) => {
                    const blockInfo = getBlockInfoFromSelection(state)
                    chain()
                        .command(
                            updateBlockCommand(this.options.editor, blockInfo.blockContainer.beforePos, {
                                type: 'divider',
                                props: {},
                            })
                        )
                        .deleteRange({ from: range.from, to: range.to })
                        .run()
                },
            }),
            new InputRule({
                find: /^!\[([^\]]*)\]\(([^)]+)\)\s$/,
                handler: ({ state, chain, range, match }) => {
                    const blockInfo = getBlockInfoFromSelection(state)
                    const url = match[2]
                    chain()
                        .command(
                            updateBlockCommand(this.options.editor, blockInfo.blockContainer.beforePos, {
                                type: 'image',
                                props: { url: url as any },
                            })
                        )
                        .deleteRange({ from: range.from, to: range.to })
                        .run()
                },
            }),
            new InputRule({
                find: /^\|(.+)\|\s*$/,
                handler: ({ state, chain, range, match }) => {
                    const blockInfo = getBlockInfoFromSelection(state)
                    const headerLine = match[1]
                    const cells = headerLine
                        .split('|')
                        .map(c => c.trim())
                        .filter(c => c.length > 0)
                    if (cells.length < 2) return

                    const colCount = cells.length
                    const rowCount = 2
                    const tableContent: string[][] = []
                    for (let r = 0; r < rowCount; r++) {
                        const row: string[] = []
                        for (let c = 0; c < colCount; c++) {
                            row.push(r === 0 ? cells[c] : '')
                        }
                        tableContent.push(row)
                    }

                    chain()
                        .command(
                            updateBlockCommand(this.options.editor, blockInfo.blockContainer.beforePos, {
                                type: 'table',
                                props: {},
                            })
                        )
                        .deleteRange({ from: range.from, to: range.to })
                        .run()

                    setTimeout(() => {
                        const editor = this.options.editor
                        const pos = editor.state.selection.from
                        const tableNode = editor.state.doc.nodeAt(pos)
                        if (!tableNode) return

                        let offset = pos + 1
                        for (let r = 0; r < rowCount; r++) {
                            for (let c = 0; c < colCount; c++) {
                                const cellPos = offset
                                const cellNode = editor.state.doc.nodeAt(cellPos)
                                if (cellNode) {
                                    const text = tableContent[r][c]
                                    if (text) {
                                        editor
                                            .chain()
                                            .insertContentAt({ from: cellPos + 1, to: cellPos + 1 }, text)
                                            .run()
                                    }
                                    offset += cellNode.nodeSize
                                }
                            }
                        }
                    }, 10)
                },
            }),
        ]
    },
})
