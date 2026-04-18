import { describe, test, expect } from 'vitest'
import type { DefaultSuggestionItem } from '../../src/extensions/SuggestionMenu/DefaultSuggestionItem'

describe('DefaultSuggestionItem', () => {
    describe('type structure', () => {
        test('should have required fields: key, title, onItemClick', () => {
            const item: DefaultSuggestionItem = {
                key: 'heading',
                title: 'Heading 1',
                onItemClick: () => {},
            }

            expect(item.key).toBe('heading')
            expect(item.title).toBe('Heading 1')
            expect(typeof item.onItemClick).toBe('function')
        })

        test('should support optional subtext field', () => {
            const item: DefaultSuggestionItem = {
                key: 'heading',
                title: 'Heading 1',
                onItemClick: () => {},
                subtext: 'Top-level heading',
            }

            expect(item.subtext).toBe('Top-level heading')
        })

        test('should support optional badge field', () => {
            const item: DefaultSuggestionItem = {
                key: 'heading',
                title: 'Heading 1',
                onItemClick: () => {},
                badge: '⌘⌥1',
            }

            expect(item.badge).toBe('⌘⌥1')
        })

        test('should support optional aliases field', () => {
            const item: DefaultSuggestionItem = {
                key: 'heading',
                title: 'Heading 1',
                onItemClick: () => {},
                aliases: ['h', 'heading1', 'h1'],
            }

            expect(item.aliases).toEqual(['h', 'heading1', 'h1'])
        })

        test('should support optional group field', () => {
            const item: DefaultSuggestionItem = {
                key: 'heading',
                title: 'Heading 1',
                onItemClick: () => {},
                group: 'Headings',
            }

            expect(item.group).toBe('Headings')
        })

        test('should allow all optional fields together', () => {
            const item: DefaultSuggestionItem = {
                key: 'paragraph',
                title: 'Paragraph',
                onItemClick: () => {},
                subtext: 'The body of your document',
                badge: '⌘⌥0',
                aliases: ['p', 'paragraph'],
                group: 'Basic blocks',
            }

            expect(item.key).toBe('paragraph')
            expect(item.title).toBe('Paragraph')
            expect(item.subtext).toBe('The body of your document')
            expect(item.badge).toBe('⌘⌥0')
            expect(item.aliases).toEqual(['p', 'paragraph'])
            expect(item.group).toBe('Basic blocks')
        })

        test('should allow optional fields to be undefined', () => {
            const item: DefaultSuggestionItem = {
                key: 'emoji',
                title: 'Emoji',
                onItemClick: () => {},
            }

            expect(item.subtext).toBeUndefined()
            expect(item.badge).toBeUndefined()
            expect(item.aliases).toBeUndefined()
            expect(item.group).toBeUndefined()
        })
    })

    describe('onItemClick callback', () => {
        test('should be callable', () => {
            let called = false
            const item: DefaultSuggestionItem = {
                key: 'heading',
                title: 'Heading 1',
                onItemClick: () => {
                    called = true
                },
            }

            item.onItemClick()
            expect(called).toBe(true)
        })

        test('should execute callback with correct context', () => {
            let receivedValue = ''
            const item: DefaultSuggestionItem = {
                key: 'heading',
                title: 'Heading 1',
                onItemClick: () => {
                    receivedValue = 'inserted'
                },
            }

            item.onItemClick()
            expect(receivedValue).toBe('inserted')
        })
    })

    describe('key type constraint', () => {
        test('key should be a string from slash_menu dictionary keys', () => {
            const validKeys: Array<DefaultSuggestionItem['key']> = [
                'heading',
                'heading_2',
                'heading_3',
                'numbered_list',
                'bullet_list',
                'check_list',
                'paragraph',
                'code_block',
                'table',
                'image',
                'video',
                'audio',
                'file',
                'emoji',
            ]

            validKeys.forEach(key => {
                const item: DefaultSuggestionItem = {
                    key,
                    title: `Item for ${key}`,
                    onItemClick: () => {},
                }
                expect(item.key).toBe(key)
            })
        })
    })
})
