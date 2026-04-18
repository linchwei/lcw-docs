import { describe, expect, test } from 'vitest'
import { Mark } from '@tiptap/core'
import {
    createStyleSpecFromTipTapMark,
    createInternalStyleSpec,
    getStyleSchemaFromSpecs,
    stylePropsToAttributes,
} from '../../src/schema/styles/internal'
import { StyleConfig, StyleSpec, StyleSpecs } from '../../src/schema/styles/types'

describe('styles/internal', () => {
    describe('createStyleSpecFromTipTapMark', () => {
        test('应从 Mark 创建 StyleSpec', () => {
            const mark = Mark.create({
                name: 'bold',
            })

            const styleSpec = createStyleSpecFromTipTapMark(mark, 'boolean')

            expect(styleSpec).toBeDefined()
            expect(styleSpec.config.type).toBe('bold')
            expect(styleSpec.config.propSchema).toBe('boolean')
        })

        test('应正确传递 boolean propSchema', () => {
            const mark = Mark.create({
                name: 'italic',
            })

            const styleSpec = createStyleSpecFromTipTapMark(mark, 'boolean')

            expect(styleSpec.config.propSchema).toBe('boolean')
        })

        test('应正确传递 string propSchema', () => {
            const mark = Mark.create({
                name: 'color',
            })

            const styleSpec = createStyleSpecFromTipTapMark(mark, 'string')

            expect(styleSpec.config.propSchema).toBe('string')
        })

        test('应包含 implementation.mark', () => {
            const mark = Mark.create({
                name: 'underline',
            })

            const styleSpec = createStyleSpecFromTipTapMark(mark, 'boolean')

            expect(styleSpec.implementation).toBeDefined()
            expect(styleSpec.implementation.mark).toBe(mark)
        })
    })

    describe('createInternalStyleSpec', () => {
        test('应创建包含 config 和 implementation 的 StyleSpec', () => {
            const mark = Mark.create({
                name: 'internalStyle',
            })

            const config: StyleConfig = {
                type: 'internalStyle',
                propSchema: 'boolean',
            }

            const implementation = {
                mark,
            }

            const styleSpec = createInternalStyleSpec(config, implementation)

            expect(styleSpec).toBeDefined()
            expect(styleSpec.config).toBe(config)
            expect(styleSpec.implementation).toBe(implementation)
        })

        test('应满足 StyleSpec 类型', () => {
            const mark = Mark.create({
                name: 'typedStyle',
            })

            const config: StyleConfig = {
                type: 'typedStyle',
                propSchema: 'string',
            }

            const implementation = {
                mark,
            }

            const styleSpec = createInternalStyleSpec(config, implementation)

            const typeCheck: StyleSpec<typeof config> = styleSpec
            expect(typeCheck).toBeDefined()
        })
    })

    describe('getStyleSchemaFromSpecs', () => {
        test('应从 StyleSpecs 提取 schema', () => {
            const specs: StyleSpecs = {
                bold: {
                    config: {
                        type: 'bold',
                        propSchema: 'boolean',
                    },
                    implementation: {
                        mark: Mark.create({ name: 'bold' }),
                    },
                },
                italic: {
                    config: {
                        type: 'italic',
                        propSchema: 'boolean',
                    },
                    implementation: {
                        mark: Mark.create({ name: 'italic' }),
                    },
                },
                color: {
                    config: {
                        type: 'color',
                        propSchema: 'string',
                    },
                    implementation: {
                        mark: Mark.create({ name: 'color' }),
                    },
                },
            }

            const schema = getStyleSchemaFromSpecs(specs)

            expect(schema).toBeDefined()
            expect(schema.bold).toBeDefined()
            expect(schema.italic).toBeDefined()
            expect(schema.color).toBeDefined()
            expect(schema.bold.type).toBe('bold')
            expect(schema.bold.propSchema).toBe('boolean')
            expect(schema.color.propSchema).toBe('string')
        })
    })

    describe('stylePropsToAttributes', () => {
        test('应为 boolean propSchema 返回空对象', () => {
            const attributes = stylePropsToAttributes('boolean')

            expect(attributes).toEqual({})
        })

        test('应为 string propSchema 返回 stringValue attribute', () => {
            const attributes = stylePropsToAttributes('string')

            expect(attributes).toBeDefined()
            expect(attributes.stringValue).toBeDefined()
        })

        test('应为 string propSchema 设置正确的 default', () => {
            const attributes = stylePropsToAttributes('string')

            expect(attributes.stringValue.default).toBeUndefined()
        })

        test('应为 string propSchema 设置 keepOnSplit: true', () => {
            const attributes = stylePropsToAttributes('string')

            expect(attributes.stringValue.keepOnSplit).toBe(true)
        })

        test('应为 string propSchema 定义 parseHTML', () => {
            const attributes = stylePropsToAttributes('string')

            expect(attributes.stringValue.parseHTML).toBeDefined()
        })

        test('应为 string propSchema 定义 renderHTML', () => {
            const attributes = stylePropsToAttributes('string')

            expect(attributes.stringValue.renderHTML).toBeDefined()
        })
    })
})
