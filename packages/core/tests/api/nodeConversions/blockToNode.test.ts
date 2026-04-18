import { describe, test, expect, beforeEach } from 'vitest'

import { LcwDocEditor } from '../../../src/editor/LcwDocEditor'
import { blockToNode, inlineContentToNodes, tableContentToNodes } from '../../../src/api/nodeConversions/blockToNode'

describe('blockToNode', () => {
    let editor: LcwDocEditor

    beforeEach(() => {
        editor = LcwDocEditor.create({
            initialContent: [
                {
                    type: 'paragraph',
                    id: 'init-para',
                },
            ],
        })
    })

    describe('基本转换', () => {
        test('将简单段落 Block 转换为 blockContainer 节点', () => {
            const node = blockToNode(
                {
                    type: 'paragraph',
                    id: 'test-para-1',
                    content: 'Hello World',
                },
                editor.pmSchema,
                editor.schema.styleSchema
            )

            expect(node).toBeDefined()
            expect(node.type.name).toBe('blockContainer')
            expect(node.attrs.id).toBe('test-para-1')
        })

        test('转换的 blockContainer 包含 blockContent 子节点', () => {
            const node = blockToNode(
                {
                    type: 'paragraph',
                    id: 'test-para-2',
                    content: 'Hello',
                },
                editor.pmSchema,
                editor.schema.styleSchema
            )

            const blockContent = node.firstChild
            expect(blockContent).toBeDefined()
            expect(blockContent!.type.spec.group).toBe('blockContent')
        })

        test('转换的 blockContent 包含正确的文本', () => {
            const node = blockToNode(
                {
                    type: 'paragraph',
                    id: 'test-para-3',
                    content: 'Hello World',
                },
                editor.pmSchema,
                editor.schema.styleSchema
            )

            const blockContent = node.firstChild!
            expect(blockContent.textContent).toBe('Hello World')
        })
    })

    describe('自动生成 ID', () => {
        test('不提供 ID 时自动生成', () => {
            const node = blockToNode(
                {
                    type: 'paragraph',
                    content: 'Auto ID',
                },
                editor.pmSchema,
                editor.schema.styleSchema
            )

            expect(node.attrs.id).toBeDefined()
            expect(typeof node.attrs.id).toBe('string')
            expect(node.attrs.id.length).toBeGreaterThan(0)
        })
    })

    describe('带样式的文本', () => {
        test('转换带加粗样式的文本', () => {
            const node = blockToNode(
                {
                    type: 'paragraph',
                    id: 'bold-test',
                    content: [
                        {
                            type: 'text',
                            text: 'Bold',
                            styles: { bold: true },
                        },
                    ],
                },
                editor.pmSchema,
                editor.schema.styleSchema
            )

            const blockContent = node.firstChild!
            expect(blockContent.textContent).toBe('Bold')

            const textNode = blockContent.firstChild!
            const hasBoldMark = textNode.marks.some(m => m.type.name === 'bold')
            expect(hasBoldMark).toBe(true)
        })

        test('转换带斜体样式的文本', () => {
            const node = blockToNode(
                {
                    type: 'paragraph',
                    id: 'italic-test',
                    content: [
                        {
                            type: 'text',
                            text: 'Italic',
                            styles: { italic: true },
                        },
                    ],
                },
                editor.pmSchema,
                editor.schema.styleSchema
            )

            const blockContent = node.firstChild!
            const textNode = blockContent.firstChild!
            const hasItalicMark = textNode.marks.some(m => m.type.name === 'italic')
            expect(hasItalicMark).toBe(true)
        })

        test('转换带多种样式的文本', () => {
            const node = blockToNode(
                {
                    type: 'paragraph',
                    id: 'multi-style-test',
                    content: [
                        {
                            type: 'text',
                            text: 'Bold Italic',
                            styles: { bold: true, italic: true },
                        },
                    ],
                },
                editor.pmSchema,
                editor.schema.styleSchema
            )

            const blockContent = node.firstChild!
            const textNode = blockContent.firstChild!
            const hasBoldMark = textNode.marks.some(m => m.type.name === 'bold')
            const hasItalicMark = textNode.marks.some(m => m.type.name === 'italic')
            expect(hasBoldMark).toBe(true)
            expect(hasItalicMark).toBe(true)
        })
    })

    describe('链接内容', () => {
        test('转换包含链接的段落', () => {
            const node = blockToNode(
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
                editor.pmSchema,
                editor.schema.styleSchema
            )

            const blockContent = node.firstChild!
            const textNode = blockContent.firstChild!
            expect(textNode.textContent).toBe('Example')

            const hasLinkMark = textNode.marks.some(m => m.type.name === 'link')
            expect(hasLinkMark).toBe(true)

            const linkMark = textNode.marks.find(m => m.type.name === 'link')
            expect(linkMark!.attrs.href).toBe('https://example.com')
        })

        test('转换包含带样式链接的段落', () => {
            const node = blockToNode(
                {
                    type: 'paragraph',
                    id: 'styled-link-test',
                    content: [
                        {
                            type: 'link',
                            href: 'https://example.com',
                            content: [
                                {
                                    type: 'text',
                                    text: 'Bold Link',
                                    styles: { bold: true },
                                },
                            ],
                        },
                    ],
                },
                editor.pmSchema,
                editor.schema.styleSchema
            )

            const blockContent = node.firstChild!
            const textNode = blockContent.firstChild!
            expect(textNode.textContent).toBe('Bold Link')

            const hasBoldMark = textNode.marks.some(m => m.type.name === 'bold')
            const hasLinkMark = textNode.marks.some(m => m.type.name === 'link')
            expect(hasBoldMark).toBe(true)
            expect(hasLinkMark).toBe(true)
        })
    })

    describe('换行符处理', () => {
        test('将换行符转换为 hardBreak 节点', () => {
            const node = blockToNode(
                {
                    type: 'paragraph',
                    id: 'linebreak-test',
                    content: 'Line 1\nLine 2',
                },
                editor.pmSchema,
                editor.schema.styleSchema
            )

            const blockContent = node.firstChild!
            expect(blockContent.childCount).toBe(3)
            expect(blockContent.child(0).textContent).toBe('Line 1')
            expect(blockContent.child(1).type.name).toBe('hardBreak')
            expect(blockContent.child(2).textContent).toBe('Line 2')
        })

        test('多个换行符', () => {
            const node = blockToNode(
                {
                    type: 'paragraph',
                    id: 'multi-break-test',
                    content: 'A\nB\nC',
                },
                editor.pmSchema,
                editor.schema.styleSchema
            )

            const blockContent = node.firstChild!
            expect(blockContent.childCount).toBe(5)
            expect(blockContent.child(0).textContent).toBe('A')
            expect(blockContent.child(1).type.name).toBe('hardBreak')
            expect(blockContent.child(2).textContent).toBe('B')
            expect(blockContent.child(3).type.name).toBe('hardBreak')
            expect(blockContent.child(4).textContent).toBe('C')
        })
    })

    describe('子块', () => {
        test('转换包含子块的段落', () => {
            const node = blockToNode(
                {
                    type: 'paragraph',
                    id: 'parent-para',
                    content: 'Parent',
                    children: [
                        {
                            type: 'paragraph',
                            id: 'child-1',
                            content: 'Child 1',
                        },
                        {
                            type: 'paragraph',
                            id: 'child-2',
                            content: 'Child 2',
                        },
                    ],
                },
                editor.pmSchema,
                editor.schema.styleSchema
            )

            expect(node.type.name).toBe('blockContainer')
            expect(node.childCount).toBe(2)

            const blockContent = node.firstChild!
            expect(blockContent.textContent).toBe('Parent')

            const blockGroup = node.child(1)!
            expect(blockGroup.type.name).toBe('blockGroup')
            expect(blockGroup.childCount).toBe(2)
            expect(blockGroup.child(0).attrs.id).toBe('child-1')
            expect(blockGroup.child(1).attrs.id).toBe('child-2')
        })

        test('没有子块时不创建 blockGroup 节点', () => {
            const node = blockToNode(
                {
                    type: 'paragraph',
                    id: 'no-children',
                    content: 'No children',
                },
                editor.pmSchema,
                editor.schema.styleSchema
            )

            expect(node.childCount).toBe(1)
            expect(node.firstChild!.type.spec.group).toBe('blockContent')
        })
    })

    describe('不同块类型', () => {
        test('转换标题块', () => {
            const node = blockToNode(
                {
                    type: 'heading',
                    id: 'heading-test',
                    props: { level: 2 },
                    content: 'Heading 2',
                },
                editor.pmSchema,
                editor.schema.styleSchema
            )

            const blockContent = node.firstChild!
            expect(blockContent.type.name).toBe('heading')
            expect(blockContent.attrs.level).toBe(2)
            expect(blockContent.textContent).toBe('Heading 2')
        })

        test('转换列表项块', () => {
            const node = blockToNode(
                {
                    type: 'bulletListItem',
                    id: 'bullet-test',
                    content: 'Bullet Item',
                },
                editor.pmSchema,
                editor.schema.styleSchema
            )

            const blockContent = node.firstChild!
            expect(blockContent.type.name).toBe('bulletListItem')
        })

        test('转换编号列表项块', () => {
            const node = blockToNode(
                {
                    type: 'numberedListItem',
                    id: 'numbered-test',
                    content: 'Numbered Item',
                },
                editor.pmSchema,
                editor.schema.styleSchema
            )

            const blockContent = node.firstChild!
            expect(blockContent.type.name).toBe('numberedListItem')
        })

        test('转换勾选列表项块', () => {
            const node = blockToNode(
                {
                    type: 'checkListItem',
                    id: 'check-test',
                    props: { checked: true },
                    content: 'Checked Item',
                },
                editor.pmSchema,
                editor.schema.styleSchema
            )

            const blockContent = node.firstChild!
            expect(blockContent.type.name).toBe('checkListItem')
            expect(blockContent.attrs.checked).toBe(true)
        })
    })

    describe('空内容块', () => {
        test('转换空段落', () => {
            const node = blockToNode(
                {
                    type: 'paragraph',
                    id: 'empty-para',
                },
                editor.pmSchema,
                editor.schema.styleSchema
            )

            const blockContent = node.firstChild!
            expect(blockContent.type.name).toBe('paragraph')
        })
    })

    describe('字符串内容', () => {
        test('字符串内容被转换为内联内容', () => {
            const node = blockToNode(
                {
                    type: 'paragraph',
                    id: 'string-content',
                    content: 'Simple string',
                },
                editor.pmSchema,
                editor.schema.styleSchema
            )

            const blockContent = node.firstChild!
            expect(blockContent.textContent).toBe('Simple string')
        })
    })

    describe('表格内容', () => {
        test('转换包含表格的块', () => {
            const node = blockToNode(
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
                editor.pmSchema,
                editor.schema.styleSchema
            )

            const blockContent = node.firstChild!
            expect(blockContent.type.name).toBe('table')
        })
    })

    describe('块属性', () => {
        test('块的 props 被正确设置到节点属性', () => {
            const node = blockToNode(
                {
                    type: 'paragraph',
                    id: 'props-test',
                    props: {
                        textAlignment: 'center',
                        textColor: 'red',
                        backgroundColor: 'blue',
                    },
                    content: 'Props test',
                },
                editor.pmSchema,
                editor.schema.styleSchema
            )

            const blockContent = node.firstChild!
            expect(blockContent.attrs.textAlignment).toBe('center')
            expect(node.attrs.textColor).toBe('red')
            expect(node.attrs.backgroundColor).toBe('blue')
        })
    })
})

