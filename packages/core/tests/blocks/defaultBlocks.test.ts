import { describe, expect, test } from 'vitest'

import {
    defaultBlockSpecs,
    defaultBlockSchema,
    defaultStyleSpecs,
    defaultStyleSchema,
    defaultInlineContentSpecs,
    defaultInlineContentSchema,
    customizeCodeBlock,
} from '../../src/blocks/defaultBlocks'

describe('defaultBlocks', () => {
    describe('defaultBlockSpecs', () => {
        test('应该被定义', () => {
            expect(defaultBlockSpecs).toBeDefined()
        })

        test('应该包含 11 种默认块规范', () => {
            const blockTypes = Object.keys(defaultBlockSpecs)
            expect(blockTypes).toHaveLength(11)
        })

        test('应该包含 paragraph 块规范', () => {
            expect(defaultBlockSpecs.paragraph).toBeDefined()
            expect(defaultBlockSpecs.paragraph.config.type).toBe('paragraph')
        })

        test('应该包含 heading 块规范', () => {
            expect(defaultBlockSpecs.heading).toBeDefined()
            expect(defaultBlockSpecs.heading.config.type).toBe('heading')
        })

        test('应该包含 codeBlock 块规范', () => {
            expect(defaultBlockSpecs.codeBlock).toBeDefined()
            expect(defaultBlockSpecs.codeBlock.config.type).toBe('codeBlock')
        })

        test('应该包含 bulletListItem 块规范', () => {
            expect(defaultBlockSpecs.bulletListItem).toBeDefined()
            expect(defaultBlockSpecs.bulletListItem.config.type).toBe('bulletListItem')
        })

        test('应该包含 numberedListItem 块规范', () => {
            expect(defaultBlockSpecs.numberedListItem).toBeDefined()
            expect(defaultBlockSpecs.numberedListItem.config.type).toBe('numberedListItem')
        })

        test('应该包含 checkListItem 块规范', () => {
            expect(defaultBlockSpecs.checkListItem).toBeDefined()
            expect(defaultBlockSpecs.checkListItem.config.type).toBe('checkListItem')
        })

        test('应该包含 table 块规范', () => {
            expect(defaultBlockSpecs.table).toBeDefined()
            expect(defaultBlockSpecs.table.config.type).toBe('table')
        })

        test('应该包含 file 块规范', () => {
            expect(defaultBlockSpecs.file).toBeDefined()
            expect(defaultBlockSpecs.file.config.type).toBe('file')
        })

        test('应该包含 image 块规范', () => {
            expect(defaultBlockSpecs.image).toBeDefined()
            expect(defaultBlockSpecs.image.config.type).toBe('image')
        })

        test('应该包含 video 块规范', () => {
            expect(defaultBlockSpecs.video).toBeDefined()
            expect(defaultBlockSpecs.video.config.type).toBe('video')
        })

        test('应该包含 audio 块规范', () => {
            expect(defaultBlockSpecs.audio).toBeDefined()
            expect(defaultBlockSpecs.audio.config.type).toBe('audio')
        })

        test('每个块规范都应该有 config 和 implementation', () => {
            for (const [name, spec] of Object.entries(defaultBlockSpecs)) {
                expect(spec.config, `${name} 缺少 config`).toBeDefined()
                expect(spec.implementation, `${name} 缺少 implementation`).toBeDefined()
            }
        })

        test('每个块规范 config 应该有 type、content 和 propSchema', () => {
            for (const [name, spec] of Object.entries(defaultBlockSpecs)) {
                expect(spec.config.type, `${name} 缺少 config.type`).toBeDefined()
                expect(spec.config.content, `${name} 缺少 config.content`).toBeDefined()
                expect(spec.config.propSchema, `${name} 缺少 config.propSchema`).toBeDefined()
            }
        })
    })

    describe('defaultBlockSchema', () => {
        test('应该被定义', () => {
            expect(defaultBlockSchema).toBeDefined()
        })

        test('应该包含与 defaultBlockSpecs 相同的键', () => {
            const specKeys = Object.keys(defaultBlockSpecs)
            const schemaKeys = Object.keys(defaultBlockSchema)
            expect(schemaKeys.sort()).toEqual(specKeys.sort())
        })

        test('每个 schema 条目应该有 type 属性', () => {
            for (const [key, schema] of Object.entries(defaultBlockSchema)) {
                expect(schema.type, `${key} 缺少 type`).toBe(key)
            }
        })

        test('每个 schema 条目应该有 propSchema 属性', () => {
            for (const [key, schema] of Object.entries(defaultBlockSchema)) {
                expect(schema.propSchema, `${key} 缺少 propSchema`).toBeDefined()
            }
        })

        test('每个 schema 条目应该有 content 属性', () => {
            for (const [key, schema] of Object.entries(defaultBlockSchema)) {
                expect(schema.content, `${key} 缺少 content`).toBeDefined()
                expect(['inline', 'none', 'table']).toContain(schema.content)
            }
        })
    })

    describe('defaultStyleSpecs', () => {
        test('应该被定义', () => {
            expect(defaultStyleSpecs).toBeDefined()
        })

        test('应该包含 7 种默认样式规范', () => {
            const styleTypes = Object.keys(defaultStyleSpecs)
            expect(styleTypes).toHaveLength(7)
        })

        test('应该包含 bold 样式', () => {
            expect(defaultStyleSpecs.bold).toBeDefined()
        })

        test('应该包含 italic 样式', () => {
            expect(defaultStyleSpecs.italic).toBeDefined()
        })

        test('应该包含 underline 样式', () => {
            expect(defaultStyleSpecs.underline).toBeDefined()
        })

        test('应该包含 strike 样式', () => {
            expect(defaultStyleSpecs.strike).toBeDefined()
        })

        test('应该包含 code 样式', () => {
            expect(defaultStyleSpecs.code).toBeDefined()
        })

        test('应该包含 textColor 样式', () => {
            expect(defaultStyleSpecs.textColor).toBeDefined()
        })

        test('应该包含 backgroundColor 样式', () => {
            expect(defaultStyleSpecs.backgroundColor).toBeDefined()
        })

        test('每个样式规范都应该有 config 和 implementation', () => {
            for (const [name, spec] of Object.entries(defaultStyleSpecs)) {
                expect(spec.config, `${name} 缺少 config`).toBeDefined()
                expect(spec.implementation, `${name} 缺少 implementation`).toBeDefined()
            }
        })
    })

    describe('defaultStyleSchema', () => {
        test('应该被定义', () => {
            expect(defaultStyleSchema).toBeDefined()
        })

        test('应该包含与 defaultStyleSpecs 相同的键', () => {
            const specKeys = Object.keys(defaultStyleSpecs)
            const schemaKeys = Object.keys(defaultStyleSchema)
            expect(schemaKeys.sort()).toEqual(specKeys.sort())
        })
    })

    describe('defaultInlineContentSpecs', () => {
        test('应该被定义', () => {
            expect(defaultInlineContentSpecs).toBeDefined()
        })

        test('应该包含 text 和 link 两种内联内容', () => {
            const contentTypes = Object.keys(defaultInlineContentSpecs)
            expect(contentTypes).toHaveLength(2)
            expect(contentTypes).toContain('text')
            expect(contentTypes).toContain('link')
        })

        test('text 规范应该有 config 属性', () => {
            expect(defaultInlineContentSpecs.text.config).toBe('text')
        })

        test('link 规范应该有 config 属性', () => {
            expect(defaultInlineContentSpecs.link.config).toBe('link')
        })
    })

    describe('defaultInlineContentSchema', () => {
        test('应该被定义', () => {
            expect(defaultInlineContentSchema).toBeDefined()
        })

        test('应该包含 text 和 link 键', () => {
            expect(defaultInlineContentSchema.text).toBeDefined()
            expect(defaultInlineContentSchema.link).toBeDefined()
        })
    })

    describe('customizeCodeBlock', () => {
        test('应该被定义', () => {
            expect(customizeCodeBlock).toBeDefined()
            expect(typeof customizeCodeBlock).toBe('function')
        })
    })
})
