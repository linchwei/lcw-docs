import { describe, test, expect, beforeEach } from 'vitest'
import { createChainableState } from '@tiptap/core'
import { LcwDocEditor } from '../../../src/editor/LcwDocEditor'
import { updateBlockCommand } from '../../../src/api/blockManipulation/commands/updateBlock/updateBlock'
import { getNodeById } from '../../../src/api/nodeUtil'

function applyUpdate(editor: LcwDocEditor, blockId: string, update: any) {
    const ttEditor = editor._tiptapEditor
    const tr = ttEditor.state.tr
    const chainableState = createChainableState({ state: ttEditor.state, transaction: tr })
    const { posBeforeNode } = getNodeById(blockId, chainableState.doc)

    updateBlockCommand(editor, posBeforeNode, update)({
        state: chainableState,
        dispatch: () => {},
    })

    editor.dispatch(tr)
}

describe('updateBlockCommand', () => {
    let editor: LcwDocEditor

    beforeEach(() => {
        editor = LcwDocEditor.create({
            initialContent: [
                {
                    type: 'paragraph',
                    id: 'block-1',
                    content: 'Hello',
                },
                {
                    type: 'paragraph',
                    id: 'block-2',
                    content: 'World',
                },
            ],
        })
    })

    test('更新块的内容（字符串）', () => {
        applyUpdate(editor, 'block-1', { content: 'Updated Content' })

        const block = editor.getBlock('block-1')
        expect(block).toBeDefined()
        expect(block!.type).toBe('paragraph')
    })

    test('更新块的类型', () => {
        applyUpdate(editor, 'block-1', { type: 'heading' })

        const block = editor.getBlock('block-1')
        expect(block).toBeDefined()
        expect(block!.type).toBe('heading')
    })

    test('更新块的属性', () => {
        applyUpdate(editor, 'block-1', {
            props: { textAlignment: 'center' },
        })

        const block = editor.getBlock('block-1')
        expect(block).toBeDefined()
        expect((block!.props as any).textAlignment).toBe('center')
    })

    test('更新块类型为 bulletListItem', () => {
        applyUpdate(editor, 'block-1', { type: 'bulletListItem' })

        const block = editor.getBlock('block-1')
        expect(block).toBeDefined()
        expect(block!.type).toBe('bulletListItem')
    })

    test('更新块类型为 numberedListItem', () => {
        applyUpdate(editor, 'block-1', { type: 'numberedListItem' })

        const block = editor.getBlock('block-1')
        expect(block).toBeDefined()
        expect(block!.type).toBe('numberedListItem')
    })

    test('更新 heading 的 level 属性', () => {
        editor = LcwDocEditor.create({
            initialContent: [
                {
                    type: 'heading',
                    id: 'heading-1',
                    props: { level: 1 },
                    content: 'Title',
                },
            ],
        })

        applyUpdate(editor, 'heading-1', {
            props: { level: 2 },
        })

        const block = editor.getBlock('heading-1')
        expect(block).toBeDefined()
        expect((block!.props as any).level).toBe(2)
    })

    test('同时更新类型和属性', () => {
        applyUpdate(editor, 'block-1', {
            type: 'heading',
            props: { level: 3 },
        })

        const block = editor.getBlock('block-1')
        expect(block).toBeDefined()
        expect(block!.type).toBe('heading')
        expect((block!.props as any).level).toBe(3)
    })

    test('更新块内容为内联内容数组', () => {
        applyUpdate(editor, 'block-1', {
            content: [
                {
                    type: 'text',
                    text: 'Bold',
                    styles: { bold: true },
                },
                {
                    type: 'text',
                    text: ' text',
                    styles: {},
                },
            ],
        })

        const block = editor.getBlock('block-1')
        expect(block).toBeDefined()
        expect(block!.type).toBe('paragraph')
    })

    test('更新块添加子块', () => {
        applyUpdate(editor, 'block-1', {
            children: [
                {
                    type: 'paragraph',
                    content: 'Child paragraph',
                },
            ],
        })

        const block = editor.getBlock('block-1')
        expect(block).toBeDefined()
        expect(block!.children.length).toBe(1)
        expect(block!.children[0].type).toBe('paragraph')
    })

    test('不传 dispatch 时返回 true 但不修改文档', () => {
        const ttEditor = editor._tiptapEditor
        const { posBeforeNode } = getNodeById('block-1', ttEditor.state.doc)

        const result = updateBlockCommand(editor, posBeforeNode, {
            type: 'heading',
        })({
            state: ttEditor.state,
            dispatch: undefined,
        })

        expect(result).toBe(true)

        const block = editor.getBlock('block-1')
        expect(block).toBeDefined()
        expect(block!.type).toBe('paragraph')
    })
})
