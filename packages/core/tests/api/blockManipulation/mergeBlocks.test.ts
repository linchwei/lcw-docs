import { describe, test, expect, beforeEach } from 'vitest'
import { LcwDocEditor } from '../../../src/editor/LcwDocEditor'
import { mergeBlocksCommand, getPrevBlockPos } from '../../../src/api/blockManipulation/commands/mergeBlocks/mergeBlocks'
import { getNodeById } from '../../../src/api/nodeUtil'

describe('mergeBlocksCommand', () => {
    let editor: LcwDocEditor

    beforeEach(() => {
        editor = LcwDocEditor.create({
            initialContent: [
                {
                    type: 'paragraph',
                    id: 'block-1',
                    content: 'First',
                },
                {
                    type: 'paragraph',
                    id: 'block-2',
                    content: 'Second',
                },
                {
                    type: 'paragraph',
                    id: 'block-3',
                    content: 'Third',
                },
            ],
        })
    })

    test('合并两个相邻的段落块', () => {
        const ttEditor = editor._tiptapEditor
        const { node: block1Node, posBeforeNode: posBeforeBlock1 } = getNodeById('block-1', ttEditor.state.doc)
        const posBetweenBlocks = posBeforeBlock1 + block1Node.nodeSize

        const result = mergeBlocksCommand(posBetweenBlocks)({
            state: ttEditor.state,
            dispatch: (tr: any) => {
                editor.dispatch(tr)
            },
        })

        expect(result).toBe(true)

        const blocks = editor.document
        expect(blocks.length).toBe(2)
    })

    test('不能合并非 inline 内容的块', () => {
        editor = LcwDocEditor.create({
            initialContent: [
                {
                    type: 'paragraph',
                    id: 'block-1',
                    content: 'First',
                },
                {
                    type: 'image',
                    id: 'block-2',
                },
            ],
        })

        const ttEditor = editor._tiptapEditor
        const { node: block1Node, posBeforeNode: posBeforeBlock1 } = getNodeById('block-1', ttEditor.state.doc)
        const posBetweenBlocks = posBeforeBlock1 + block1Node.nodeSize

        const result = mergeBlocksCommand(posBetweenBlocks)({
            state: ttEditor.state,
            dispatch: (tr: any) => {
                editor.dispatch(tr)
            },
        })

        expect(result).toBe(false)
    })

    test('合并后第一个块保留', () => {
        const ttEditor = editor._tiptapEditor
        const { node: block1Node, posBeforeNode: posBeforeBlock1 } = getNodeById('block-1', ttEditor.state.doc)
        const posBetweenBlocks = posBeforeBlock1 + block1Node.nodeSize

        mergeBlocksCommand(posBetweenBlocks)({
            state: ttEditor.state,
            dispatch: (tr: any) => {
                editor.dispatch(tr)
            },
        })

        const blocks = editor.document
        expect(blocks.length).toBe(2)
        expect(blocks[0].id).toBe('block-1')
    })

    test('不传 dispatch 时返回 true 但不修改文档', () => {
        const ttEditor = editor._tiptapEditor
        const { node: block1Node, posBeforeNode: posBeforeBlock1 } = getNodeById('block-1', ttEditor.state.doc)
        const posBetweenBlocks = posBeforeBlock1 + block1Node.nodeSize

        const result = mergeBlocksCommand(posBetweenBlocks)({
            state: ttEditor.state,
            dispatch: undefined,
        })

        expect(result).toBe(true)

        const blocks = editor.document
        expect(blocks.length).toBe(3)
    })

    test('合并第二和第三个块', () => {
        const ttEditor = editor._tiptapEditor
        const { node: block2Node, posBeforeNode: posBeforeBlock2 } = getNodeById('block-2', ttEditor.state.doc)
        const posBetweenBlocks = posBeforeBlock2 + block2Node.nodeSize

        const result = mergeBlocksCommand(posBetweenBlocks)({
            state: ttEditor.state,
            dispatch: (tr: any) => {
                editor.dispatch(tr)
            },
        })

        expect(result).toBe(true)

        const blocks = editor.document
        expect(blocks.length).toBe(2)
        expect(blocks[0].id).toBe('block-1')
    })
})

describe('getPrevBlockPos', () => {
    let editor: LcwDocEditor

    beforeEach(() => {
        editor = LcwDocEditor.create({
            initialContent: [
                {
                    type: 'paragraph',
                    id: 'block-1',
                    content: 'First',
                },
                {
                    type: 'paragraph',
                    id: 'block-2',
                    content: 'Second',
                },
            ],
        })
    })

    test('获取前一个块的位置', () => {
        const ttEditor = editor._tiptapEditor
        const { node: block1Node, posBeforeNode: posBeforeBlock1 } = getNodeById('block-1', ttEditor.state.doc)
        const posBetweenBlocks = posBeforeBlock1 + block1Node.nodeSize

        const $nextBlockPos = ttEditor.state.doc.resolve(posBetweenBlocks)
        const $prevBlockPos = getPrevBlockPos(ttEditor.state.doc, $nextBlockPos)

        expect($prevBlockPos).toBeDefined()
        expect($prevBlockPos.nodeAfter).toBeDefined()
        expect($prevBlockPos.nodeAfter!.attrs.id).toBe('block-1')
    })
})
