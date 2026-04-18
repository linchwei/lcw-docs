import { describe, test, expect, beforeEach } from 'vitest'
import { LcwDocEditor } from '../../../src/editor/LcwDocEditor'
import { removeBlocks, removeBlocksWithCallback } from '../../../src/api/blockManipulation/commands/removeBlocks/removeBlocks'

describe('removeBlocks', () => {
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

    test('删除单个块', () => {
        const removed = removeBlocks(editor, ['block-2'])

        expect(removed.length).toBe(1)
        expect(removed[0].id).toBe('block-2')

        const blocks = editor.document
        expect(blocks.length).toBe(2)
        expect(blocks[0].id).toBe('block-1')
        expect(blocks[1].id).toBe('block-3')
    })

    test('删除多个块', () => {
        const removed = removeBlocks(editor, ['block-1', 'block-3'])

        expect(removed.length).toBe(2)

        const ids = removed.map(b => b.id)
        expect(ids).toContain('block-1')
        expect(ids).toContain('block-3')

        const blocks = editor.document
        expect(blocks.length).toBe(1)
        expect(blocks[0].id).toBe('block-2')
    })

    test('使用 BlockIdentifier 对象删除块', () => {
        const removed = removeBlocks(editor, [{ id: 'block-2' }])

        expect(removed.length).toBe(1)
        expect(removed[0].id).toBe('block-2')

        const blocks = editor.document
        expect(blocks.length).toBe(2)
    })

    test('删除后剩余块的内容保持不变', () => {
        removeBlocks(editor, ['block-2'])

        const blocks = editor.document
        expect(blocks.length).toBe(2)
        expect(blocks[0].id).toBe('block-1')
        expect(blocks[1].id).toBe('block-3')
    })

    test('删除不存在的块时抛出错误', () => {
        expect(() => {
            removeBlocks(editor, ['non-existent-id'])
        }).toThrow()
    })

    test('删除第一个块', () => {
        const removed = removeBlocks(editor, ['block-1'])

        expect(removed.length).toBe(1)
        expect(removed[0].id).toBe('block-1')

        const blocks = editor.document
        expect(blocks.length).toBe(2)
        expect(blocks[0].id).toBe('block-2')
    })

    test('删除最后一个块', () => {
        const removed = removeBlocks(editor, ['block-3'])

        expect(removed.length).toBe(1)
        expect(removed[0].id).toBe('block-3')

        const blocks = editor.document
        expect(blocks.length).toBe(2)
        expect(blocks[1].id).toBe('block-2')
    })
})

describe('removeBlocksWithCallback', () => {
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

    test('不带回调函数删除块', () => {
        const removed = removeBlocksWithCallback(editor, ['block-2'])

        expect(removed.length).toBe(1)
        expect(removed[0].id).toBe('block-2')

        const blocks = editor.document
        expect(blocks.length).toBe(2)
    })

    test('带回调函数删除块', () => {
        const callbackCalls: { nodePos: number; removedSize: number }[] = []

        const removed = removeBlocksWithCallback(editor, ['block-2'], (_node, pos, _tr, removedSize) => {
            callbackCalls.push({ nodePos: pos, removedSize })
            return removedSize
        })

        expect(removed.length).toBe(1)
        expect(removed[0].id).toBe('block-2')
        expect(callbackCalls.length).toBe(1)

        const blocks = editor.document
        expect(blocks.length).toBe(2)
    })

    test('回调函数在删除多个块时被多次调用', () => {
        let callbackCount = 0

        removeBlocksWithCallback(editor, ['block-1', 'block-3'], (_node, _pos, _tr, _removedSize) => {
            callbackCount++
            return _removedSize
        })

        expect(callbackCount).toBe(2)
    })
})
