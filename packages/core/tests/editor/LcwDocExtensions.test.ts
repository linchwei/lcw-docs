import { describe, test, expect, vi, beforeEach } from 'vitest'
import { getLcwDocExtensions } from '../../src/editor/LcwDocExtensions'
import { LcwDocEditor } from '../../src/editor/LcwDocEditor'
import { LcwDocSchema } from '../../src/editor/LcwDocSchema'
import * as Y from 'yjs'

vi.mock('../../src/editor/LcwDocEditor', () => ({
    LcwDocEditor: {
        create: vi.fn(),
    },
}))

const createMockEditor = () => {
    const mockSuggestionMenus = {
        shown: false,
    }
    return {
        suggestionMenus: mockSuggestionMenus,
    } as unknown as LcwDocEditor
}

const createDefaultSchema = () => {
    return LcwDocSchema.create()
}

describe('LcwDocExtensions', () => {
    let mockEditor: LcwDocEditor

    beforeEach(() => {
        mockEditor = createMockEditor()
    })

    describe('getLcwDocExtensions', () => {
        test('基本功能：返回包含基础扩展的数组', () => {
            const schema = createDefaultSchema()
            const extensions = getLcwDocExtensions({
                editor: mockEditor,
                domAttributes: {},
                blockSpecs: schema.blockSpecs,
                inlineContentSpecs: schema.inlineContentSpecs,
                styleSpecs: schema.styleSpecs,
                trailingBlock: true,
                disableExtensions: undefined,
            })

            expect(Array.isArray(extensions)).toBe(true)
            expect(extensions.length).toBeGreaterThan(0)
        })

        test('基本功能：返回的扩展包含必要的 TipTap 扩展', () => {
            const schema = createDefaultSchema()
            const extensions = getLcwDocExtensions({
                editor: mockEditor,
                domAttributes: {},
                blockSpecs: schema.blockSpecs,
                inlineContentSpecs: schema.inlineContentSpecs,
                styleSpecs: schema.styleSpecs,
                trailingBlock: true,
                disableExtensions: undefined,
            })

            const extensionNames = extensions.map(ext => ext.name)

            expect(extensionNames).toContain('clipboardTextSerializer')
            expect(extensionNames).toContain('uniqueID')
            expect(extensionNames).toContain('text')
            expect(extensionNames).toContain('link')
        })

        test('基本功能：包含 Doc 和 BlockContainer 节点', () => {
            const schema = createDefaultSchema()
            const extensions = getLcwDocExtensions({
                editor: mockEditor,
                domAttributes: {},
                blockSpecs: schema.blockSpecs,
                inlineContentSpecs: schema.inlineContentSpecs,
                styleSpecs: schema.styleSpecs,
                trailingBlock: true,
                disableExtensions: undefined,
            })

            const extensionNames = extensions.map(ext => ext.name)

            expect(extensionNames).toContain('doc')
            expect(extensionNames).toContain('blockContainer')
        })
    })

    describe('disableExtensions 过滤功能', () => {
        test('禁用单个扩展时，该扩展应被过滤掉', () => {
            const schema = createDefaultSchema()
            const extensions = getLcwDocExtensions({
                editor: mockEditor,
                domAttributes: {},
                blockSpecs: schema.blockSpecs,
                inlineContentSpecs: schema.inlineContentSpecs,
                styleSpecs: schema.styleSpecs,
                trailingBlock: true,
                disableExtensions: ['clipboardTextSerializer'],
            })

            const extensionNames = extensions.map(ext => ext.name)
            expect(extensionNames).not.toContain('clipboardTextSerializer')
        })

        test('禁用多个扩展时，所有指定的扩展应被过滤掉', () => {
            const schema = createDefaultSchema()
            const extensions = getLcwDocExtensions({
                editor: mockEditor,
                domAttributes: {},
                blockSpecs: schema.blockSpecs,
                inlineContentSpecs: schema.inlineContentSpecs,
                styleSpecs: schema.styleSpecs,
                trailingBlock: true,
                disableExtensions: ['clipboardTextSerializer', 'link', 'text'],
            })

            const extensionNames = extensions.map(ext => ext.name)
            expect(extensionNames).not.toContain('clipboardTextSerializer')
            expect(extensionNames).not.toContain('link')
            expect(extensionNames).not.toContain('text')
        })

        test('禁用不存在的扩展时，不应影响其他扩展', () => {
            const schema = createDefaultSchema()
            const extensionsWithDisable = getLcwDocExtensions({
                editor: mockEditor,
                domAttributes: {},
                blockSpecs: schema.blockSpecs,
                inlineContentSpecs: schema.inlineContentSpecs,
                styleSpecs: schema.styleSpecs,
                trailingBlock: true,
                disableExtensions: ['nonExistentExtension'],
            })

            const extensionsWithoutDisable = getLcwDocExtensions({
                editor: mockEditor,
                domAttributes: {},
                blockSpecs: schema.blockSpecs,
                inlineContentSpecs: schema.inlineContentSpecs,
                styleSpecs: schema.styleSpecs,
                trailingBlock: true,
                disableExtensions: undefined,
            })

            expect(extensionsWithDisable.length).toBe(extensionsWithoutDisable.length)
        })

        test('禁用空数组时，所有扩展应保留', () => {
            const schema = createDefaultSchema()
            const extensions = getLcwDocExtensions({
                editor: mockEditor,
                domAttributes: {},
                blockSpecs: schema.blockSpecs,
                inlineContentSpecs: schema.inlineContentSpecs,
                styleSpecs: schema.styleSpecs,
                trailingBlock: true,
                disableExtensions: [],
            })

            const extensionNames = extensions.map(ext => ext.name)
            expect(extensionNames).toContain('clipboardTextSerializer')
            expect(extensionNames).toContain('link')
        })
    })

    describe('协作模式配置', () => {
        test('协作模式：配置协作时返回包含 Collaboration 扩展', () => {
            const schema = createDefaultSchema()
            const yDoc = new Y.Doc()
            const yFragment = yDoc.getXmlFragment('content')

            const extensions = getLcwDocExtensions({
                editor: mockEditor,
                domAttributes: {},
                blockSpecs: schema.blockSpecs,
                inlineContentSpecs: schema.inlineContentSpecs,
                styleSpecs: schema.styleSpecs,
                trailingBlock: true,
                collaboration: {
                    fragment: yFragment,
                    user: { name: 'testUser', color: '#ff0000' },
                    provider: { awareness: {} },
                },
                disableExtensions: undefined,
            })

            const extensionNames = extensions.map(ext => ext.name)
            expect(extensionNames).toContain('collaboration')
            expect(extensionNames).toContain('collaborationCursor')
        })

        test('协作模式：带有 awareness 的 provider 应添加 CollaborationCursor', () => {
            const schema = createDefaultSchema()
            const yDoc = new Y.Doc()
            const yFragment = yDoc.getXmlFragment('content')

            const extensions = getLcwDocExtensions({
                editor: mockEditor,
                domAttributes: {},
                blockSpecs: schema.blockSpecs,
                inlineContentSpecs: schema.inlineContentSpecs,
                styleSpecs: schema.styleSpecs,
                trailingBlock: true,
                collaboration: {
                    fragment: yFragment,
                    user: { name: 'testUser', color: '#00ff00' },
                    provider: { awareness: { on: () => {} } },
                },
                disableExtensions: undefined,
            })

            const extensionNames = extensions.map(ext => ext.name)
            expect(extensionNames).toContain('collaborationCursor')
        })

        test('协作模式：不带 awareness 的 provider 不应添加 CollaborationCursor', () => {
            const schema = createDefaultSchema()
            const yDoc = new Y.Doc()
            const yFragment = yDoc.getXmlFragment('content')

            const extensions = getLcwDocExtensions({
                editor: mockEditor,
                domAttributes: {},
                blockSpecs: schema.blockSpecs,
                inlineContentSpecs: schema.inlineContentSpecs,
                styleSpecs: schema.styleSpecs,
                trailingBlock: true,
                collaboration: {
                    fragment: yFragment,
                    user: { name: 'testUser', color: '#0000ff' },
                    provider: {},
                },
                disableExtensions: undefined,
            })

            const extensionNames = extensions.map(ext => ext.name)
            expect(extensionNames).not.toContain('collaborationCursor')
        })

        test('协作模式：不应包含 History 扩展', () => {
            const schema = createDefaultSchema()
            const yDoc = new Y.Doc()
            const yFragment = yDoc.getXmlFragment('content')

            const extensions = getLcwDocExtensions({
                editor: mockEditor,
                domAttributes: {},
                blockSpecs: schema.blockSpecs,
                inlineContentSpecs: schema.inlineContentSpecs,
                styleSpecs: schema.styleSpecs,
                trailingBlock: true,
                collaboration: {
                    fragment: yFragment,
                    user: { name: 'testUser', color: '#ff0000' },
                    provider: { awareness: {} },
                },
                disableExtensions: undefined,
            })

            const extensionNames = extensions.map(ext => ext.name)
            expect(extensionNames).not.toContain('history')
        })

        test('非协作模式：应包含 History 扩展', () => {
            const schema = createDefaultSchema()
            const extensions = getLcwDocExtensions({
                editor: mockEditor,
                domAttributes: {},
                blockSpecs: schema.blockSpecs,
                inlineContentSpecs: schema.inlineContentSpecs,
                styleSpecs: schema.styleSpecs,
                trailingBlock: true,
                disableExtensions: undefined,
            })

            const extensionNames = extensions.map(ext => ext.name)
            expect(extensionNames).toContain('history')
        })
    })

    describe('trailingBlock 选项', () => {
        test('trailingBlock 为 true 时，应包含 TrailingNode 扩展', () => {
            const schema = createDefaultSchema()
            const extensions = getLcwDocExtensions({
                editor: mockEditor,
                domAttributes: {},
                blockSpecs: schema.blockSpecs,
                inlineContentSpecs: schema.inlineContentSpecs,
                styleSpecs: schema.styleSpecs,
                trailingBlock: true,
                disableExtensions: undefined,
            })

            const extensionNames = extensions.map(ext => ext.name)
            expect(extensionNames).toContain('trailingNode')
        })

        test('trailingBlock 为 false 时，不应包含 TrailingNode 扩展', () => {
            const schema = createDefaultSchema()
            const extensions = getLcwDocExtensions({
                editor: mockEditor,
                domAttributes: {},
                blockSpecs: schema.blockSpecs,
                inlineContentSpecs: schema.inlineContentSpecs,
                styleSpecs: schema.styleSpecs,
                trailingBlock: false,
                disableExtensions: undefined,
            })

            const extensionNames = extensions.map(ext => ext.name)
            expect(extensionNames).not.toContain('trailingNode')
        })

        test('trailingBlock 为 undefined 时（默认），应包含 TrailingNode 扩展', () => {
            const schema = createDefaultSchema()
            const extensions = getLcwDocExtensions({
                editor: mockEditor,
                domAttributes: {},
                blockSpecs: schema.blockSpecs,
                inlineContentSpecs: schema.inlineContentSpecs,
                styleSpecs: schema.styleSpecs,
                trailingBlock: undefined,
                disableExtensions: undefined,
            })

            const extensionNames = extensions.map(ext => ext.name)
            expect(extensionNames).toContain('trailingNode')
        })
    })
})