describe('inlineContentToNodes', () => {
    let editor: LcwDocEditor

    beforeEach(() => {
        editor = LcwDocEditor.create({
            initialContent: [
                {
                    type: 'paragraph',
                    id: 'init-para',
                },
            ],
        })
    })

    test('将字符串内容转换为文本节点', () => {
        const nodes = inlineContentToNodes(
            ['Hello'],
            editor.pmSchema,
            editor.schema.styleSchema
        )

        expect(nodes).toHaveLength(1)
        expect(nodes[0].type.name).toBe('text')
        expect(nodes[0].textContent).toBe('Hello')
    })

    test('将带样式文本转换为带标记的文本节点', () => {
        const nodes = inlineContentToNodes(
            [
                {
                    type: 'text',
                    text: 'Bold',
                    styles: { bold: true },
                },
            ],
            editor.pmSchema,
            editor.schema.styleSchema
        )

        expect(nodes).toHaveLength(1)
        expect(nodes[0].textContent).toBe('Bold')
        const hasBoldMark = nodes[0].marks.some(m => m.type.name === 'bold')
        expect(hasBoldMark).toBe(true)
    })

    test('将链接转换为带链接标记的文本节点', () => {
        const nodes = inlineContentToNodes(
            [
                {
                    type: 'link',
                    href: 'https://example.com',
                    content: 'Example',
                },
            ],
            editor.pmSchema,
            editor.schema.styleSchema
        )

        expect(nodes).toHaveLength(1)
        const hasLinkMark = nodes[0].marks.some(m => m.type.name === 'link')
        expect(hasLinkMark).toBe(true)
    })

    test('混合内容转换', () => {
        const nodes = inlineContentToNodes(
            [
                'Plain ',
                {
                    type: 'text',
                    text: 'Bold',
                    styles: { bold: true },
                },
                {
                    type: 'link',
                    href: 'https://example.com',
                    content: 'Link',
                },
            ],
            editor.pmSchema,
            editor.schema.styleSchema
        )

        expect(nodes.length).toBeGreaterThanOrEqual(3)
    })
})

