import { describe, expect, test } from 'vitest'
import { Node } from '@tiptap/core'
import {
    createStronglyTypedTiptapNode,
    createBlockSpecFromStronglyTypedTiptapNode,
    createInternalBlockSpec,
    propsToAttributes,
    getBlockSchemaFromSpecs,
} from '../../src/schema/blocks/internal'
import { BlockConfig, BlockSpec, BlockSpecs } from '../../src/schema/blocks/types'

describe('blocks/internal', () => {
    describe('createStronglyTypedTiptapNode', () => {
        test('应创建具有正确名称的 Node', () => {
            const node = createStronglyTypedTiptapNode({
                name: 'testBlock',
                content: '',
                group: 'blockContent',
            })

            expect(node).toBeDefined()
            expect(node.name).toBe('testBlock')
        })

        test('应创建具有 inline* 内容的 Node', () => {
            const node = createStronglyTypedTiptapNode({
                name: 'inlineBlock',
                content: 'inline*',
                group: 'blockContent',
            })

            expect(node).toBeDefined()
            expect(node.name).toBe('inlineBlock')
            expect(node.config.content).toBe('inline*')
        })

        test('应创建具有 tableRow+ 内容的 Node', () => {
            const node = createStronglyTypedTiptapNode({
                name: 'tableBlock',
                content: 'tableRow+',
                group: 'blockContent',
            })

            expect(node).toBeDefined()
            expect(node.name).toBe('tableBlock')
            expect(node.config.content).toBe('tableRow+')
        })

        test('应创建无内容的 Node', () => {
            const node = createStronglyTypedTiptapNode({
                name: 'emptyBlock',
                content: '',
                group: 'blockContent',
            })

            expect(node).toBeDefined()
            expect(node.name).toBe('emptyBlock')
            expect(node.config.content).toBe('')
        })

        test('创建的 Node 应该是 Node 实例', () => {
            const node = createStronglyTypedTiptapNode({
                name: 'instanceBlock',
                content: '',
                group: 'blockContent',
            })

            expect(node).toBeInstanceOf(Node)
        })
    })

    describe('createBlockSpecFromStronglyTypedTiptapNode', () => {
        test('应从无内容的 Node 创建 BlockSpec', () => {
            const node = createStronglyTypedTiptapNode({
                name: 'paragraph',
                content: '',
                group: 'blockContent',
            })

            const blockSpec = createBlockSpecFromStronglyTypedTiptapNode(node, {})

            expect(blockSpec).toBeDefined()
            expect(blockSpec.config.type).toBe('paragraph')
            expect(blockSpec.config.content).toBe('none')
            expect(blockSpec.config.propSchema).toEqual({})
        })

        test('应从 inline* Node 创建 inline 类型的 BlockSpec', () => {
            const node = createStronglyTypedTiptapNode({
                name: 'inlineBlock',
                content: 'inline*',
                group: 'blockContent',
            })

            const blockSpec = createBlockSpecFromStronglyTypedTiptapNode(node, {})

            expect(blockSpec).toBeDefined()
            expect(blockSpec.config.type).toBe('inlineBlock')
            expect(blockSpec.config.content).toBe('inline')
        })

        test('应从 tableRow+ Node 创建 table 类型的 BlockSpec', () => {
            const node = createStronglyTypedTiptapNode({
                name: 'tableBlock',
                content: 'tableRow+',
                group: 'blockContent',
            })

            const blockSpec = createBlockSpecFromStronglyTypedTiptapNode(node, {})

            expect(blockSpec).toBeDefined()
            expect(blockSpec.config.type).toBe('tableBlock')
            expect(blockSpec.config.content).toBe('table')
        })

        test('应正确传递 propSchema', () => {
            const node = createStronglyTypedTiptapNode({
                name: 'customBlock',
                content: '',
                group: 'blockContent',
            })

            const propSchema = {
                backgroundColor: {
                    default: 'default',
                },
                textColor: {
                    default: 'black',
                },
            }

            const blockSpec = createBlockSpecFromStronglyTypedTiptapNode(node, propSchema)

            expect(blockSpec.config.propSchema).toEqual(propSchema)
        })

        test('应包含 implementation.node', () => {
            const node = createStronglyTypedTiptapNode({
                name: 'testNode',
                content: '',
                group: 'blockContent',
            })

            const blockSpec = createBlockSpecFromStronglyTypedTiptapNode(node, {})

            expect(blockSpec.implementation).toBeDefined()
            expect(blockSpec.implementation.node).toBe(node)
        })

        test('应包含 requiredExtensions', () => {
            const node = createStronglyTypedTiptapNode({
                name: 'testNode',
                content: '',
                group: 'blockContent',
            })

            const blockSpec = createBlockSpecFromStronglyTypedTiptapNode(node, {}, [])

            expect(blockSpec.implementation.requiredExtensions).toEqual([])
        })
    })

    describe('createInternalBlockSpec', () => {
        test('应创建包含 config 和 implementation 的 BlockSpec', () => {
            const node = createStronglyTypedTiptapNode({
                name: 'internalBlock',
                content: '',
                group: 'blockContent',
            })

            const config: BlockConfig = {
                type: 'internalBlock',
                content: 'none',
                propSchema: {},
            }

            const implementation = {
                node,
                toInternalHTML: () => ({ dom: document.createElement('div') }),
                toExternalHTML: () => ({ dom: document.createElement('div') }),
            }

            const blockSpec = createInternalBlockSpec(config, implementation)

            expect(blockSpec).toBeDefined()
            expect(blockSpec.config).toBe(config)
            expect(blockSpec.implementation).toBe(implementation)
            expect(blockSpec.config.type).toBe('internalBlock')
        })

        test('应满足 BlockSpec 类型', () => {
            const node = createStronglyTypedTiptapNode({
                name: 'typedBlock',
                content: '',
                group: 'blockContent',
            })

            const config: BlockConfig = {
                type: 'typedBlock',
                content: 'inline',
                propSchema: {},
            }

            const implementation = {
                node,
                toInternalHTML: () => ({ dom: document.createElement('div') }),
                toExternalHTML: () => ({ dom: document.createElement('div') }),
            }

            const blockSpec = createInternalBlockSpec(config, implementation)

            const typeCheck: BlockSpec<typeof config, any, any, any> = blockSpec
            expect(typeCheck).toBeDefined()
        })
    })

    describe('propsToAttributes', () => {
        test('应将 string 类型的 prop 转换为 attributes', () => {
            const propSchema = {
                url: {
                    default: '',
                },
            }

            const attributes = propsToAttributes(propSchema)

            expect(attributes).toBeDefined()
            expect(attributes.url).toBeDefined()
            expect(attributes.url.default).toBe('')
        })

        test('应将 number 类型的 prop 转换为 attributes', () => {
            const propSchema = {
                width: {
                    default: 100,
                },
            }

            const attributes = propsToAttributes(propSchema)

            expect(attributes).toBeDefined()
            expect(attributes.width).toBeDefined()
            expect(attributes.width.default).toBe(100)
        })

        test('应将 boolean 类型的 prop 转换为 attributes', () => {
            const propSchema = {
                isVisible: {
                    default: true,
                },
            }

            const attributes = propsToAttributes(propSchema)

            expect(attributes).toBeDefined()
            expect(attributes.isVisible).toBeDefined()
            expect(attributes.isVisible.default).toBe(true)
        })

        test('应包含 keepOnSplit: true', () => {
            const propSchema = {
                level: {
                    default: 1,
                },
            }

            const attributes = propsToAttributes(propSchema)

            expect(attributes.level.keepOnSplit).toBe(true)
        })

        test('应处理带 values 的 prop', () => {
            const propSchema = {
                size: {
                    values: ['small', 'medium', 'large'] as const,
                    default: 'medium',
                },
            }

            const attributes = propsToAttributes(propSchema)

            expect(attributes).toBeDefined()
            expect(attributes.size.default).toBe('medium')
        })

        test('应返回空对象当 propSchema 为空', () => {
            const attributes = propsToAttributes({})

            expect(attributes).toEqual({})
        })
    })

    describe('getBlockSchemaFromSpecs', () => {
        test('应从 BlockSpecs 提取 schema', () => {
            const specs: BlockSpecs = {
                paragraph: {
                    config: {
                        type: 'paragraph',
                        content: 'inline',
                        propSchema: {},
                    },
                    implementation: {
                        node: createStronglyTypedTiptapNode({
                            name: 'paragraph',
                            content: 'inline*',
                            group: 'blockContent',
                        }),
                        toInternalHTML: () => ({ dom: document.createElement('div') }),
                        toExternalHTML: () => ({ dom: document.createElement('div') }),
                    },
                },
                heading: {
                    config: {
                        type: 'heading',
                        content: 'inline',
                        propSchema: {
                            level: { default: 1 },
                        },
                    },
                    implementation: {
                        node: createStronglyTypedTiptapNode({
                            name: 'heading',
                            content: 'inline*',
                            group: 'blockContent',
                        }),
                        toInternalHTML: () => ({ dom: document.createElement('div') }),
                        toExternalHTML: () => ({ dom: document.createElement('div') }),
                    },
                },
            }

            const schema = getBlockSchemaFromSpecs(specs)

            expect(schema).toBeDefined()
            expect(schema.paragraph).toBeDefined()
            expect(schema.heading).toBeDefined()
            expect(schema.paragraph.type).toBe('paragraph')
            expect(schema.heading.type).toBe('heading')
            expect(schema.heading.propSchema).toEqual({ level: { default: 1 } })
        })
    })
})
