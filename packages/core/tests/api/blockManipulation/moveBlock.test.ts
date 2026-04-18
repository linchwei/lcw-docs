import { describe, test, expect, beforeEach } from 'vitest'
import { LcwDocEditor } from '../../../src/editor/LcwDocEditor'
import { moveBlockUp, moveBlockDown, moveSelectedBlockAndSelection } from '../../../src/api/blockManipulation/commands/moveBlock/moveBlock'
import { getNodeById } from '../../../src/api/nodeUtil'
import { getBlockInfo } from '../../../src/api/getBlockInfoFromPos'
import { TextSelection } from 'prosemirror-state'

function setupEditorWithView(editor: LcwDocEditor) {
    const ttEditor = editor._tiptapEditor
    const mockView: any = {
        state: ttEditor.state,
        dom: document.createElement('div'),
        updating: false,
        root: document,
        destroy: () => {},
        focus: () => {},
        hasFocus: () => false,
        posAtCoords: () => null,
        coordsAtPos: () => ({ left: 0, right: 0, top: 0, bottom: 0 }),
        endOfTextblock: () => false,
    }
    mockView.dispatch = (tr: any) => {
        const newState = mockView.state.apply(tr)
        ;(ttEditor as any)._state = newState
        mockView.state = newState
    }
    ;(ttEditor as any).view = mockView
}

function setCursorToBlock(editor: LcwDocEditor, blockId: string) {
    const ttEditor = editor._tiptapEditor
    const { node, posBeforeNode } = getNodeById(blockId, ttEditor.state.doc)
    const blockInfo = getBlockInfo({ node, posBeforeNode })
    const contentPos = blockInfo.blockContent.beforePos + 1
    const tr = ttEditor.state.tr.setSelection(
        TextSelection.create(ttEditor.state.doc, contentPos)
    )
    editor.dispatch(tr)
}

describe('moveBlockUp', () => {
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
        setupEditorWithView(editor)
    })

    test('将第二个块向上移动', () => {
        setCursorToBlock(editor, 'block-2')
        moveBlockUp(editor)

        const blocks = editor.document
        expect(blocks[0].id).toBe('block-2')
        expect(blocks[1].id).toBe('block-1')
        expect(blocks[2].id).toBe('block-3')
    })

    test('第一个块向上移动时不改变顺序', () => {
        setCursorToBlock(editor, 'block-1')
        moveBlockUp(editor)

        const blocks = editor.document
        expect(blocks[0].id).toBe('block-1')
        expect(blocks[1].id).toBe('block-2')
        expect(blocks[2].id).toBe('block-3')
    })

    test('将第三个块向上移动', () => {
        setCursorToBlock(editor, 'block-3')
        moveBlockUp(editor)

        const blocks = editor.document
        expect(blocks[0].id).toBe('block-1')
        expect(blocks[1].id).toBe('block-3')
        expect(blocks[2].id).toBe('block-2')
    })
})

describe('moveBlockDown', () => {
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
        setupEditorWithView(editor)
    })

    test('将第一个块向下移动', () => {
        setCursorToBlock(editor, 'block-1')
        moveBlockDown(editor)

        const blocks = editor.document
        expect(blocks[0].id).toBe('block-2')
        expect(blocks[1].id).toBe('block-1')
        expect(blocks[2].id).toBe('block-3')
    })

    test('最后一个块向下移动时不改变顺序', () => {
        setCursorToBlock(editor, 'block-3')
        moveBlockDown(editor)

        const blocks = editor.document
        expect(blocks[0].id).toBe('block-1')
        expect(blocks[1].id).toBe('block-2')
        expect(blocks[2].id).toBe('block-3')
    })

    test('将第二个块向下移动', () => {
        setCursorToBlock(editor, 'block-2')
        moveBlockDown(editor)

        const blocks = editor.document
        expect(blocks[0].id).toBe('block-1')
        expect(blocks[1].id).toBe('block-3')
        expect(blocks[2].id).toBe('block-2')
    })
})

describe('moveSelectedBlockAndSelection', () => {
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
        setupEditorWithView(editor)
    })

    test('将块移动到参考块之前', () => {
        setCursorToBlock(editor, 'block-3')
        moveSelectedBlockAndSelection(editor, 'block-1', 'before')

        const blocks = editor.document
        expect(blocks[0].id).toBe('block-3')
        expect(blocks[1].id).toBe('block-1')
        expect(blocks[2].id).toBe('block-2')
    })

    test('将块移动到参考块之后', () => {
        setCursorToBlock(editor, 'block-1')
        moveSelectedBlockAndSelection(editor, 'block-3', 'after')

        const blocks = editor.document
        expect(blocks[0].id).toBe('block-2')
        expect(blocks[1].id).toBe('block-3')
        expect(blocks[2].id).toBe('block-1')
    })
})
