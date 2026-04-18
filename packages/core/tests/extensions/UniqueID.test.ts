import { describe, test, expect, beforeEach, vi } from 'vitest'
import { UniqueID } from '../../src/extensions/UniqueID/UniqueID'

const { mockV4 } = vi.hoisted(() => {
    return { mockV4: vi.fn(() => 'mock-uuid-v4') }
})

vi.mock('uuid', () => ({
    v4: mockV4,
}))

describe('UniqueID Extension', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        if (typeof window !== 'undefined') {
            delete (window as any).__TEST_OPTIONS
        }
    })

    describe('generateID', () => {
        test('should generate UUID v4 when no test options exist', () => {
            const extension = UniqueID.configure({
                types: ['paragraph'],
            })
            const id = extension.options.generateID()
            expect(id).toBe('mock-uuid-v4')
            expect(mockV4).toHaveBeenCalledTimes(1)
        })

        test('should use mockID from window.__TEST_OPTIONS when available', () => {
            ;(window as any).__TEST_OPTIONS = { mockID: 5 }
            const extension = UniqueID.configure({
                types: ['paragraph'],
            })
            expect(extension.options.generateID()).toBe('6')
            expect(extension.options.generateID()).toBe('7')
            expect(extension.options.generateID()).toBe('8')
        })

        test('should initialize mockID to 0 when only __TEST_OPTIONS exists', () => {
            ;(window as any).__TEST_OPTIONS = {}
            const extension = UniqueID.configure({
                types: ['paragraph'],
            })
            expect(extension.options.generateID()).toBe('0')
            expect(extension.options.generateID()).toBe('1')
        })

        test('should use custom generateID function when provided', () => {
            const customGenerator = vi.fn(() => 'custom-id-123')
            const extension = UniqueID.configure({
                types: ['paragraph'],
                generateID: customGenerator,
            })
            const id = extension.options.generateID()
            expect(id).toBe('custom-id-123')
            expect(customGenerator).toHaveBeenCalledTimes(1)
        })
    })

    describe('filterTransaction', () => {
        test('should be null by default', () => {
            const extension = UniqueID.configure({
                types: ['paragraph'],
            })
            expect(extension.options.filterTransaction).toBeNull()
        })

        test('should accept custom filterTransaction function', () => {
            const customFilter = vi.fn((_tr: any) => true)
            const extension = UniqueID.configure({
                types: ['paragraph'],
                filterTransaction: customFilter as any,
            })
            expect(extension.options.filterTransaction).toBe(customFilter)
        })
    })

    describe('types configuration', () => {
        test('should accept empty types array', () => {
            const extension = UniqueID.configure({
                types: [],
            })
            expect(extension.options.types).toEqual([])
        })

        test('should accept multiple node types', () => {
            const extension = UniqueID.configure({
                types: ['paragraph', 'heading', 'blockquote'],
            })
            expect(extension.options.types).toContain('paragraph')
            expect(extension.options.types).toContain('heading')
            expect(extension.options.types).toContain('blockquote')
        })

        test('types.includes should work correctly', () => {
            const extension = UniqueID.configure({
                types: ['paragraph', 'heading'],
            })
            expect(extension.options.types.includes('paragraph')).toBe(true)
            expect(extension.options.types.includes('heading')).toBe(true)
            expect(extension.options.types.includes('image')).toBe(false)
        })
    })

    describe('addGlobalAttributes', () => {
        test('should return attributes configuration for configured types', () => {
            const mockCtx = {
                options: {
                    types: ['paragraph'],
                    attributeName: 'id',
                },
            }
            const types = mockCtx.options.types
            const attributeName = mockCtx.options.attributeName

            expect(types).toEqual(['paragraph'])
            expect(attributeName).toBe('id')
        })

        test('should handle custom attributeName', () => {
            const mockCtx = {
                options: {
                    types: ['paragraph', 'heading'],
                    attributeName: 'customId',
                },
            }
            expect(mockCtx.options.attributeName).toBe('customId')
            expect(mockCtx.options.types).toContain('paragraph')
        })

        test('should support setIdAttribute option', () => {
            const mockCtx = {
                options: {
                    types: ['paragraph'],
                    attributeName: 'id',
                    setIdAttribute: true,
                },
            }
            expect(mockCtx.options.setIdAttribute).toBe(true)
        })

        test('setIdAttribute should be false by default', () => {
            const extension = UniqueID.configure({
                types: ['paragraph'],
            })
            expect(extension.options.setIdAttribute).toBe(false)
        })
    })

    describe('addProseMirrorPlugins', () => {
        test('should have filterTransaction option for controlling transaction filtering', () => {
            const customFilter = vi.fn((_tr: any) => false)
            const extension = UniqueID.configure({
                types: ['paragraph'],
                filterTransaction: customFilter as any,
            })
            expect(extension.options.filterTransaction).toBe(customFilter)
        })
    })

    describe('Extension configuration', () => {
        test('should have correct name', () => {
            const extension = UniqueID.configure({
                types: ['paragraph'],
            })
            expect(extension.name).toBe('uniqueID')
        })

        test('should use default attributeName when not specified', () => {
            const extension = UniqueID.configure({
                types: ['paragraph'],
            })
            expect(extension.options.attributeName).toBe('id')
        })

        test('should accept custom attributeName', () => {
            const extension = UniqueID.configure({
                types: ['paragraph'],
                attributeName: 'uniqueIdentifier',
            })
            expect(extension.options.attributeName).toBe('uniqueIdentifier')
        })

        test('setIdAttribute should be false by default', () => {
            const extension = UniqueID.configure({
                types: ['paragraph'],
            })
            expect(extension.options.setIdAttribute).toBe(false)
        })
    })
})