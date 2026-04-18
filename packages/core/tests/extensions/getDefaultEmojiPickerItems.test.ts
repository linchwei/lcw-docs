import { describe, test, expect, vi, beforeEach } from 'vitest'
import { getDefaultEmojiPickerItems } from '../../src/extensions/SuggestionMenu/getDefaultEmojiPickerItems'

const { mockCheckDefaultInlineContentTypeInSchema, mockSearchIndex } = vi.hoisted(() => ({
    mockCheckDefaultInlineContentTypeInSchema: vi.fn(),
    mockSearchIndex: {
        search: vi.fn(),
    },
}))

vi.mock('../../src/blocks/defaultBlockTypeGuards', () => ({
    checkDefaultInlineContentTypeInSchema: mockCheckDefaultInlineContentTypeInSchema,
}))

vi.mock('emoji-mart', () => ({
    init: vi.fn().mockResolvedValue(undefined),
    SearchIndex: mockSearchIndex,
}))

const mockEmojis = {
    'smile': {
        skins: [{ native: '😊' }],
    },
    'thumbsup': {
        skins: [{ native: '👍' }],
    },
    'heart': {
        skins: [{ native: '❤️' }],
    },
}

vi.mock('@emoji-mart/data', () => ({
    default: {
        emojis: mockEmojis,
    },
}))

function createMockEditor(hasTextInlineContent: boolean = true) {
    const inlineContentSchema: Record<string, any> = {}
    if (hasTextInlineContent) {
        inlineContentSchema['text'] = { type: 'text' }
    }

    return {
        schema: {
            blockSchema: {},
            inlineContentSchema,
            styleSchema: {},
        },
        insertInlineContent: vi.fn(),
    } as any
}

describe('getDefaultEmojiPickerItems', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    test('should return empty array when text inline content is not in schema', async () => {
        mockCheckDefaultInlineContentTypeInSchema.mockReturnValue(false)
        const editor = createMockEditor(false)

        const result = await getDefaultEmojiPickerItems(editor, '')

        expect(result).toEqual([])
    })

    test('should return emoji items when text inline content is in schema', async () => {
        mockCheckDefaultInlineContentTypeInSchema.mockReturnValue(true)
        const editor = createMockEditor(true)
        mockSearchIndex.search.mockResolvedValue([])

        const result = await getDefaultEmojiPickerItems(editor, '')

        expect(Array.isArray(result)).toBe(true)
    })

    test('each returned item should have id and onItemClick', async () => {
        mockCheckDefaultInlineContentTypeInSchema.mockReturnValue(true)
        const editor = createMockEditor(true)
        mockSearchIndex.search.mockResolvedValue([])

        const result = await getDefaultEmojiPickerItems(editor, '')

        result.forEach(item => {
            expect(item).toHaveProperty('id')
            expect(item).toHaveProperty('onItemClick')
            expect(typeof item.onItemClick).toBe('function')
        })
    })

    test('onItemClick should call editor.insertInlineContent', async () => {
        mockCheckDefaultInlineContentTypeInSchema.mockReturnValue(true)
        const editor = createMockEditor(true)
        mockSearchIndex.search.mockResolvedValue([])

        const result = await getDefaultEmojiPickerItems(editor, '')

        if (result.length > 0) {
            result[0].onItemClick()
            expect(editor.insertInlineContent).toHaveBeenCalled()
        }
    })

    test('should search emojis when query is provided', async () => {
        mockCheckDefaultInlineContentTypeInSchema.mockReturnValue(true)
        const editor = createMockEditor(true)
        mockSearchIndex.search.mockResolvedValue([
            { skins: [{ native: '😊' }] },
        ])

        const result = await getDefaultEmojiPickerItems(editor, 'smile')

        expect(mockSearchIndex.search).toHaveBeenCalledWith('smile')
        expect(result.length).toBe(1)
        expect(result[0].id).toBe('😊')
    })

    test('should return all emojis when query is empty', async () => {
        mockCheckDefaultInlineContentTypeInSchema.mockReturnValue(true)
        const editor = createMockEditor(true)

        const result = await getDefaultEmojiPickerItems(editor, '  ')

        expect(result.length).toBe(Object.keys(mockEmojis).length)
    })

    test('should map emoji native character as id', async () => {
        mockCheckDefaultInlineContentTypeInSchema.mockReturnValue(true)
        const editor = createMockEditor(true)
        mockSearchIndex.search.mockResolvedValue([
            { skins: [{ native: '🎉' }] },
            { skins: [{ native: '🚀' }] },
        ])

        const result = await getDefaultEmojiPickerItems(editor, 'party')

        expect(result[0].id).toBe('🎉')
        expect(result[1].id).toBe('🚀')
    })

    test('onItemClick should insert emoji with trailing space', async () => {
        mockCheckDefaultInlineContentTypeInSchema.mockReturnValue(true)
        const editor = createMockEditor(true)
        mockSearchIndex.search.mockResolvedValue([
            { skins: [{ native: '😊' }] },
        ])

        const result = await getDefaultEmojiPickerItems(editor, 'smile')

        result[0].onItemClick()
        expect(editor.insertInlineContent).toHaveBeenCalledWith('😊 ')
    })

    test('should return empty array when search returns no results', async () => {
        mockCheckDefaultInlineContentTypeInSchema.mockReturnValue(true)
        const editor = createMockEditor(true)
        mockSearchIndex.search.mockResolvedValue([])

        const result = await getDefaultEmojiPickerItems(editor, 'xyznonexistent')

        expect(result).toEqual([])
    })
})
