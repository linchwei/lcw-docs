import { describe, test, expect } from 'vitest'
import { Schema } from 'prosemirror-model'
import { getNodeById } from '../../src/api/nodeUtil'

const createTestSchema = () => {
    return new Schema({
        nodes: {
            doc: { content: 'blockGroup' },
            blockGroup: { content: 'blockContainer+' },
            blockContainer: {
                group: 'blockContainer',
                content: 'blockContent blockGroup?',
                attrs: { id: { default: '' } },
                toDOM() {
                    return ['div', { 'data-node-type': 'blockContainer' }, 0]
                },
            },
            blockContent: {
                group: 'blockContent',
                content: 'inline*',
                toDOM() {
                    return ['div', { 'data-node-type': 'blockContent' }, 0]
                },
            },
            text: { group: 'inline' },
        },
        marks: {},
    })
}

const createDocWithBlocks = (schema: Schema, ids: string[]) => {
    const containers = ids.map(id =>
        schema.nodes.blockContainer.create({ id }, [
            schema.nodes.blockContent.create(),
        ])
    )
    return schema.nodes.doc.create(null, [
        schema.nodes.blockGroup.create(null, containers),
    ])
}

const createDocWithNestedBlocks = (schema: Schema) => {
    const childContainer = schema.nodes.blockContainer.create({ id: 'child-block' }, [
        schema.nodes.blockContent.create(),
    ])
    const parentContainer = schema.nodes.blockContainer.create({ id: 'parent-block' }, [
        schema.nodes.blockContent.create(),
        schema.nodes.blockGroup.create(null, [childContainer]),
    ])
    const siblingContainer = schema.nodes.blockContainer.create({ id: 'sibling-block' }, [
        schema.nodes.blockContent.create(),
    ])
    return schema.nodes.doc.create(null, [
        schema.nodes.blockGroup.create(null, [parentContainer, siblingContainer]),
    ])
}

describe('api/nodeUtil', () => {
    describe('getNodeById', () => {
        test('通过 ID 查找存在的 blockContainer 节点', () => {
            const schema = createTestSchema()
            const doc = createDocWithBlocks(schema, ['block-0', 'block-1', 'block-2'])

            const result = getNodeById('block-1', doc)

            expect(result.node).toBeDefined()
            expect(result.node.type.name).toBe('blockContainer')
            expect(result.node.attrs.id).toBe('block-1')
        })

        test('查找第一个 blockContainer 节点', () => {
            const schema = createTestSchema()
            const doc = createDocWithBlocks(schema, ['first-block', 'second-block'])

            const result = getNodeById('first-block', doc)

            expect(result.node.attrs.id).toBe('first-block')
        })

        test('查找最后一个 blockContainer 节点', () => {
            const schema = createTestSchema()
            const doc = createDocWithBlocks(schema, ['first-block', 'last-block'])

            const result = getNodeById('last-block', doc)

            expect(result.node.attrs.id).toBe('last-block')
        })

        test('返回正确的 posBeforeNode', () => {
            const schema = createTestSchema()
            const doc = createDocWithBlocks(schema, ['block-0', 'block-1'])

            const result = getNodeById('block-0', doc)

            expect(result.posBeforeNode).toBeGreaterThan(0)
            expect(typeof result.posBeforeNode).toBe('number')
        })

        test('可以查找嵌套结构中的父级 blockContainer', () => {
            const schema = createTestSchema()
            const doc = createDocWithNestedBlocks(schema)

            const result = getNodeById('parent-block', doc)

            expect(result.node).toBeDefined()
            expect(result.node.type.name).toBe('blockContainer')
            expect(result.node.attrs.id).toBe('parent-block')
        })

        test('可以查找嵌套结构中的子级 blockContainer', () => {
            const schema = createTestSchema()
            const doc = createDocWithNestedBlocks(schema)

            const result = getNodeById('child-block', doc)

            expect(result.node).toBeDefined()
            expect(result.node.type.name).toBe('blockContainer')
            expect(result.node.attrs.id).toBe('child-block')
        })

        test('可以查找嵌套结构中的兄弟 blockContainer', () => {
            const schema = createTestSchema()
            const doc = createDocWithNestedBlocks(schema)

            const result = getNodeById('sibling-block', doc)

            expect(result.node).toBeDefined()
            expect(result.node.type.name).toBe('blockContainer')
            expect(result.node.attrs.id).toBe('sibling-block')
        })

        test('ID 不存在时抛出错误', () => {
            const schema = createTestSchema()
            const doc = createDocWithBlocks(schema, ['block-0', 'block-1'])

            expect(() => {
                getNodeById('non-existent-id', doc)
            }).toThrow('Could not find block in the editor with matching ID.')
        })

        test('空 ID 字符串时抛出错误', () => {
            const schema = createTestSchema()
            const doc = createDocWithBlocks(schema, ['block-0'])

            expect(() => {
                getNodeById('', doc)
            }).toThrow('Could not find block in the editor with matching ID.')
        })

        test('不同 ID 返回不同的节点', () => {
            const schema = createTestSchema()
            const doc = createDocWithBlocks(schema, ['block-a', 'block-b'])

            const resultA = getNodeById('block-a', doc)
            const resultB = getNodeById('block-b', doc)

            expect(resultA.node).not.toBe(resultB.node)
            expect(resultA.node.attrs.id).toBe('block-a')
            expect(resultB.node.attrs.id).toBe('block-b')
        })

        test('不同 ID 返回不同的 posBeforeNode', () => {
            const schema = createTestSchema()
            const doc = createDocWithBlocks(schema, ['block-a', 'block-b'])

            const resultA = getNodeById('block-a', doc)
            const resultB = getNodeById('block-b', doc)

            expect(resultA.posBeforeNode).toBeLessThan(resultB.posBeforeNode)
        })

        test('单个 blockContainer 的文档也能正确查找', () => {
            const schema = createTestSchema()
            const doc = createDocWithBlocks(schema, ['only-block'])

            const result = getNodeById('only-block', doc)

            expect(result.node.attrs.id).toBe('only-block')
            expect(result.posBeforeNode).toBeGreaterThan(0)
        })
    })
})
