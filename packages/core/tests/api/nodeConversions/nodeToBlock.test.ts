import { describe, test, expect, beforeEach } from 'vitest'
import { Node } from '@tiptap/pm/model'

import { LcwDocEditor } from '../../../src/editor/LcwDocEditor'
import { nodeToBlock, contentNodeToInlineContent, contentNodeToTableContent } from '../../../src/api/nodeConversions/nodeToBlock'

function getFirstBlockContainerNode(editor: LcwDocEditor): Node {
    let result: Node | undefined
    editor._tiptapEditor.state.doc.firstChild!.descendants(node => {
        if (node.type.name === 'blockContainer' && !result) {
            result = node
            return false
        }
        return true
    })
    if (!result) {
        throw new Error('No blockContainer node found')
    }
    return result
}

describe('nodeToBlock', () => {
    describe('基本转换', () => {
        let editor: LcwDocEditor

        beforeEach(() => {
            editor = LcwDocEditor.create({
                initialContent: [
                    {
                        type: 'paragraph',
                        id: 'test-paragraph-1',
                        content: 'Hello World',
                    },
                ],
            })
        })

        test('将 blockContainer 节点转换为 Block 对象', () => {
            const node = getFirstBlockContainerNode(editor)
            const block = nodeToBlock(
                node,
                editor.schema.blockSchema,
                editor.schema.inlineContentSchema,
                editor.schema.styleSchema
            )

            expect(block).toBeDefined()
            expect(block.id).toBe('test-paragraph-1')
            expect(block.type).toBe('paragraph')
        })

        test('转换的 Block 包含正确的内联内容', () => {
            const node = getFirstBlockContainerNode(editor)
            const block = nodeToBlock(
                node,
                editor.schema.blockSchema,
                editor.schema.inlineContentSchema,
                editor.schema.styleSchema
            )

            expect(block.content).toBeDefined()
            expect(Array.isArray(block.content)).toBe(true)
            expect(block.content).toHaveLength(1)
            expect((block.content as any[])[0]).toEqual({
                type: 'text',
                text: 'Hello World',
                styles: {},
            })
        })

        test('转换的 Block 包含空的 children 数组', () => {
            const node = getFirstBlockContainerNode(editor)
            const block = nodeToBlock(
                node,
                editor.schema.blockSchema,
                editor.schema.inlineContentSchema,
                editor.schema.styleSchema
            )

            expect(block.children).toBeDefined()
            expect(Array.isArray(block.children)).toBe(true)
            expect(block.children).toHaveLength(0)
        })
    })

    describe('非 blockContainer 节点', () => {
        test('传入非 blockContainer 节点时抛出错误', () => {
            const editor = LcwDocEditor.create({
                initialContent: [
                    {
                        type: 'paragraph',
                        id: 'test-err',
                    },
                ],
            })

            const blockGroupNode = editor._tiptapEditor.state.doc.firstChild!
            expect(() => {
                nodeToBlock(
                    blockGroupNode,
                    editor.schema.blockSchema,
                    editor.schema.inlineContentSchema,
                    editor.schema.styleSchema
                )
            }).toThrow('Node must be of type blockContainer')
        })
    })

    describe('缓存机制', () => {
        test('使用 blockCache 缓存已转换的 Block', () => {
            const editor = LcwDocEditor.create({
                initialContent: [
                    {
                        type: 'paragraph',
                        id: 'cache-test',
                        content: 'Cached',
                    },
                ],
            })

            const cache = new WeakMap<Node, any>()
            const node = getFirstBlockContainerNode(editor)

            const block1 = nodeToBlock(
                node,
                editor.schema.blockSchema,
                editor.schema.inlineContentSchema,
                editor.schema.styleSchema,
                cache
            )

            expect(cache.has(node)).toBe(true)

            const block2 = nodeToBlock(
                node,
                editor.schema.blockSchema,
                editor.schema.inlineContentSchema,
                editor.schema.styleSchema,
                cache
            )

            expect(block1).toBe(block2)
        })

        test('不传 blockCache 时不缓存', () => {
            const editor = LcwDocEditor.create({
                initialContent: [
                    {
                        type: 'paragraph',
                        id: 'no-cache-test',
                        content: 'No Cache',
                    },
                ],
            })

            const node = getFirstBlockContainerNode(editor)

            const block1 = nodeToBlock(
                node,
                editor.schema.blockSchema,
                editor.schema.inlineContentSchema,
                editor.schema.styleSchema
            )

            const block2 = nodeToBlock(
                node,
                editor.schema.blockSchema,
                editor.schema.inlineContentSchema,
                editor.schema.styleSchema
            )

            expect(block1).not.toBe(block2)
            expect(block1.id).toBe(block2.id)
        })
    })

    describe('带样式的段落', () => {
        test('转换带加粗样式的文本', () => {
            const editor = LcwDocEditor.create({
                initialContent: [
                    {
                        type: 'paragraph',
                        id: 'bold-test',
                        content: [
                            {
                                type: 'text',
                                text: 'Bold Text',
                                styles: { bold: true },
                            },
                        ],
                    },
                ],
            })

            const node = getFirstBlockContainerNode(editor)
            const block = nodeToBlock(
                node,
                editor.schema.blockSchema,
                editor.schema.inlineContentSchema,
                editor.schema.styleSchema
            )

            expect(block.content).toHaveLength(1)
            expect((block.content as any[])[0]).toEqual({
                type: 'text',
                text: 'Bold Text',
                styles: { bold: true },
            })
        })

        test('转换带多种样式的文本', () => {
            const editor = LcwDocEditor.create({
                initialContent: [
                    {
                        type: 'paragraph',
                        id: 'multi-style-test',
                        content: [
                            {
                                type: 'text',
                                text: 'Bold',
                                styles: { bold: true },
                            },
                            {
                                type: 'text',
                                text: 'Italic',
                                styles: { italic: true },
                            },
                        ],
                    },
                ],
            })

            const node = getFirstBlockContainerNode(editor)
            const block = nodeToBlock(
                node,
                editor.schema.blockSchema,
                editor.schema.inlineContentSchema,
                editor.schema.styleSchema
            )

            expect(block.content).toHaveLength(2)
            expect((block.content as any[])[0]).toEqual({
                type: 'text',
                text: 'Bold',
                styles: { bold: true },
            })
            expect((block.content as any[])[1]).toEqual({
                type: 'text',
                text: 'Italic',
                styles: { italic: true },
            })
        })
    })

    describe('链接内容', () => {
        test('转换包含链接的段落', () => {
            const editor = LcwDocEditor.create({
                initialContent: [
                    {
                        type: 'paragraph',
                        id: 'link-test',
                        content: [
                            {
                                type: 'link',
                                href: 'https://example.com',
                                content: 'Example',
                            },
                        ],
                    },
                ],
            })

            const node = getFirstBlockContainerNode(editor)
            const block = nodeToBlock(
                node,
                editor.schema.blockSchema,
                editor.schema.inlineContentSchema,
                editor.schema.styleSchema
            )

            expect(block.content).toHaveLength(1)
            expect((block.content as any[])[0]).toEqual({
                type: 'link',
                href: 'https://example.com',
                content: [
                    {
                        type: 'text',
                        text: 'Example',
                        styles: {},
                    },
                ],
            })
        })
    })

    describe('嵌套子块', () => {
        test('转换包含子块的段落', () => {
            const editor = LcwDocEditor.create({
                initialContent: [
                    {
                        type: 'paragraph',
                        id: 'parent-block',
                        content: 'Parent',
                        children: [
                            {
                                type: 'paragraph',
                                id: 'child-block-1',
                                content: 'Child 1',
                            },
                            {
                                type: 'paragraph',
                                id: 'child-block-2',
                                content: 'Child 2',
                            },
                        ],
                    },
                ],
            })

            const node = getFirstBlockContainerNode(editor)
            const block = nodeToBlock(
                node,
                editor.schema.blockSchema,
                editor.schema.inlineContentSchema,
                editor.schema.styleSchema
            )

            expect(block.children).toHaveLength(2)
            expect(block.children[0].id).toBe('child-block-1')
            expect(block.children[0].type).toBe('paragraph')
            expect(block.children[1].id).toBe('child-block-2')
        })
    })

    describe('不同块类型', () => {
        test('转换标题块', () => {
            const editor = LcwDocEditor.create({
                initialContent: [
                    {
                        type: 'heading',
                        id: 'heading-test',
                        props: { level: 2 },
                        content: 'Heading 2',
                    },
                ],
            })

            const node = getFirstBlockContainerNode(editor)
            const block = nodeToBlock(
                node,
                editor.schema.blockSchema,
                editor.schema.inlineContentSchema,
                editor.schema.styleSchema
            )

            expect(block.type).toBe('heading')
            expect((block.props as any).level).toBe(2)
        })

        test('转换列表项块', () => {
            const editor = LcwDocEditor.create({
                initialContent: [
                    {
                        type: 'bulletListItem',
                        id: 'bullet-test',
                        content: 'Bullet Item',
                    },
                ],
            })

            const node = getFirstBlockContainerNode(editor)
            const block = nodeToBlock(
                node,
                editor.schema.blockSchema,
                editor.schema.inlineContentSchema,
                editor.schema.styleSchema
            )

            expect(block.type).toBe('bulletListItem')
        })

        test('转换勾选列表项块', () => {
            const editor = LcwDocEditor.create({
                initialContent: [
                    {
                        type: 'checkListItem',
                        id: 'check-test',
                        props: { checked: true },
                        content: 'Checked Item',
                    },
                ],
            })

            const node = getFirstBlockContainerNode(editor)
            const block = nodeToBlock(
                node,
                editor.schema.blockSchema,
                editor.schema.inlineContentSchema,
                editor.schema.styleSchema
            )

            expect(block.type).toBe('checkListItem')
            expect((block.props as any).checked).toBe(true)
        })
    })

    describe('空内容块', () => {
        test('转换空段落', () => {
            const editor = LcwDocEditor.create({
                initialContent: [
                    {
                        type: 'paragraph',
                        id: 'empty-para',
                    },
                ],
            })

            const node = getFirstBlockContainerNode(editor)
            const block = nodeToBlock(
                node,
                editor.schema.blockSchema,
                editor.schema.inlineContentSchema,
                editor.schema.styleSchema
            )

            expect(block.type).toBe('paragraph')
            expect(block.content).toHaveLength(0)
        })
    })

    describe('自动生成 ID', () => {
        test('当节点 ID 为 null 时自动生成 ID', () => {
            const editor = LcwDocEditor.create({
                initialContent: [
                    {
                        type: 'paragraph',
                        content: 'Auto ID',
                    },
                ],
            })

            const node = getFirstBlockContainerNode(editor)
            const block = nodeToBlock(
                node,
                editor.schema.blockSchema,
                editor.schema.inlineContentSchema,
                editor.schema.styleSchema
            )

            expect(block.id).toBeDefined()
            expect(typeof block.id).toBe('string')
            expect(block.id.length).toBeGreaterThan(0)
        })
    })
})

