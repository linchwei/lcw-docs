import { describe, test, expect, beforeEach } from 'vitest'
import { createChainableState } from '@tiptap/core'
import { LcwDocEditor } from '../../../src/editor/LcwDocEditor'
import { splitBlockCommand } from '../../../src/api/blockManipulation/commands/splitBlock/splitBlock'
import { getNodeById } from '../../../src/api/nodeUtil'
import { getBlockInfo } from '../../../src/api/getBlockInfoFromPos'

function applySplit(editor: LcwDocEditor, blockId: string, offset: number, keepType?: boolean, keepProps?: boolean) {
    const ttEditor = editor._tiptapEditor
    const tr = ttEditor.state.tr
    const chainableState = createChainableState({ state: ttEditor.state, transaction: tr })
    const { node, posBeforeNode } = getNodeById(blockId, chainableState.doc)
    const blockInfo = getBlockInfo({ node, posBeforeNode })
    const posInBlock = blockInfo.blockContent.beforePos + 1 + offset

    splitBlockCommand(posInBlock, keepType, keepProps)({
        state: chainableState,
        dispatch: () => {},
    })

    editor.dispatch(tr)
}

describe('splitBlockCommand', () => {
    let editor: LcwDocEditor

    beforeEach(() => {
        editor = LcwDocEditor.create({
            initialContent: [
                {
                    type: 'paragraph',
                    id: 'block-1',
                    content: 'Hello World',
                },
                {
                    type: 'paragraph',
                    id: 'block-2',
                    content: 'Second',
                },
            ],
        })
    })

    test('在段落中间分割块', () => {
        applySplit(editor, 'block-1', 5)

        const blocks = editor.document
        expect(blocks.length).toBe(3)
    })

    test('分割后第二个块默认为段落类型', () => {
        editor = LcwDocEditor.create({
            initialContent: [
                {
                    type: 'heading',
                    id: 'heading-1',
                    props: { level: 1 },
                    content: 'Heading Text',
                },
            ],
        })

        applySplit(editor, 'heading-1', 7)

        const blocks = editor.document
        expect(blocks.length).toBe(2)
        expect(blocks[0].type).toBe('heading')
        expect(blocks[1].type).toBe('paragraph')
    })

    test('keepType 为 true 时保留原块类型', () => {
        editor = LcwDocEditor.create({
            initialContent: [
                {
                    type: 'heading',
                    id: 'heading-1',
                    props: { level: 1 },
                    content: 'Heading Text',
                },
            ],
        })

        applySplit(editor, 'heading-1', 7, true)

        const blocks = editor.document
        expect(blocks.length).toBe(2)
        expect(blocks[0].type).toBe('heading')
        expect(blocks[1].type).toBe('heading')
    })

    test('不传 dispatch 时不修改文档', () => {
        const ttEditor = editor._tiptapEditor
        const { node, posBeforeNode } = getNodeById('block-1', ttEditor.state.doc)
        const blockInfo = getBlockInfo({ node, posBeforeNode })
        const posInBlock = blockInfo.blockContent.beforePos + 1 + 5

        const result = splitBlockCommand(posInBlock)({
            state: ttEditor.state,
            dispatch: undefined,
        })

        expect(result).toBe(true)

        const blocks = editor.document
        expect(blocks.length).toBe(2)
    })

    test('keepProps 为 true 时保留原块属性', () => {
        editor = LcwDocEditor.create({
            initialContent: [
                {
                    type: 'paragraph',
                    id: 'block-1',
                    props: { textAlignment: 'center' },
                    content: 'Centered Text',
                },
            ],
        })

        applySplit(editor, 'block-1', 7, false, true)

        const blocks = editor.document
        expect(blocks.length).toBe(2)
        expect((blocks[1].props as any).textAlignment).toBe('center')
    })

    test('在段落末尾分割块', () => {
        applySplit(editor, 'block-1', 11)

        const blocks = editor.document
        expect(blocks.length).toBe(3)
        expect(blocks[0].id).toBe('block-1')
    })
})
