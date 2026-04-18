import { describe, test, expect, beforeEach } from 'vitest'
import { LcwDocEditor } from '../../../src/editor/LcwDocEditor'
import { insertBlocks } from '../../../src/api/blockManipulation/commands/insertBlocks/insertBlocks'

describe('insertBlocks', () => {
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

    test('在参考块之前插入单个块', () => {
        const result = insertBlocks(editor, [{ type: 'paragraph', content: 'Inserted' }], 'block-2', 'before')

        expect(result.length).toBe(1)
        expect(result[0].type).toBe('paragraph')

        const blocks = editor.document
        expect(blocks.length).toBe(4)
        expect(blocks[0].id).toBe('block-1')
        expect(blocks[2].id).toBe('block-2')
    })

    test('在参考块之后插入单个块', () => {
        const result = insertBlocks(editor, [{ type: 'paragraph', content: 'Inserted' }], 'block-2', 'after')

        expect(result.length).toBe(1)
        expect(result[0].type).toBe('paragraph')

        const blocks = editor.document
        expect(blocks.length).toBe(4)
        expect(blocks[1].id).toBe('block-2')
        expect(blocks[3].id).toBe('block-3')
    })

    test('在参考块之前插入多个块', () => {
        const result = insertBlocks(
            editor,
            [
                { type: 'paragraph', content: 'Inserted A' },
                { type: 'paragraph', content: 'Inserted B' },
            ],
            'block-2',
            'before'
        )

        expect(result.length).toBe(2)
        expect(result[0].type).toBe('paragraph')
        expect(result[1].type).toBe('paragraph')

        const blocks = editor.document
        expect(blocks.length).toBe(5)
    })

    test('在参考块之后插入多个块', () => {
        const result = insertBlocks(
            editor,
            [
                { type: 'heading', props: { level: 2 }, content: 'Heading' },
                { type: 'paragraph', content: 'After Heading' },
            ],
            'block-1',
            'after'
        )

        expect(result.length).toBe(2)
        expect(result[0].type).toBe('heading')
        expect(result[1].type).toBe('paragraph')

        const blocks = editor.document
        expect(blocks.length).toBe(5)
    })

    test('使用 BlockIdentifier 对象作为参考块', () => {
        const result = insertBlocks(editor, [{ type: 'paragraph', content: 'Inserted' }], { id: 'block-2' }, 'before')

        expect(result.length).toBe(1)

        const blocks = editor.document
        expect(blocks.length).toBe(4)
    })

    test('默认插入位置为 before', () => {
        const result = insertBlocks(editor, [{ type: 'paragraph', content: 'Inserted' }], 'block-1')

        expect(result.length).toBe(1)

        const blocks = editor.document
        expect(blocks.length).toBe(4)
        expect(blocks[1].id).toBe('block-1')
    })

    test('插入的块包含内容', () => {
        const result = insertBlocks(editor, [{ type: 'paragraph', content: 'Hello World' }], 'block-2', 'before')

        expect(result.length).toBe(1)
        const insertedBlock = result[0]
        expect(insertedBlock.type).toBe('paragraph')

        const fetchedBlock = editor.getBlock(insertedBlock.id)
        expect(fetchedBlock).toBeDefined()
    })

    test('插入不同类型的块', () => {
        const result = insertBlocks(editor, [{ type: 'bulletListItem', content: 'List Item' }], 'block-1', 'after')

        expect(result.length).toBe(1)
        expect(result[0].type).toBe('bulletListItem')

        const blocks = editor.document
        expect(blocks.length).toBe(4)
    })

    test('在第一个块之前插入', () => {
        const result = insertBlocks(editor, [{ type: 'paragraph', content: 'New First' }], 'block-1', 'before')

        expect(result.length).toBe(1)

        const blocks = editor.document
        expect(blocks.length).toBe(4)
        expect(blocks[1].id).toBe('block-1')
    })

    test('在最后一个块之后插入', () => {
        const result = insertBlocks(editor, [{ type: 'paragraph', content: 'New Last' }], 'block-3', 'after')

        expect(result.length).toBe(1)

        const blocks = editor.document
        expect(blocks.length).toBe(4)
        expect(blocks[2].id).toBe('block-3')
    })
})
