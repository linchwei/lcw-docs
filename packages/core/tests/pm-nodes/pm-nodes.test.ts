import { describe, test, expect } from 'vitest'
import { Doc } from '../../src/pm-nodes/Doc'
import { BlockContainer } from '../../src/pm-nodes/BlockContainer'
import { BlockGroup } from '../../src/pm-nodes/BlockGroup'
import { Schema } from '@tiptap/pm/model'

const createMockSchema = () => {
    return new Schema({
        nodes: {
            doc: { content: 'blockGroup' },
            blockGroup: { content: 'blockContainer+' },
            blockContainer: {
                group: 'blockContainer',
                content: 'blockContent blockGroup?',
                parseDOM: [{ tag: 'div' }],
                toDOM() {
                    return ['div', { 'data-node-type': 'blockContainer' }, 0]
                },
            },
            blockContent: { content: 'text*' },
            text: {},
        },
    })
}

describe('pm-nodes', () => {
    describe('Doc', () => {
        test('Doc 节点名称为 doc', () => {
            expect(Doc.name).toBe('doc')
        })

        test('Doc 节点可以在 schema 中正确创建', () => {
            const schema = createMockSchema()
            const docNode = schema.nodes.doc.create()
            expect(docNode).toBeDefined()
            expect(docNode.type.name).toBe('doc')
        })

        test('Doc 节点可以包含 blockGroup 子节点', () => {
            const schema = createMockSchema()
            const docNode = schema.nodes.doc.create(null, [
                schema.nodes.blockGroup.create(),
            ])
            expect(docNode.type.name).toBe('doc')
            expect(docNode.childCount).toBe(1)
            expect(docNode.firstChild?.type.name).toBe('blockGroup')
        })

        test('Doc 节点可以不包含子节点', () => {
            const schema = createMockSchema()
            const docNode = schema.nodes.doc.create()
            expect(docNode.childCount).toBe(0)
        })
    })

    describe('BlockContainer', () => {
        test('BlockContainer 节点名称为 blockContainer', () => {
            expect(BlockContainer.name).toBe('blockContainer')
        })

        test('可以创建 BlockContainer 节点实例', () => {
            const schema = createMockSchema()
            const blockContainer = schema.nodes.blockContainer.create()
            expect(blockContainer.type.name).toBe('blockContainer')
        })

        test('BlockContainer 可以包含子节点', () => {
            const schema = createMockSchema()
            const blockContainer = schema.nodes.blockContainer.create(null, [
                schema.nodes.blockContent.create(),
            ])
            expect(blockContainer.childCount).toBe(1)
        })

        test('BlockContainer 可以作为 blockGroup 的子节点', () => {
            const schema = createMockSchema()
            const blockGroup = schema.nodes.blockGroup.create(null, [
                schema.nodes.blockContainer.create(),
            ])
            expect(blockGroup.childCount).toBe(1)
            expect(blockGroup.firstChild?.type.name).toBe('blockContainer')
        })
    })

    describe('BlockGroup', () => {
        test('BlockGroup 节点名称为 blockGroup', () => {
            expect(BlockGroup.name).toBe('blockGroup')
        })

        test('可以创建 BlockGroup 节点实例', () => {
            const schema = createMockSchema()
            const blockGroup = schema.nodes.blockGroup.create()
            expect(blockGroup).toBeDefined()
            expect(blockGroup.type.name).toBe('blockGroup')
        })

        test('BlockGroup 可以包含多个 blockContainer', () => {
            const schema = createMockSchema()
            const blockGroup = schema.nodes.blockGroup.create(null, [
                schema.nodes.blockContainer.create(),
                schema.nodes.blockContainer.create(),
                schema.nodes.blockContainer.create(),
            ])
            expect(blockGroup.childCount).toBe(3)
        })

        test('空的 BlockGroup 节点可以创建', () => {
            const schema = createMockSchema()
            const blockGroup = schema.nodes.blockGroup.create()
            expect(blockGroup.childCount).toBe(0)
        })
    })

    describe('节点层级结构', () => {
        test('完整的文档结构：doc > blockGroup > blockContainer > blockContent', () => {
            const schema = createMockSchema()
            const doc = schema.nodes.doc.create(null, [
                schema.nodes.blockGroup.create(null, [
                    schema.nodes.blockContainer.create(null, [
                        schema.nodes.blockContent.create(),
                    ]),
                ]),
            ])

            expect(doc.type.name).toBe('doc')
            expect(doc.firstChild?.type.name).toBe('blockGroup')
            expect(doc.firstChild?.firstChild?.type.name).toBe('blockContainer')
            expect(doc.firstChild?.firstChild?.firstChild?.type.name).toBe('blockContent')
        })

        test('blockGroup 可以包含多个 blockContainer', () => {
            const schema = createMockSchema()
            const blockGroup = schema.nodes.blockGroup.create(null, [
                schema.nodes.blockContainer.create(),
                schema.nodes.blockContainer.create(),
            ])

            expect(blockGroup.childCount).toBe(2)
            expect(blockGroup.firstChild?.type.name).toBe('blockContainer')
            expect(blockGroup.lastChild?.type.name).toBe('blockContainer')
        })
    })
})