describe('contentNodeToInlineContent', () => {
    let editor: LcwDocEditor

    beforeEach(() => {
        editor = LcwDocEditor.create({
            initialContent: [
                {
                    type: 'paragraph',
                    id: 'test-para',
                    content: 'Hello World',
                },
            ],
        })
    })

    test('将内容节点转换为内联内容数组', () => {
        let blockContentNode: Node | undefined
        editor._tiptapEditor.state.doc.descendants(node => {
            if (node.type.spec.group === 'blockContent' && !blockContentNode) {
                blockContentNode = node
                return false
            }
            return true
        })

        const inlineContent = contentNodeToInlineContent(
            blockContentNode!,
            editor.schema.inlineContentSchema,
            editor.schema.styleSchema
        )

        expect(Array.isArray(inlineContent)).toBe(true)
        expect(inlineContent).toHaveLength(1)
        expect(inlineContent[0]).toEqual({
            type: 'text',
            text: 'Hello World',
            styles: {},
        })
    })

    test('合并相同样式的连续文本', () => {
        const editor2 = LcwDocEditor.create({
            initialContent: [
                {
                    type: 'paragraph',
                    id: 'merge-test',
                    content: [
                        {
                            type: 'text',
                            text: 'Hello ',
                            styles: {},
                        },
                        {
                            type: 'text',
                            text: 'World',
                            styles: {},
                        },
                    ],
                },
            ],
        })

        let blockContentNode: Node | undefined
        editor2._tiptapEditor.state.doc.descendants(node => {
            if (node.type.spec.group === 'blockContent' && !blockContentNode) {
                blockContentNode = node
                return false
            }
            return true
        })

        const inlineContent = contentNodeToInlineContent(
            blockContentNode!,
            editor2.schema.inlineContentSchema,
            editor2.schema.styleSchema
        )

        expect(inlineContent).toHaveLength(1)
        expect(inlineContent[0]).toEqual({
            type: 'text',
            text: 'Hello World',
            styles: {},
        })
    })
})

describe('contentNodeToTableContent', () => {
    test('将表格内容节点转换为表格内容', () => {
        const editor = LcwDocEditor.create({
            initialContent: [
                {
                    type: 'table',
                    id: 'table-test',
                    content: {
                        type: 'tableContent',
                        rows: [
                            { cells: ['Cell 1', 'Cell 2'] },
                            { cells: ['Cell 3', 'Cell 4'] },
                        ],
                    },
                },
            ],
        })

        let tableNode: Node | undefined
        editor._tiptapEditor.state.doc.descendants(node => {
            if (node.type.name === 'table' && !tableNode) {
                tableNode = node
                return false
            }
            return true
        })

        const tableContent = contentNodeToTableContent(
            tableNode!,
            editor.schema.inlineContentSchema,
            editor.schema.styleSchema
        )

        expect(tableContent.type).toBe('tableContent')
        expect(tableContent.rows).toHaveLength(2)
        expect(tableContent.rows[0].cells).toHaveLength(2)
        expect(tableContent.rows[1].cells).toHaveLength(2)
    })
})
