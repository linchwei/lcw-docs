import { describe, test, expect, vi, beforeEach } from 'vitest'
import { getDefaultSlashMenuItems, filterSuggestionItems, insertOrUpdateBlock } from '../../src/extensions/SuggestionMenu/getDefaultSlashMenuItems'
import type { DefaultSuggestionItem } from '../../src/extensions/SuggestionMenu/DefaultSuggestionItem'

const { mockCheckDefaultBlockTypeInSchema } = vi.hoisted(() => ({
    mockCheckDefaultBlockTypeInSchema: vi.fn(),
}))

vi.mock('../../src/blocks/defaultBlockTypeGuards', () => ({
    checkDefaultBlockTypeInSchema: mockCheckDefaultBlockTypeInSchema,
}))

const mockDictionary = {
    slash_menu: {
        heading: { title: 'Heading 1', subtext: 'Top-level heading', aliases: ['h', 'heading1', 'h1'], group: 'Headings' },
        heading_2: { title: 'Heading 2', subtext: 'Key section heading', aliases: ['h2', 'heading2', 'subheading'], group: 'Headings' },
        heading_3: { title: 'Heading 3', subtext: 'Subsection and group heading', aliases: ['h3', 'heading3', 'subheading'], group: 'Headings' },
        numbered_list: { title: 'Numbered List', subtext: 'List with ordered items', aliases: ['ol', 'li', 'list'], group: 'Basic blocks' },
        bullet_list: { title: 'Bullet List', subtext: 'List with unordered items', aliases: ['ul', 'li', 'list'], group: 'Basic blocks' },
        check_list: { title: 'Check List', subtext: 'List with checkboxes', aliases: ['ul', 'li', 'list'], group: 'Basic blocks' },
        paragraph: { title: 'Paragraph', subtext: 'The body of your document', aliases: ['p', 'paragraph'], group: 'Basic blocks' },
        code_block: { title: 'Code Block', subtext: 'Code block with syntax highlighting', aliases: ['code', 'pre'], group: 'Basic blocks' },
        table: { title: 'Table', subtext: 'Table with editable cells', aliases: ['table'], group: 'Advanced' },
        image: { title: 'Image', subtext: 'Resizable image with caption', aliases: ['image', 'img'], group: 'Media' },
        video: { title: 'Video', subtext: 'Resizable video with caption', aliases: ['video', 'mp4'], group: 'Media' },
        audio: { title: 'Audio', subtext: 'Embedded audio with caption', aliases: ['audio', 'mp3'], group: 'Media' },
        file: { title: 'File', subtext: 'Embedded file', aliases: ['file', 'upload'], group: 'Media' },
        emoji: { title: 'Emoji', subtext: 'Search for and insert an emoji', aliases: ['emoji', 'emote'], group: 'Others' },
    },
}

function createMockEditor() {
    return {
        schema: {
            blockSchema: {
                paragraph: { content: 'inline*' },
                heading: { content: 'inline*' },
                numberedListItem: { content: 'inline*' },
                bulletListItem: { content: 'inline*' },
                checkListItem: { content: 'inline*' },
                codeBlock: { content: 'none' },
                table: { content: 'table' },
                image: { content: 'none', isFileBlock: true },
                video: { content: 'none', isFileBlock: true },
                audio: { content: 'none', isFileBlock: true },
                file: { content: 'none', isFileBlock: true },
            },
            inlineContentSchema: {},
            styleSchema: {},
        },
        dictionary: mockDictionary,
        getTextCursorPosition: vi.fn(() => ({
            block: { type: 'paragraph', content: [{ type: 'text', text: '/' }] },
        })),
        setTextCursorPosition: vi.fn(),
        updateBlock: vi.fn(() => ({ type: 'paragraph', content: [] })),
        insertBlocks: vi.fn(() => [{ type: 'paragraph', content: [] }]),
        openSuggestionMenu: vi.fn(),
        dispatch: vi.fn(),
        _tiptapEditor: {
            state: {
                selection: { from: 0 },
                tr: {
                    setMeta: vi.fn(() => ({
                        setMeta: vi.fn(),
                    })),
                },
            },
            commands: {
                setTextSelection: vi.fn(),
            },
        },
        filePanel: {
            plugin: 'filePanelPlugin',
        },
    } as any
}

function setupBlockTypes(blockTypes: string[]) {
    mockCheckDefaultBlockTypeInSchema.mockImplementation((type: string) => {
        return blockTypes.includes(type)
    })
}

