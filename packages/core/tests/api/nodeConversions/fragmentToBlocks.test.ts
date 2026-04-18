import { describe, test, expect, beforeEach } from 'vitest'
import { Fragment } from '@tiptap/pm/model'

import { LcwDocEditor } from '../../../src/editor/LcwDocEditor'
import { fragmentToBlocks } from '../../../src/api/nodeConversions/fragmentToBlocks'

describe('fragmentToBlocks', () => {
    describe('基本转换', () => {
        let editor: LcwDocEditor

        beforeEach(() => {
            editor = LcwDocEditor.create({
                initialContent: [
                    {
                        type: 'paragraph',
                        id: 'para-1',
                        content: 'First paragraph',
                    },
                    {
                        type: 'paragraph',
                        id: 'para-2',
                        content: 'Second paragraph',
                    },
                ],
            })
        })

        test('将 Fragment 转换为 Block 数组', () => {
            const doc = editor._tiptapEditor.state.doc
            const blockGroup = doc.firstChild!
            const fragment = blockGroup.content

            const blocks = fragmentToBlocks(fragment, editor.schema)

            expect(blocks).toHaveLength(2)
            expect(blocks[0].id).toBe('para-1')
            expect(blocks[1].id).toBe('para-2')
        })

        test('转换后的 Block 包含正确的内容', () => {
            const doc = editor._tiptapEditor.state.doc
            const blockGroup = doc.firstChild!
            const fragment = blockGroup.content

            const blocks = fragmentToBlocks(fragment, editor.schema)

            expect(blocks[0].type).toBe('paragraph')
            expect(blocks[0].content).toHaveLength(1)
            expect((blocks[0].content as any[])[0]).toEqual({
                type: 'text',
                text: 'First paragraph',
                styles: {},
            })
        })
    })

    describe('单个块', () => {
        test('转换包含单个块的 Fragment', () => {
            const editor = LcwDocEditor.create({
                initialContent: [
                    {
                        type: 'paragraph',
                        id: 'single-para',
                        content: 'Only one',
                    },
                ],
            })

            const doc = editor._tiptapEditor.state.doc
            const blockGroup = doc.firstChild!
            const fragment = blockGroup.content

            const blocks = fragmentToBlocks(fragment, editor.schema)

            expect(blocks).toHaveLength(1)
            expect(blocks[0].id).toBe('single-para')
        })
    })

    describe('嵌套子块', () => {
        test('只提取顶层 blockContainer，嵌套的由父节点处理', () => {
            const editor = LcwDocEditor.create({
                initialContent: [
                    {
                        type: 'paragraph',
                        id: 'parent-para',
                        content: 'Parent',
                        children: [
                            {
                                type: 'paragraph',
                                id: 'child-para',
                                content: 'Child',
                            },
                        ],
                    },
                ],
            })

            const doc = editor._tiptapEditor.state.doc
            const blockGroup = doc.firstChild!
            const fragment = blockGroup.content

            const blocks = fragmentToBlocks(fragment, editor.schema)

            expect(blocks).toHaveLength(1)
            expect(blocks[0].id).toBe('parent-para')
            expect(blocks[0].children).toHaveLength(1)
            expect(blocks[0].children[0].id).toBe('child-para')
        })

        test('多层嵌套的块结构', () => {
            const editor = LcwDocEditor.create({
                initialContent: [
                    {
                        type: 'bulletListItem',
                        id: 'item-1',
                        content: 'Item 1',
                        children: [
                            {
                                type: 'bulletListItem',
                                id: 'item-1-1',
                                content: 'Item 1.1',
                                children: [
                                    {
                                        type: 'paragraph',
                                        id: 'item-1-1-1',
                                        content: 'Item 1.1.1',
                                    },
                                ],
                            },
                        ],
                    },
                ],
            })

            const doc = editor._tiptapEditor.state.doc
            const blockGroup = doc.firstChild!
            const fragment = blockGroup.content

            const blocks = fragmentToBlocks(fragment, editor.schema)

            expect(blocks).toHaveLength(1)
            expect(blocks[0].id).toBe('item-1')
            expect(blocks[0].children).toHaveLength(1)
            expect(blocks[0].children[0].id).toBe('item-1-1')
            expect(blocks[0].children[0].children).toHaveLength(1)
            expect(blocks[0].children[0].children[0].id).toBe('item-1-1-1')
        })
    })

    describe('不同块类型', () => {
        test('转换多种类型的块', () => {
            const editor = LcwDocEditor.create({
                initialContent: [
                    {
                        type: 'heading',
                        id: 'heading-1',
                        props: { level: 1 },
                        content: 'Title',
                    },
                    {
                        type: 'paragraph',
                        id: 'para-1',
                        content: 'Content',
                    },
                    {
                        type: 'bulletListItem',
                        id: 'bullet-1',
                        content: 'Bullet',
                    },
                ],
            })

            const doc = editor._tiptapEditor.state.doc
            const blockGroup = doc.firstChild!
            const fragment = blockGroup.content

            const blocks = fragmentToBlocks(fragment, editor.schema)

            expect(blocks).toHaveLength(3)
            expect(blocks[0].type).toBe('heading')
            expect(blocks[1].type).toBe('paragraph')
            expect(blocks[2].type).toBe('bulletListItem')
        })

        test('转换编号列表项', () => {
            const editor = LcwDocEditor.create({
                initialContent: [
                    {
                        type: 'numberedListItem',
                        id: 'numbered-1',
                        content: 'Numbered Item',
                    },
                ],
            })

            const doc = editor._tiptapEditor.state.doc
            const blockGroup = doc.firstChild!
            const fragment = blockGroup.content

            const blocks = fragmentToBlocks(fragment, editor.schema)

            expect(blocks).toHaveLength(1)
            expect(blocks[0].type).toBe('numberedListItem')
        })

        test('转换勾选列表项', () => {
            const editor = LcwDocEditor.create({
                initialContent: [
                    {
                        type: 'checkListItem',
                        id: 'check-1',
                        props: { checked: true },
                        content: 'Checked',
                    },
                ],
            })

            const doc = editor._tiptapEditor.state.doc
            const blockGroup = doc.firstChild!
            const fragment = blockGroup.content

            const blocks = fragmentToBlocks(fragment, editor.schema)

            expect(blocks).toHaveLength(1)
            expect(blocks[0].type).toBe('checkListItem')
            expect((blocks[0].props as any).checked).toBe(true)
        })
    })

    describe('空 Fragment', () => {
        test('转换空 Fragment 返回空数组', () => {
            const editor = LcwDocEditor.create({
                initialContent: [
                    {
                        type: 'paragraph',
                        id: 'dummy',
                    },
                ],
            })

            const emptyFragment = Fragment.from([])

            const blocks = fragmentToBlocks(emptyFragment, editor.schema)

            expect(blocks).toHaveLength(0)
        })
    })

    describe('带样式的块', () => {
        test('转换带样式的段落', () => {
            const editor = LcwDocEditor.create({
                initialContent: [
                    {
                        type: 'paragraph',
                        id: 'styled-para',
                        content: [
                            {
                                type: 'text',
                                text: 'Bold',
                                styles: { bold: true },
                            },
                            {
                                type: 'text',
                                text: ' Normal',
                                styles: {},
                            },
                        ],
                    },
                ],
            })

            const doc = editor._tiptapEditor.state.doc
            const blockGroup = doc.firstChild!
            const fragment = blockGroup.content

            const blocks = fragmentToBlocks(fragment, editor.schema)

            expect(blocks).toHaveLength(1)
            expect(blocks[0].content).toHaveLength(2)
            expect((blocks[0].content as any[])[0]).toEqual({
                type: 'text',
                text: 'Bold',
                styles: { bold: true },
            })
        })
    })

    describe('链接内容', () => {
        test('转换包含链接的段落', () => {
            const editor = LcwDocEditor.create({
                initialContent: [
                    {
                        type: 'paragraph',
                        id: 'link-para',
                        content: [
                            {
                                type: 'link',
                                href: 'https://example.com',
                                content: 'Link',
                            },
                        ],
                    },
                ],
            })

            const doc = editor._tiptapEditor.state.doc
            const blockGroup = doc.firstChild!
            const fragment = blockGroup.content

            const blocks = fragmentToBlocks(fragment, editor.schema)

            expect(blocks).toHaveLength(1)
            expect((blocks[0].content as any[])[0]).toEqual({
                type: 'link',
                href: 'https://example.com',
                content: [
                    {
                        type: 'text',
                        text: 'Link',
                        styles: {},
                    },
                ],
            })
        })
    })
})
