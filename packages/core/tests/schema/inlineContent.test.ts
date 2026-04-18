import { describe, expect, test } from 'vitest'
import { Node } from '@tiptap/core'
import {
    createInlineContentSpecFromTipTapNode,
    createInternalInlineContentSpec,
    getInlineContentSchemaFromSpecs,
} from '../../src/schema/inlineContent/internal'
import { InlineContentSpecs, CustomInlineContentConfig } from '../../src/schema/inlineContent/types'

describe('inlineContent/internal', () => {
    describe('createInlineContentSpecFromTipTapNode', () => {
        test('应从 styled 类型的 Node 创建 InlineContentSpec', () => {
            const node = Node.create({
                name: 'customInline',
                inline: true,
                group: 'inline',
                content: 'inline*',
            })

            const inlineContentSpec = createInlineContentSpecFromTipTapNode(node, {})

            expect(inlineContentSpec).toBeDefined()
            expect(inlineContentSpec.config).toBeDefined()
            const config = inlineContentSpec.config as CustomInlineContentConfig
            expect(config.type).toBe('customInline')
            expect(config.content).toBe('styled')
            expect(config.propSchema).toEqual({})
        })

        test('应从无内容的 Node 创建 none 类型的 InlineContentSpec', () => {
            const node = Node.create({
                name: 'atomInline',
                inline: true,
                group: 'inline',
                content: '',
            })

            const inlineContentSpec = createInlineContentSpecFromTipTapNode(node, {})

            expect(inlineContentSpec).toBeDefined()
            expect(inlineContentSpec.config).toBeDefined()
            const config = inlineContentSpec.config as CustomInlineContentConfig
            expect(config.type).toBe('atomInline')
            expect(config.content).toBe('none')
        })

        test('应正确传递 propSchema', () => {
            const node = Node.create({
                name: 'styledInline',
                inline: true,
                group: 'inline',
                content: 'inline*',
            })

            const propSchema = {
                color: {
                    default: 'black',
                },
            }

            const inlineContentSpec = createInlineContentSpecFromTipTapNode(node, propSchema)

            expect(inlineContentSpec.config).toBeDefined()
            const config = inlineContentSpec.config as CustomInlineContentConfig
            expect(config.propSchema).toEqual(propSchema)
        })

        test('应包含 implementation.node', () => {
            const node = Node.create({
                name: 'testInline',
                inline: true,
                group: 'inline',
                content: 'inline*',
            })

            const inlineContentSpec = createInlineContentSpecFromTipTapNode(node, {})

            expect(inlineContentSpec.implementation).toBeDefined()
            expect(inlineContentSpec.implementation.node).toBe(node)
        })
    })

    describe('createInternalInlineContentSpec', () => {
        test('应创建包含 config 和 implementation 的 InlineContentSpec', () => {
            const node = Node.create({
                name: 'internalInline',
                inline: true,
                group: 'inline',
                content: '',
            })

            const config: CustomInlineContentConfig = {
                type: 'internalInline',
                content: 'none',
                propSchema: {},
            }

            const implementation = {
                node,
            }

            const inlineContentSpec = createInternalInlineContentSpec(config, implementation)

            expect(inlineContentSpec).toBeDefined()
            expect(inlineContentSpec.config).toBe(config)
            expect(inlineContentSpec.implementation).toBe(implementation)
        })
    })

    describe('getInlineContentSchemaFromSpecs', () => {
        test('应从 InlineContentSpecs 提取 schema', () => {
            const specs: InlineContentSpecs = {
                text: {
                    config: 'text',
                    implementation: undefined,
                },
                link: {
                    config: 'link',
                    implementation: undefined,
                },
                customInline: {
                    config: {
                        type: 'customInline',
                        content: 'styled',
                        propSchema: {},
                    },
                    implementation: {
                        node: Node.create({
                            name: 'customInline',
                            inline: true,
                            group: 'inline',
                            content: 'inline*',
                        }),
                    },
                },
            }

            const schema = getInlineContentSchemaFromSpecs(specs)

            expect(schema).toBeDefined()
            expect(schema.text).toBe('text')
            expect(schema.link).toBe('link')
            const customConfig = schema.customInline as CustomInlineContentConfig
            expect(customConfig.type).toBe('customInline')
            expect(customConfig.content).toBe('styled')
        })
    })
})