describe('getDefaultSlashMenuItems', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('with all block types available', () => {
        test('should return all slash menu items', () => {
            setupBlockTypes([
                'heading', 'numberedListItem', 'bulletListItem',
                'checkListItem', 'paragraph', 'codeBlock',
                'table', 'image', 'video', 'audio', 'file',
            ])
            const editor = createMockEditor()

            const items = getDefaultSlashMenuItems(editor)

            expect(items.length).toBe(14)
        })

        test('should include heading items with correct keys', () => {
            setupBlockTypes(['heading'])
            const editor = createMockEditor()

            const items = getDefaultSlashMenuItems(editor)

            const headingKeys = items.map(item => item.key)
            expect(headingKeys).toContain('heading')
            expect(headingKeys).toContain('heading_2')
            expect(headingKeys).toContain('heading_3')
        })

        test('should include emoji item always', () => {
            setupBlockTypes([])
            const editor = createMockEditor()

            const items = getDefaultSlashMenuItems(editor)

            expect(items.some(item => item.key === 'emoji')).toBe(true)
        })

        test('each item should have required fields', () => {
            setupBlockTypes(['heading', 'paragraph', 'bulletListItem'])
            const editor = createMockEditor()

            const items = getDefaultSlashMenuItems(editor)

            items.forEach(item => {
                expect(item).toHaveProperty('key')
                expect(item).toHaveProperty('title')
                expect(item).toHaveProperty('onItemClick')
                expect(typeof item.onItemClick).toBe('function')
            })
        })

        test('each item should have title from dictionary', () => {
            setupBlockTypes(['heading', 'paragraph'])
            const editor = createMockEditor()

            const items = getDefaultSlashMenuItems(editor)

            items.forEach(item => {
                expect(item.title).toBeTruthy()
                expect(typeof item.title).toBe('string')
            })
        })
    })

    describe('conditional block type inclusion', () => {
        test('should not include heading items when heading is not in schema', () => {
            setupBlockTypes(['paragraph'])
            const editor = createMockEditor()

            const items = getDefaultSlashMenuItems(editor)

            const headingKeys = items.filter(item =>
                item.key === 'heading' || item.key === 'heading_2' || item.key === 'heading_3'
            )
            expect(headingKeys.length).toBe(0)
        })

        test('should not include numbered list when numberedListItem is not in schema', () => {
            setupBlockTypes(['paragraph'])
            const editor = createMockEditor()

            const items = getDefaultSlashMenuItems(editor)

            expect(items.some(item => item.key === 'numbered_list')).toBe(false)
        })

        test('should not include bullet list when bulletListItem is not in schema', () => {
            setupBlockTypes(['paragraph'])
            const editor = createMockEditor()

            const items = getDefaultSlashMenuItems(editor)

            expect(items.some(item => item.key === 'bullet_list')).toBe(false)
        })

        test('should not include check list when checkListItem is not in schema', () => {
            setupBlockTypes(['paragraph'])
            const editor = createMockEditor()

            const items = getDefaultSlashMenuItems(editor)

            expect(items.some(item => item.key === 'check_list')).toBe(false)
        })

        test('should not include code block when codeBlock is not in schema', () => {
            setupBlockTypes(['paragraph'])
            const editor = createMockEditor()

            const items = getDefaultSlashMenuItems(editor)

            expect(items.some(item => item.key === 'code_block')).toBe(false)
        })

        test('should not include table when table is not in schema', () => {
            setupBlockTypes(['paragraph'])
            const editor = createMockEditor()

            const items = getDefaultSlashMenuItems(editor)

            expect(items.some(item => item.key === 'table')).toBe(false)
        })

        test('should not include image when image is not in schema', () => {
            setupBlockTypes(['paragraph'])
            const editor = createMockEditor()

            const items = getDefaultSlashMenuItems(editor)

            expect(items.some(item => item.key === 'image')).toBe(false)
        })

        test('should not include video when video is not in schema', () => {
            setupBlockTypes(['paragraph'])
            const editor = createMockEditor()

            const items = getDefaultSlashMenuItems(editor)

            expect(items.some(item => item.key === 'video')).toBe(false)
        })

        test('should not include audio when audio is not in schema', () => {
            setupBlockTypes(['paragraph'])
            const editor = createMockEditor()

            const items = getDefaultSlashMenuItems(editor)

            expect(items.some(item => item.key === 'audio')).toBe(false)
        })

        test('should not include file when file is not in schema', () => {
            setupBlockTypes(['paragraph'])
            const editor = createMockEditor()

            const items = getDefaultSlashMenuItems(editor)

            expect(items.some(item => item.key === 'file')).toBe(false)
        })

        test('should only include paragraph and emoji when only paragraph is in schema', () => {
            setupBlockTypes(['paragraph'])
            const editor = createMockEditor()

            const items = getDefaultSlashMenuItems(editor)

            expect(items.length).toBe(2)
            expect(items.map(item => item.key)).toEqual(['paragraph', 'emoji'])
        })
    })

    describe('onItemClick callbacks', () => {
        test('emoji onItemClick should call openSuggestionMenu', () => {
            setupBlockTypes([])
            const editor = createMockEditor()

            const items = getDefaultSlashMenuItems(editor)
            const emojiItem = items.find(item => item.key === 'emoji')!

            emojiItem.onItemClick()

            expect(editor.openSuggestionMenu).toHaveBeenCalledWith(':', {
                deleteTriggerCharacter: true,
                ignoreQueryLength: true,
            })
        })

        test('paragraph onItemClick should call insertOrUpdateBlock', () => {
            setupBlockTypes(['paragraph'])
            const editor = createMockEditor()
            editor.getTextCursorPosition.mockReturnValue({
                block: { type: 'paragraph', content: [{ type: 'text', text: '/' }] },
            })

            const items = getDefaultSlashMenuItems(editor)
            const paragraphItem = items.find(item => item.key === 'paragraph')!

            paragraphItem.onItemClick()

            expect(editor.updateBlock).toHaveBeenCalled()
        })

        test('heading onItemClick should insert heading with level 1', () => {
            setupBlockTypes(['heading'])
            const editor = createMockEditor()
            editor.getTextCursorPosition.mockReturnValue({
                block: { type: 'paragraph', content: [{ type: 'text', text: '/' }] },
            })

            const items = getDefaultSlashMenuItems(editor)
            const headingItem = items.find(item => item.key === 'heading')!

            headingItem.onItemClick()

            expect(editor.updateBlock).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ type: 'heading', props: { level: 1 } })
            )
        })

        test('heading_2 onItemClick should insert heading with level 2', () => {
            setupBlockTypes(['heading'])
            const editor = createMockEditor()
            editor.getTextCursorPosition.mockReturnValue({
                block: { type: 'paragraph', content: [{ type: 'text', text: '/' }] },
            })

            const items = getDefaultSlashMenuItems(editor)
            const heading2Item = items.find(item => item.key === 'heading_2')!

            heading2Item.onItemClick()

            expect(editor.updateBlock).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ type: 'heading', props: { level: 2 } })
            )
        })

        test('heading_3 onItemClick should insert heading with level 3', () => {
            setupBlockTypes(['heading'])
            const editor = createMockEditor()
            editor.getTextCursorPosition.mockReturnValue({
                block: { type: 'paragraph', content: [{ type: 'text', text: '/' }] },
            })

            const items = getDefaultSlashMenuItems(editor)
            const heading3Item = items.find(item => item.key === 'heading_3')!

            heading3Item.onItemClick()

            expect(editor.updateBlock).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ type: 'heading', props: { level: 3 } })
            )
        })

        test('table onItemClick should insert table with 2 rows and 3 columns', () => {
            setupBlockTypes(['table'])
            const editor = createMockEditor()
            editor.getTextCursorPosition.mockReturnValue({
                block: { type: 'paragraph', content: [{ type: 'text', text: '/' }] },
            })

            const items = getDefaultSlashMenuItems(editor)
            const tableItem = items.find(item => item.key === 'table')!

            tableItem.onItemClick()

            expect(editor.updateBlock).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    type: 'table',
                    content: {
                        type: 'tableContent',
                        rows: [
                            { cells: ['', '', ''] },
                            { cells: ['', '', ''] },
                        ],
                    },
                })
            )
        })

        test('numberedListItem onItemClick should insert numbered list', () => {
            setupBlockTypes(['numberedListItem'])
            const editor = createMockEditor()
            editor.getTextCursorPosition.mockReturnValue({
                block: { type: 'paragraph', content: [{ type: 'text', text: '/' }] },
            })

            const items = getDefaultSlashMenuItems(editor)
            const numberedListItem = items.find(item => item.key === 'numbered_list')!

            numberedListItem.onItemClick()

            expect(editor.updateBlock).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ type: 'numberedListItem' })
            )
        })

        test('bulletListItem onItemClick should insert bullet list', () => {
            setupBlockTypes(['bulletListItem'])
            const editor = createMockEditor()
            editor.getTextCursorPosition.mockReturnValue({
                block: { type: 'paragraph', content: [{ type: 'text', text: '/' }] },
            })

            const items = getDefaultSlashMenuItems(editor)
            const bulletListItem = items.find(item => item.key === 'bullet_list')!

            bulletListItem.onItemClick()

            expect(editor.updateBlock).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ type: 'bulletListItem' })
            )
        })

        test('checkListItem onItemClick should insert check list', () => {
            setupBlockTypes(['checkListItem'])
            const editor = createMockEditor()
            editor.getTextCursorPosition.mockReturnValue({
                block: { type: 'paragraph', content: [{ type: 'text', text: '/' }] },
            })

            const items = getDefaultSlashMenuItems(editor)
            const checkListItem = items.find(item => item.key === 'check_list')!

            checkListItem.onItemClick()

            expect(editor.updateBlock).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ type: 'checkListItem' })
            )
        })

        test('codeBlock onItemClick should insert code block', () => {
            setupBlockTypes(['codeBlock'])
            const editor = createMockEditor()
            editor.getTextCursorPosition.mockReturnValue({
                block: { type: 'paragraph', content: [{ type: 'text', text: '/' }] },
            })

            const items = getDefaultSlashMenuItems(editor)
            const codeBlockItem = items.find(item => item.key === 'code_block')!

            codeBlockItem.onItemClick()

            expect(editor.updateBlock).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ type: 'codeBlock' })
            )
        })
    })

    describe('badge property', () => {
        test('table item should have undefined badge', () => {
            setupBlockTypes(['table'])
            const editor = createMockEditor()

            const items = getDefaultSlashMenuItems(editor)
            const tableItem = items.find(item => item.key === 'table')!

            expect(tableItem.badge).toBeUndefined()
        })

        test('image item should not have badge', () => {
            setupBlockTypes(['image'])
            const editor = createMockEditor()

            const items = getDefaultSlashMenuItems(editor)
            const imageItem = items.find(item => item.key === 'image')!

            expect(imageItem.badge).toBeUndefined()
        })

        test('heading items should have keyboard shortcut badge', () => {
            setupBlockTypes(['heading'])
            const editor = createMockEditor()

            const items = getDefaultSlashMenuItems(editor)
            const headingItem = items.find(item => item.key === 'heading')!
            const heading2Item = items.find(item => item.key === 'heading_2')!
            const heading3Item = items.find(item => item.key === 'heading_3')!

            expect(headingItem.badge).toBeTruthy()
            expect(heading2Item.badge).toBeTruthy()
            expect(heading3Item.badge).toBeTruthy()
        })

        test('paragraph item should have keyboard shortcut badge', () => {
            setupBlockTypes(['paragraph'])
            const editor = createMockEditor()

            const items = getDefaultSlashMenuItems(editor)
            const paragraphItem = items.find(item => item.key === 'paragraph')!

            expect(paragraphItem.badge).toBeTruthy()
        })

        test('numbered list item should have keyboard shortcut badge', () => {
            setupBlockTypes(['numberedListItem'])
            const editor = createMockEditor()

            const items = getDefaultSlashMenuItems(editor)
            const numberedListItem = items.find(item => item.key === 'numbered_list')!

            expect(numberedListItem.badge).toBeTruthy()
        })
    })

    describe('item structure from dictionary', () => {
        test('items should have subtext from dictionary', () => {
            setupBlockTypes(['heading', 'paragraph'])
            const editor = createMockEditor()

            const items = getDefaultSlashMenuItems(editor)

            items.forEach(item => {
                if (item.subtext !== undefined) {
                    expect(typeof item.subtext).toBe('string')
                    expect(item.subtext.length).toBeGreaterThan(0)
                }
            })
        })

        test('items should have group from dictionary', () => {
            setupBlockTypes(['heading', 'paragraph'])
            const editor = createMockEditor()

            const items = getDefaultSlashMenuItems(editor)

            items.forEach(item => {
                if (item.group !== undefined) {
                    expect(typeof item.group).toBe('string')
                    expect(item.group.length).toBeGreaterThan(0)
                }
            })
        })

        test('items should have aliases from dictionary', () => {
            setupBlockTypes(['heading', 'paragraph'])
            const editor = createMockEditor()

            const items = getDefaultSlashMenuItems(editor)

            items.forEach(item => {
                if (item.aliases !== undefined) {
                    expect(Array.isArray(item.aliases)).toBe(true)
                    expect(item.aliases.length).toBeGreaterThan(0)
                }
            })
        })
    })
})

