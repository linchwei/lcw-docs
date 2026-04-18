import { describe, test, expect } from 'vitest'
import { Schema } from 'prosemirror-model'
import { EditorState, TextSelection } from 'prosemirror-state'
import {
    getNearestBlockContainerPos,
    getBlockInfoWithManualOffset,
    getBlockInfo,
    getBlockInfoFromResolvedPos,
    getBlockInfoFromSelection,
} from '../../src/api/getBlockInfoFromPos'

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

const createDocWithBlocks = (schema: Schema, blockCount: number, ids?: string[]) => {
    const containers = []
    for (let i = 0; i < blockCount; i++) {
        const id = ids ? ids[i] : `block-${i}`
        containers.push(
            schema.nodes.blockContainer.create({ id }, [
                schema.nodes.blockContent.create(),
            ])
        )
    }
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
    return schema.nodes.doc.create(null, [
        schema.nodes.blockGroup.create(null, [parentContainer]),
    ])
}

describe('api/getBlockInfoFromPos', () => {
    describe('getNearestBlockContainerPos', () => {
        test('当位置直接在 blockContainer 节点前时返回该节点', () => {
            const schema = createTestSchema()
            const doc = createDocWithBlocks(schema, 2, ['block-0', 'block-1'])

            const result = getNearestBlockContainerPos(doc, 1)
            expect(result.node.type.name).toBe('blockContainer')
            expect(result.node.attrs.id).toBe('block-0')
        })

        test('当位置在 blockContainer 内部时向上查找', () => {
            const schema = createTestSchema()
            const doc = createDocWithBlocks(schema, 2, ['block-0', 'block-1'])

            const blockContentPos = 2
            const result = getNearestBlockContainerPos(doc, blockContentPos)
            expect(result.node.type.name).toBe('blockContainer')
        })

        test('返回正确的 posBeforeNode', () => {
            const schema = createTestSchema()
            const doc = createDocWithBlocks(schema, 2, ['block-0', 'block-1'])

            const result = getNearestBlockContainerPos(doc, 1)
            expect(result.posBeforeNode).toBe(1)
            expect(result.node.attrs.id).toBe('block-0')
        })

        test('可以找到第二个 blockContainer', () => {
            const schema = createTestSchema()
            const doc = createDocWithBlocks(schema, 2, ['block-0', 'block-1'])

            const blockGroup = doc.firstChild!
            const firstBlockSize = blockGroup.firstChild!.nodeSize
            const secondBlockPos = 1 + firstBlockSize

            const result = getNearestBlockContainerPos(doc, secondBlockPos)
            expect(result.node.type.name).toBe('blockContainer')
            expect(result.node.attrs.id).toBe('block-1')
        })
    })

    describe('getBlockInfoWithManualOffset', () => {
        test('返回包含 blockContainer 和 blockContent 的 BlockInfo', () => {
            const schema = createTestSchema()
            const doc = createDocWithBlocks(schema, 1, ['test-block'])
            const blockGroup = doc.firstChild!
            const blockContainer = blockGroup.firstChild!

            const result = getBlockInfoWithManualOffset(blockContainer, 1)

            expect(result.blockContainer).toBeDefined()
            expect(result.blockContainer.node).toBe(blockContainer)
            expect(result.blockContainer.beforePos).toBe(1)
            expect(result.blockContainer.afterPos).toBe(1 + blockContainer.nodeSize)
            expect(result.blockContent).toBeDefined()
            expect(result.blockContent.node.type.name).toBe('blockContent')
        })

        test('blockContent 的位置计算正确', () => {
            const schema = createTestSchema()
            const doc = createDocWithBlocks(schema, 1, ['test-block'])
            const blockGroup = doc.firstChild!
            const blockContainer = blockGroup.firstChild!

            const result = getBlockInfoWithManualOffset(blockContainer, 1)

            expect(result.blockContent.beforePos).toBe(2)
            expect(result.blockContent.afterPos).toBe(2 + result.blockContent.node.nodeSize)
        })

        test('没有 blockGroup 子节点时 blockGroup 为 undefined', () => {
            const schema = createTestSchema()
            const doc = createDocWithBlocks(schema, 1, ['test-block'])
            const blockGroup = doc.firstChild!
            const blockContainer = blockGroup.firstChild!

            const result = getBlockInfoWithManualOffset(blockContainer, 1)

            expect(result.blockGroup).toBeUndefined()
        })

        test('包含 blockGroup 子节点时正确返回', () => {
            const schema = createTestSchema()
            const doc = createDocWithNestedBlocks(schema)
            const blockGroup = doc.firstChild!
            const parentContainer = blockGroup.firstChild!

            const result = getBlockInfoWithManualOffset(parentContainer, 1)

            expect(result.blockGroup).toBeDefined()
            expect(result.blockGroup!.node.type.name).toBe('blockGroup')
        })

        test('blockGroup 位置计算正确', () => {
            const schema = createTestSchema()
            const doc = createDocWithNestedBlocks(schema)
            const blockGroup = doc.firstChild!
            const parentContainer = blockGroup.firstChild!

            const result = getBlockInfoWithManualOffset(parentContainer, 1)

            expect(result.blockGroup!.beforePos).toBeGreaterThan(result.blockContent.beforePos)
        })

        test('blockContainer 不包含 blockContent 时抛出错误', () => {
            const schema = createTestSchema()
            const emptyContainer = schema.nodes.blockContainer.create({ id: 'empty' })

            expect(() => {
                getBlockInfoWithManualOffset(emptyContainer, 1)
            }).toThrow(/blockContainer node does not contain a blockContent node/)
        })
    })

    describe('getBlockInfo', () => {
        test('从 posInfo 对象获取块信息', () => {
            const schema = createTestSchema()
            const doc = createDocWithBlocks(schema, 1, ['test-block'])
            const blockGroup = doc.firstChild!
            const blockContainer = blockGroup.firstChild!

            const result = getBlockInfo({ posBeforeNode: 1, node: blockContainer })

            expect(result.blockContainer.node).toBe(blockContainer)
            expect(result.blockContainer.beforePos).toBe(1)
            expect(result.blockContent).toBeDefined()
        })
    })

    describe('getBlockInfoFromResolvedPos', () => {
        test('从 ResolvedPos 获取块信息', () => {
            const schema = createTestSchema()
            const doc = createDocWithBlocks(schema, 1, ['test-block'])

            const $pos = doc.resolve(1)
            const result = getBlockInfoFromResolvedPos($pos)

            expect(result.blockContainer).toBeDefined()
            expect(result.blockContainer.node.type.name).toBe('blockContainer')
            expect(result.blockContent).toBeDefined()
            expect(result.blockContent.node.type.name).toBe('blockContent')
        })

        test('位置没有 nodeAfter 时抛出错误', () => {
            const schema = createTestSchema()
            const doc = createDocWithBlocks(schema, 1, ['test-block'])

            const $pos = doc.resolve(doc.content.size)

            expect(() => {
                getBlockInfoFromResolvedPos($pos)
            }).toThrow(/Attempted to get blockContainer node at position/)
        })

        test('位置对应的节点不是 blockContainer 时抛出错误', () => {
            const schema = createTestSchema()
            const doc = createDocWithBlocks(schema, 1, ['test-block'])

            const $pos = doc.resolve(0)

            expect(() => {
                getBlockInfoFromResolvedPos($pos)
            }).toThrow(/Attempted to get blockContainer node at position.*but found node of different type/)
        })
    })

    describe('getBlockInfoFromSelection', () => {
        test('从编辑器状态获取块信息', () => {
            const schema = createTestSchema()
            const doc = createDocWithBlocks(schema, 1, ['test-block'])

            const state = EditorState.create({
                doc,
                selection: TextSelection.create(doc, 3, 3),
            })

            const result = getBlockInfoFromSelection(state)

            expect(result.blockContainer).toBeDefined()
            expect(result.blockContainer.node.type.name).toBe('blockContainer')
            expect(result.blockContent).toBeDefined()
            expect(result.blockContent.node.type.name).toBe('blockContent')
        })
    })
})
