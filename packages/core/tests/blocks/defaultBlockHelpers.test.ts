import { describe, expect, test } from 'vitest'

import { createDefaultBlockDOMOutputSpec, defaultBlockToHTML } from '../../src/blocks/defaultBlockHelpers'

describe('defaultBlockHelpers', () => {
    describe('createDefaultBlockDOMOutputSpec', () => {
        test('应该被定义', () => {
            expect(createDefaultBlockDOMOutputSpec).toBeDefined()
            expect(typeof createDefaultBlockDOMOutputSpec).toBe('function')
        })

        test('应该创建包含 dom 和 contentDOM 的对象', () => {
            const result = createDefaultBlockDOMOutputSpec('paragraph', 'p', {}, {})

            expect(result.dom).toBeDefined()
            expect(result.contentDOM).toBeDefined()
        })

        test('dom 应该是 div 元素', () => {
            const result = createDefaultBlockDOMOutputSpec('paragraph', 'p', {}, {})

            expect(result.dom.tagName).toBe('DIV')
        })

        test('dom 应该有 bn-block-content 类', () => {
            const result = createDefaultBlockDOMOutputSpec('paragraph', 'p', {}, {})

            expect(result.dom.className).toBe('bn-block-content')
        })

        test('dom 应该有 data-content-type 属性', () => {
            const result = createDefaultBlockDOMOutputSpec('paragraph', 'p', {}, {})

            expect(result.dom.getAttribute('data-content-type')).toBe('paragraph')
        })

        test('dom 应该合并 blockContentHTMLAttributes 中的 class', () => {
            const result = createDefaultBlockDOMOutputSpec('paragraph', 'p', { class: 'custom-class' }, {})

            expect(result.dom.className).toContain('bn-block-content')
            expect(result.dom.className).toContain('custom-class')
        })

        test('dom 应该设置 blockContentHTMLAttributes 中的非 class 属性', () => {
            const result = createDefaultBlockDOMOutputSpec('paragraph', 'p', { 'data-test': 'value' }, {})

            expect(result.dom.getAttribute('data-test')).toBe('value')
        })

        test('contentDOM 应该使用指定的 htmlTag', () => {
            const result = createDefaultBlockDOMOutputSpec('paragraph', 'p', {}, {})

            expect(result.contentDOM!.tagName).toBe('P')
        })

        test('contentDOM 使用 span 标签时应该正确创建', () => {
            const result = createDefaultBlockDOMOutputSpec('heading', 'span', {}, {})

            expect(result.contentDOM!.tagName).toBe('SPAN')
        })

        test('contentDOM 应该有 bn-inline-content 类', () => {
            const result = createDefaultBlockDOMOutputSpec('paragraph', 'p', {}, {})

            expect(result.contentDOM!.className).toBe('bn-inline-content')
        })

        test('contentDOM 应该合并 inlineContentHTMLAttributes 中的 class', () => {
            const result = createDefaultBlockDOMOutputSpec('paragraph', 'p', {}, { class: 'inline-custom' })

            expect(result.contentDOM!.className).toContain('bn-inline-content')
            expect(result.contentDOM!.className).toContain('inline-custom')
        })

        test('contentDOM 应该设置 inlineContentHTMLAttributes 中的非 class 属性', () => {
            const result = createDefaultBlockDOMOutputSpec('paragraph', 'p', {}, { 'data-inline': 'test' })

            expect(result.contentDOM!.getAttribute('data-inline')).toBe('test')
        })

        test('contentDOM 应该是 dom 的子元素', () => {
            const result = createDefaultBlockDOMOutputSpec('paragraph', 'p', {}, {})

            expect(result.dom.contains(result.contentDOM!)).toBe(true)
        })

        test('空的 HTML 属性应该正常工作', () => {
            const result = createDefaultBlockDOMOutputSpec('paragraph', 'p', {}, {})

            expect(result.dom.className).toBe('bn-block-content')
            expect(result.contentDOM!.className).toBe('bn-inline-content')
        })

        test('同时设置多个属性时应该正确处理', () => {
            const result = createDefaultBlockDOMOutputSpec(
                'heading',
                'h1',
                { class: 'heading-class', id: 'heading-id' },
                { class: 'inline-class', style: 'color: red' }
            )

            expect(result.dom.className).toContain('bn-block-content')
            expect(result.dom.className).toContain('heading-class')
            expect(result.dom.getAttribute('id')).toBe('heading-id')
            expect(result.contentDOM!.className).toContain('bn-inline-content')
            expect(result.contentDOM!.className).toContain('inline-class')
            expect(result.contentDOM!.getAttribute('style')).toBe('color: red')
        })

        test('blockContentHTMLAttributes 中的 class 不会通过 setAttribute 重复设置', () => {
            const result = createDefaultBlockDOMOutputSpec('paragraph', 'p', { class: 'test' }, {})

            expect(result.dom.className).toBe('bn-block-content test')
        })

        test('inlineContentHTMLAttributes 中的 class 不会通过 setAttribute 重复设置', () => {
            const result = createDefaultBlockDOMOutputSpec('paragraph', 'p', {}, { class: 'test' })

            expect(result.contentDOM!.className).toBe('bn-inline-content test')
        })
    })

    describe('defaultBlockToHTML', () => {
        test('应该被定义', () => {
            expect(defaultBlockToHTML).toBeDefined()
            expect(typeof defaultBlockToHTML).toBe('function')
        })
    })
})
