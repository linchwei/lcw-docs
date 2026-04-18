import { describe, expect, test } from 'vitest'

import { defaultBlockSchema, defaultInlineContentSchema } from '../../src/blocks/defaultBlocks'
import { defaultProps } from '../../src/blocks/defaultProps'
import {
    checkDefaultBlockTypeInSchema,
    checkDefaultInlineContentTypeInSchema,
    checkBlockIsDefaultType,
    checkBlockIsFileBlock,
    checkBlockIsFileBlockWithPreview,
    checkBlockIsFileBlockWithPlaceholder,
    checkBlockTypeHasDefaultProp,
    checkBlockHasDefaultProp,
} from '../../src/blocks/defaultBlockTypeGuards'

function createMockEditor(blockSchema: any, inlineContentSchema: any, styleSchema: any = {}) {
    return {
        schema: {
            blockSchema,
            inlineContentSchema,
            styleSchema,
        },
    } as any
}

describe('defaultBlockTypeGuards', () => {
    describe('checkDefaultBlockTypeInSchema', () => {
        test('应该被定义', () => {
            expect(checkDefaultBlockTypeInSchema).toBeDefined()
            expect(typeof checkDefaultBlockTypeInSchema).toBe('function')
        })

        test('当 schema 包含指定默认块类型时应该返回 true', () => {
            const editor = createMockEditor(defaultBlockSchema, defaultInlineContentSchema)
            expect(checkDefaultBlockTypeInSchema('paragraph', editor)).toBe(true)
        })

        test('当 schema 包含 heading 时应该返回 true', () => {
            const editor = createMockEditor(defaultBlockSchema, defaultInlineContentSchema)
            expect(checkDefaultBlockTypeInSchema('heading', editor)).toBe(true)
        })

        test('当 schema 包含 codeBlock 时应该返回 true', () => {
            const editor = createMockEditor(defaultBlockSchema, defaultInlineContentSchema)
            expect(checkDefaultBlockTypeInSchema('codeBlock', editor)).toBe(true)
        })

        test('当 schema 不包含指定块类型时应该返回 false', () => {
            const editor = createMockEditor({}, defaultInlineContentSchema)
            expect(checkDefaultBlockTypeInSchema('paragraph', editor)).toBe(false)
        })

        test('当 schema 中块类型与默认不匹配时应该返回 false', () => {
            const customSchema = {
                paragraph: { type: 'paragraph', content: 'inline', propSchema: {} },
            }
            const editor = createMockEditor(customSchema, defaultInlineContentSchema)
            expect(checkDefaultBlockTypeInSchema('paragraph', editor)).toBe(false)
        })
    })

    describe('checkDefaultInlineContentTypeInSchema', () => {
        test('应该被定义', () => {
            expect(checkDefaultInlineContentTypeInSchema).toBeDefined()
            expect(typeof checkDefaultInlineContentTypeInSchema).toBe('function')
        })

        test('当 schema 包含 text 时应该返回 true', () => {
            const editor = createMockEditor(defaultBlockSchema, defaultInlineContentSchema)
            expect(checkDefaultInlineContentTypeInSchema('text', editor)).toBe(true)
        })

        test('当 schema 包含 link 时应该返回 true', () => {
            const editor = createMockEditor(defaultBlockSchema, defaultInlineContentSchema)
            expect(checkDefaultInlineContentTypeInSchema('link', editor)).toBe(true)
        })

        test('当 schema 不包含指定内联内容类型时应该返回 false', () => {
            const editor = createMockEditor(defaultBlockSchema, {})
            expect(checkDefaultInlineContentTypeInSchema('text', editor)).toBe(false)
        })

        test('当 schema 中内联内容类型与默认不匹配时应该返回 false', () => {
            const customSchema = {
                text: { config: 'customText', implementation: {} },
            }
            const editor = createMockEditor(defaultBlockSchema, customSchema)
            expect(checkDefaultInlineContentTypeInSchema('text', editor)).toBe(false)
        })
    })

    describe('checkBlockIsDefaultType', () => {
        test('应该被定义', () => {
            expect(checkBlockIsDefaultType).toBeDefined()
            expect(typeof checkBlockIsDefaultType).toBe('function')
        })

        test('当块类型匹配且在 schema 中存在时应该返回 true', () => {
            const editor = createMockEditor(defaultBlockSchema, defaultInlineContentSchema)
            const block = { type: 'paragraph' }
            expect(checkBlockIsDefaultType('paragraph', block as any, editor)).toBe(true)
        })

        test('当块类型不匹配时应该返回 false', () => {
            const editor = createMockEditor(defaultBlockSchema, defaultInlineContentSchema)
            const block = { type: 'heading' }
            expect(checkBlockIsDefaultType('paragraph', block as any, editor)).toBe(false)
        })

        test('当块类型不在 schema 中时应该返回 false', () => {
            const editor = createMockEditor({}, defaultInlineContentSchema)
            const block = { type: 'paragraph' }
            expect(checkBlockIsDefaultType('paragraph', block as any, editor)).toBe(false)
        })

        test('当 schema 中块类型与默认不匹配时应该返回 false', () => {
            const customSchema = {
                paragraph: { type: 'paragraph', content: 'inline', propSchema: {} },
            }
            const editor = createMockEditor(customSchema, defaultInlineContentSchema)
            const block = { type: 'paragraph' }
            expect(checkBlockIsDefaultType('paragraph', block as any, editor)).toBe(false)
        })
    })

    describe('checkBlockIsFileBlock', () => {
        test('应该被定义', () => {
            expect(checkBlockIsFileBlock).toBeDefined()
            expect(typeof checkBlockIsFileBlock).toBe('function')
        })

        test('当块类型是文件块时应该返回 true', () => {
            const blockSchema = {
                image: { type: 'image', isFileBlock: true },
            }
            const editor = createMockEditor(blockSchema, defaultInlineContentSchema)
            const block = { type: 'image' }
            expect(checkBlockIsFileBlock(block as any, editor)).toBe(true)
        })

        test('当块类型不是文件块时应该返回 false', () => {
            const blockSchema = {
                paragraph: { type: 'paragraph', isFileBlock: false },
            }
            const editor = createMockEditor(blockSchema, defaultInlineContentSchema)
            const block = { type: 'paragraph' }
            expect(checkBlockIsFileBlock(block as any, editor)).toBe(false)
        })

        test('当块类型不在 schema 中时应该返回 false', () => {
            const editor = createMockEditor({}, defaultInlineContentSchema)
            const block = { type: 'unknown' }
            expect(checkBlockIsFileBlock(block as any, editor)).toBe(false)
        })

        test('当 schema 条目没有 isFileBlock 属性时应该返回 false', () => {
            const blockSchema = {
                paragraph: { type: 'paragraph' },
            }
            const editor = createMockEditor(blockSchema, defaultInlineContentSchema)
            const block = { type: 'paragraph' }
            expect(checkBlockIsFileBlock(block as any, editor)).toBe(false)
        })
    })

    describe('checkBlockIsFileBlockWithPreview', () => {
        test('应该被定义', () => {
            expect(checkBlockIsFileBlockWithPreview).toBeDefined()
            expect(typeof checkBlockIsFileBlockWithPreview).toBe('function')
        })

        test('当文件块有 showPreview 属性时应该返回 true', () => {
            const blockSchema = {
                image: {
                    type: 'image',
                    isFileBlock: true,
                    propSchema: {
                        showPreview: { default: true },
                    },
                },
            }
            const editor = createMockEditor(blockSchema, defaultInlineContentSchema)
            const block = { type: 'image' }
            expect(checkBlockIsFileBlockWithPreview(block as any, editor)).toBe(true)
        })

        test('当文件块没有 showPreview 属性时应该返回 false', () => {
            const blockSchema = {
                file: {
                    type: 'file',
                    isFileBlock: true,
                    propSchema: {},
                },
            }
            const editor = createMockEditor(blockSchema, defaultInlineContentSchema)
            const block = { type: 'file' }
            expect(checkBlockIsFileBlockWithPreview(block as any, editor)).toBe(false)
        })

        test('当块不是文件块时应该返回 false', () => {
            const blockSchema = {
                paragraph: {
                    type: 'paragraph',
                    isFileBlock: false,
                    propSchema: {},
                },
            }
            const editor = createMockEditor(blockSchema, defaultInlineContentSchema)
            const block = { type: 'paragraph' }
            expect(checkBlockIsFileBlockWithPreview(block as any, editor)).toBe(false)
        })

        test('当块类型不在 schema 中时应该返回 false', () => {
            const editor = createMockEditor({}, defaultInlineContentSchema)
            const block = { type: 'unknown' }
            expect(checkBlockIsFileBlockWithPreview(block as any, editor)).toBe(false)
        })
    })

    describe('checkBlockIsFileBlockWithPlaceholder', () => {
        test('应该被定义', () => {
            expect(checkBlockIsFileBlockWithPlaceholder).toBeDefined()
            expect(typeof checkBlockIsFileBlockWithPlaceholder).toBe('function')
        })

        test('当文件块没有 URL 时应该返回 true', () => {
            const blockSchema = {
                image: {
                    type: 'image',
                    isFileBlock: true,
                },
            }
            const editor = createMockEditor(blockSchema, defaultInlineContentSchema)
            const block = { type: 'image', props: { url: '' } }
            expect(checkBlockIsFileBlockWithPlaceholder(block as any, editor)).toBe(true)
        })

        test('当文件块有 URL 时应该返回 false', () => {
            const blockSchema = {
                image: {
                    type: 'image',
                    isFileBlock: true,
                },
            }
            const editor = createMockEditor(blockSchema, defaultInlineContentSchema)
            const block = { type: 'image', props: { url: 'https://example.com/image.png' } }
            expect(checkBlockIsFileBlockWithPlaceholder(block as any, editor)).toBe(false)
        })

        test('当块不是文件块时应该返回 false', () => {
            const blockSchema = {
                paragraph: {
                    type: 'paragraph',
                    isFileBlock: false,
                },
            }
            const editor = createMockEditor(blockSchema, defaultInlineContentSchema)
            const block = { type: 'paragraph', props: {} }
            expect(checkBlockIsFileBlockWithPlaceholder(block as any, editor)).toBe(false)
        })

        test('当文件块 props.url 为 undefined 时应该返回 true', () => {
            const blockSchema = {
                image: {
                    type: 'image',
                    isFileBlock: true,
                },
            }
            const editor = createMockEditor(blockSchema, defaultInlineContentSchema)
            const block = { type: 'image', props: {} }
            expect(checkBlockIsFileBlockWithPlaceholder(block as any, editor)).toBe(true)
        })
    })

    describe('checkBlockTypeHasDefaultProp', () => {
        test('应该被定义', () => {
            expect(checkBlockTypeHasDefaultProp).toBeDefined()
            expect(typeof checkBlockTypeHasDefaultProp).toBe('function')
        })

        test('当块类型有指定的默认属性时应该返回 true', () => {
            const blockSchema = {
                paragraph: {
                    type: 'paragraph',
                    propSchema: {
                        backgroundColor: defaultProps.backgroundColor,
                    },
                },
            }
            const editor = createMockEditor(blockSchema, defaultInlineContentSchema)
            expect(checkBlockTypeHasDefaultProp('backgroundColor', 'paragraph', editor)).toBe(true)
        })

        test('当块类型没有指定的默认属性时应该返回 false', () => {
            const blockSchema = {
                paragraph: {
                    type: 'paragraph',
                    propSchema: {},
                },
            }
            const editor = createMockEditor(blockSchema, defaultInlineContentSchema)
            expect(checkBlockTypeHasDefaultProp('backgroundColor', 'paragraph', editor)).toBe(false)
        })

        test('当块类型不在 schema 中时应该返回 false', () => {
            const editor = createMockEditor({}, defaultInlineContentSchema)
            expect(checkBlockTypeHasDefaultProp('backgroundColor', 'unknown', editor)).toBe(false)
        })

        test('当属性存在但与默认属性不匹配时应该返回 false', () => {
            const blockSchema = {
                paragraph: {
                    type: 'paragraph',
                    propSchema: {
                        backgroundColor: { default: 'custom' },
                    },
                },
            }
            const editor = createMockEditor(blockSchema, defaultInlineContentSchema)
            expect(checkBlockTypeHasDefaultProp('backgroundColor', 'paragraph', editor)).toBe(false)
        })

        test('检查 textAlignment 默认属性', () => {
            const blockSchema = {
                paragraph: {
                    type: 'paragraph',
                    propSchema: {
                        textAlignment: defaultProps.textAlignment,
                    },
                },
            }
            const editor = createMockEditor(blockSchema, defaultInlineContentSchema)
            expect(checkBlockTypeHasDefaultProp('textAlignment', 'paragraph', editor)).toBe(true)
        })
    })

    describe('checkBlockHasDefaultProp', () => {
        test('应该被定义', () => {
            expect(checkBlockHasDefaultProp).toBeDefined()
            expect(typeof checkBlockHasDefaultProp).toBe('function')
        })

        test('当块有指定的默认属性时应该返回 true', () => {
            const blockSchema = {
                paragraph: {
                    type: 'paragraph',
                    propSchema: {
                        backgroundColor: defaultProps.backgroundColor,
                    },
                },
            }
            const editor = createMockEditor(blockSchema, defaultInlineContentSchema)
            const block = { type: 'paragraph' }
            expect(checkBlockHasDefaultProp('backgroundColor', block as any, editor)).toBe(true)
        })

        test('当块没有指定的默认属性时应该返回 false', () => {
            const blockSchema = {
                paragraph: {
                    type: 'paragraph',
                    propSchema: {},
                },
            }
            const editor = createMockEditor(blockSchema, defaultInlineContentSchema)
            const block = { type: 'paragraph' }
            expect(checkBlockHasDefaultProp('backgroundColor', block as any, editor)).toBe(false)
        })

        test('当块类型不在 schema 中时应该返回 false', () => {
            const editor = createMockEditor({}, defaultInlineContentSchema)
            const block = { type: 'unknown' }
            expect(checkBlockHasDefaultProp('backgroundColor', block as any, editor)).toBe(false)
        })

        test('检查 textColor 默认属性', () => {
            const blockSchema = {
                heading: {
                    type: 'heading',
                    propSchema: {
                        textColor: defaultProps.textColor,
                    },
                },
            }
            const editor = createMockEditor(blockSchema, defaultInlineContentSchema)
            const block = { type: 'heading' }
            expect(checkBlockHasDefaultProp('textColor', block as any, editor)).toBe(true)
        })
    })
})