describe('filterSuggestionItems', () => {
    const items: DefaultSuggestionItem[] = [
        { key: 'heading', title: 'Heading 1', onItemClick: () => {}, aliases: ['h', 'heading1', 'h1'] },
        { key: 'heading_2', title: 'Heading 2', onItemClick: () => {}, aliases: ['h2', 'heading2'] },
        { key: 'paragraph', title: 'Paragraph', onItemClick: () => {}, aliases: ['p', 'paragraph'] },
        { key: 'emoji', title: 'Emoji', onItemClick: () => {} },
    ]

    test('should filter items by title', () => {
        const result = filterSuggestionItems(items, 'heading')
        expect(result.length).toBe(2)
        expect(result.map(item => item.key)).toEqual(['heading', 'heading_2'])
    })

    test('should filter items by alias', () => {
        const result = filterSuggestionItems(items, 'h1')
        expect(result.length).toBe(1)
        expect(result[0].key).toBe('heading')
    })

    test('should be case insensitive', () => {
        const result = filterSuggestionItems(items, 'HEADING')
        expect(result.length).toBe(2)
    })

    test('should return all items when query is empty', () => {
        const result = filterSuggestionItems(items, '')
        expect(result.length).toBe(4)
    })

    test('should return empty array when no matches', () => {
        const result = filterSuggestionItems(items, 'nonexistent')
        expect(result.length).toBe(0)
    })

    test('should filter items without aliases by title only', () => {
        const result = filterSuggestionItems(items, 'emoji')
        expect(result.length).toBe(1)
        expect(result[0].key).toBe('emoji')
    })

    test('should match partial title', () => {
        const result = filterSuggestionItems(items, 'para')
        expect(result.length).toBe(1)
        expect(result[0].key).toBe('paragraph')
    })

    test('should match partial alias', () => {
        const result = filterSuggestionItems(items, 'h2')
        expect(result.length).toBe(1)
        expect(result[0].key).toBe('heading_2')
    })
})

