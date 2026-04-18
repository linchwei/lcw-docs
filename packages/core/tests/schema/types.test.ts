import { describe, expect, test } from 'vitest'
import {
    BlockConfig,
    BlockSchema,
    BlockSpecs,
} from '../../src/schema/blocks/types'
import { InlineContentSchema } from '../../src/schema/inlineContent/types'
import { StyleSchema, StyleConfig } from '../../src/schema/styles/types'
import { PropSchema } from '../../src/schema/propTypes'
import { CustomInlineContentConfig } from '../../src/schema/inlineContent/types'

describe('类型定义验证', () => {
    describe('BlockConfig 类型', () => {
        test('应支持 inline content 类型的 BlockConfig', () => {
            const config: BlockConfig = {
                type: 'paragraph',
                content: 'inline',
                propSchema: {},
            }

            expect(config.type).toBe('paragraph')
            expect(config.content).toBe('inline')
        })

        test('应支持 none content 类型的 BlockConfig', () => {
            const config: BlockConfig = {
                type: 'divider',
                content: 'none',
                propSchema: {},
            }

            expect(config.type).toBe('divider')
            expect(config.content).toBe('none')
        })

        test('应支持带可选 isSelectable 的 BlockConfig', () => {
            const config: BlockConfig = {
                type: 'selectableBlock',
                content: 'inline',
                propSchema: {},
                isSelectable: false,
            }

            expect(config.isSelectable).toBe(false)
        })
    })

    describe('BlockSchema 类型', () => {
        test('应支持创建 BlockSchema', () => {
            const schema: BlockSchema = {
                paragraph: {
                    type: 'paragraph',
                    content: 'inline',
                    propSchema: {},
                },
            }

            expect(schema.paragraph.type).toBe('paragraph')
        })
    })

    describe('InlineContentSchema 类型', () => {
        test('应支持 text 和 link 内联内容', () => {
            const schema: InlineContentSchema = {
                text: 'text',
                link: 'link',
            }

            expect(schema.text).toBe('text')
            expect(schema.link).toBe('link')
        })

        test('应支持自定义 InlineContentConfig', () => {
            const schema: InlineContentSchema = {
                text: 'text',
                link: 'link',
                mention: {
                    type: 'mention',
                    content: 'none',
                    propSchema: {},
                } as CustomInlineContentConfig,
            }

            const mentionConfig = schema.mention as CustomInlineContentConfig
            expect(mentionConfig.type).toBe('mention')
            expect(mentionConfig.content).toBe('none')
        })
    })

    describe('StyleSchema 类型', () => {
        test('应支持 boolean propSchema 的 StyleConfig', () => {
            const config: StyleConfig = {
                type: 'bold',
                propSchema: 'boolean',
            }

            expect(config.type).toBe('bold')
            expect(config.propSchema).toBe('boolean')
        })

        test('应支持 string propSchema 的 StyleConfig', () => {
            const config: StyleConfig = {
                type: 'color',
                propSchema: 'string',
            }

            expect(config.type).toBe('color')
            expect(config.propSchema).toBe('string')
        })

        test('应允许创建有效的 StyleSchema', () => {
            const schema: StyleSchema = {
                bold: { type: 'bold', propSchema: 'boolean' },
                italic: { type: 'italic', propSchema: 'boolean' },
                color: { type: 'color', propSchema: 'string' },
            }

            expect(schema.bold.propSchema).toBe('boolean')
            expect(schema.color.propSchema).toBe('string')
        })
    })

    describe('BlockSpecs 类型', () => {
        test('应允许创建有效的 BlockSpecs', () => {
            const specs: BlockSpecs = {
                paragraph: {
                    config: {
                        type: 'paragraph',
                        content: 'inline',
                        propSchema: {},
                    },
                    implementation: {
                        node: {} as any,
                        toInternalHTML: () => ({ dom: document.createElement('div') }),
                        toExternalHTML: () => ({ dom: document.createElement('div') }),
                    },
                },
            }

            expect(specs.paragraph).toBeDefined()
            expect(specs.paragraph.config.type).toBe('paragraph')
        })
    })

    describe('PropSchema 类型', () => {
        test('应支持创建 PropSchema', () => {
            const schema: PropSchema = {
                backgroundColor: { default: '' },
                textColor: { default: '' },
            }

            expect(schema.backgroundColor).toBeDefined()
        })
    })
})
