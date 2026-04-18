import { describe, test, expect, beforeEach } from 'vitest'
import { LcwDocEditor } from '../../../src/editor/LcwDocEditor'
import { replaceBlocks } from '../../../src/api/blockManipulation/commands/replaceBlocks/replaceBlocks'

describe('replaceBlocks', () => {
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

    test('替换单个块', () => {
        const result = replaceBlocks(editor, ['block-2'], [{ type: 'heading', props: { level: 2 }, content: 'Replaced' }])

        expect(result.removedBlocks.length).toBe(1)
        expect(result.removedBlocks[0].id).toBe('block-2')
        expect(result.insertedBlocks.length).toBe(1)
        expect(result.insertedBlocks[0].type).toBe('heading')

        const blocks = editor.document
        expect(blocks.length).toBe(3)
    })

    test('替换多个块为单个块', () => {
        const result = replaceBlocks(editor, ['block-1', 'block-2'], [{ type: 'paragraph', content: 'Combined' }])

        expect(result.removedBlocks.length).toBe(2)
        expect(result.insertedBlocks.length).toBe(1)

        const ids = result.removedBlocks.map(b => b.id)
        expect(ids).toContain('block-1')
        expect(ids).toContain('block-2')

        const blocks = editor.document
        expect(blocks.length).toBe(2)
    })

    test('替换多个块为多个块', () => {
        const result = replaceBlocks(
            editor,
            ['block-2'],
            [
                { type: 'paragraph', content: 'Replacement A' },
                { type: 'paragraph', content: 'Replacement B' },
            ]
        )

        expect(result.removedBlocks.length).toBe(1)
        expect(result.insertedBlocks.length).toBe(2)

        const blocks = editor.document
        expect(blocks.length).toBe(4)
    })

    test('使用 BlockIdentifier 对象替换块', () => {
        const result = replaceBlocks(editor, [{ id: 'block-2' }], [{ type: 'paragraph', content: 'Replaced' }])

        expect(result.removedBlocks.length).toBe(1)
        expect(result.removedBlocks[0].id).toBe('block-2')
        expect(result.insertedBlocks.length).toBe(1)

        const blocks = editor.document
        expect(blocks.length).toBe(3)
    })

    test('替换后其他块保持不变', () => {
        replaceBlocks(editor, ['block-2'], [{ type: 'paragraph', content: 'New' }])

        const blocks = editor.document
        expect(blocks[0].id).toBe('block-1')
        expect(blocks[2].id).toBe('block-3')
    })

    test('替换为不同类型的块', () => {
        const result = replaceBlocks(editor, ['block-1'], [{ type: 'bulletListItem', content: 'List Item' }])

        expect(result.insertedBlocks[0].type).toBe('bulletListItem')

        const blocks = editor.document
        expect(blocks[0].type).toBe('bulletListItem')
    })

    test('替换不存在的块时抛出错误', () => {
        expect(() => {
            replaceBlocks(editor, ['non-existent-id'], [{ type: 'paragraph', content: 'Test' }])
        }).toThrow()
    })

    test('替换第一个块', () => {
        const result = replaceBlocks(editor, ['block-1'], [{ type: 'heading', props: { level: 1 }, content: 'New First' }])

        expect(result.removedBlocks[0].id).toBe('block-1')
        expect(result.insertedBlocks[0].type).toBe('heading')

        const blocks = editor.document
        expect(blocks[0].type).toBe('heading')
        expect(blocks[1].id).toBe('block-2')
    })

    test('替换最后一个块', () => {
        const result = replaceBlocks(editor, ['block-3'], [{ type: 'paragraph', content: 'New Last' }])

        expect(result.removedBlocks[0].id).toBe('block-3')

        const blocks = editor.document
        expect(blocks.length).toBe(3)
        expect(blocks[1].id).toBe('block-2')
    })
})