describe('tableContentToNodes', () => {
    let editor: LcwDocEditor

    beforeEach(() => {
        editor = LcwDocEditor.create({
            initialContent: [
                {
                    type: 'paragraph',
                    id: 'init-para',
                },
            ],
        })
    })

    test('将表格内容转换为行节点数组', () => {
        const rowNodes = tableContentToNodes(
            {
                type: 'tableContent',
                rows: [
                    { cells: ['Cell 1', 'Cell 2'] },
                    { cells: ['Cell 3', 'Cell 4'] },
                ],
            },
            editor.pmSchema,
            editor.schema.styleSchema
        )

        expect(rowNodes).toHaveLength(2)
        expect(rowNodes[0].type.name).toBe('tableRow')
        expect(rowNodes[1].type.name).toBe('tableRow')
    })

    test('每行包含正确数量的单元格', () => {
        const rowNodes = tableContentToNodes(
            {
                type: 'tableContent',
                rows: [
                    { cells: ['A', 'B', 'C'] },
                ],
            },
            editor.pmSchema,
            editor.schema.styleSchema
        )

        const row = rowNodes[0]
        expect(row.childCount).toBe(3)
    })

    test('单元格内容正确', () => {
        const rowNodes = tableContentToNodes(
            {
                type: 'tableContent',
                rows: [
                    { cells: ['Hello'] },
                ],
            },
            editor.pmSchema,
            editor.schema.styleSchema
        )

        const cell = rowNodes[0].child(0)
        expect(cell.type.name).toBe('tableCell')
        const paragraph = cell.firstChild!
        expect(paragraph.textContent).toBe('Hello')
    })

    test('带列宽的表格', () => {
        const rowNodes = tableContentToNodes(
            {
                type: 'tableContent',
                columnWidths: [100, 200],
                rows: [
                    { cells: ['A', 'B'] },
                ],
            },
            editor.pmSchema,
            editor.schema.styleSchema
        )

        const cell1 = rowNodes[0].child(0)
        const cell2 = rowNodes[0].child(1)
        expect(cell1.attrs.colwidth).toEqual([100])
        expect(cell2.attrs.colwidth).toEqual([200])
    })
})