describe('insertOrUpdateBlock', () => {
    test('should throw error when block content is undefined', () => {
        const editor = createMockEditor()
        editor.getTextCursorPosition.mockReturnValue({
            block: { type: 'paragraph', content: undefined },
        })

        expect(() => insertOrUpdateBlock(editor, { type: 'paragraph' })).toThrow(
            "Slash Menu open in a block that doesn't contain content."
        )
    })

    test('should call updateBlock when current block has only "/" text', () => {
        const editor = createMockEditor()
        editor.getTextCursorPosition.mockReturnValue({
            block: { type: 'paragraph', content: [{ type: 'text', text: '/' }] },
        })
        editor.updateBlock.mockReturnValue({ type: 'heading', content: [] })

        insertOrUpdateBlock(editor, { type: 'heading', props: { level: 1 } as any })

        expect(editor.updateBlock).toHaveBeenCalled()
    })

    test('should call updateBlock when current block has empty content', () => {
        const editor = createMockEditor()
        editor.getTextCursorPosition.mockReturnValue({
            block: { type: 'paragraph', content: [] },
        })
        editor.updateBlock.mockReturnValue({ type: 'heading', content: [] })

        insertOrUpdateBlock(editor, { type: 'heading', props: { level: 1 } as any })

        expect(editor.updateBlock).toHaveBeenCalled()
    })

    test('should call insertBlocks when current block has other content', () => {
        const editor = createMockEditor()
        editor.getTextCursorPosition.mockReturnValue({
            block: { type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] },
            nextBlock: { type: 'paragraph', content: [] },
        })
        editor.insertBlocks.mockReturnValue([{ type: 'heading', content: [] }])
        editor.schema.blockSchema['paragraph'] = { content: 'inline*' }

        insertOrUpdateBlock(editor, { type: 'heading', props: { level: 1 } as any })

        expect(editor.insertBlocks).toHaveBeenCalled()
    })
})
