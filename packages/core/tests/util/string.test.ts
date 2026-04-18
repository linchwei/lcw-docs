import { describe, it, expect } from 'vitest'
import {
    camelToDataKebab,
    filenameFromURL,
} from '../../src/util/string'

describe('string utils', () => {
    describe('camelToDataKebab', () => {
        it('should convert camelCase to data-kebab-case', () => {
            expect(camelToDataKebab('test')).toBe('data-test')
            expect(camelToDataKebab('testCase')).toBe('data-test-case')
            expect(camelToDataKebab('myTestCase')).toBe('data-my-test-case')
        })

        it('should handle single character', () => {
            expect(camelToDataKebab('a')).toBe('data-a')
            expect(camelToDataKebab('A')).toBe('data-a')
        })
    })

    describe('filenameFromURL', () => {
        it('should extract filename from URL', () => {
            expect(filenameFromURL('https://example.com/path/to/file.txt')).toBe('file.txt')
            expect(filenameFromURL('https://example.com/file.pdf')).toBe('file.pdf')
        })

        it('should handle URL with query parameters', () => {
            expect(filenameFromURL('https://example.com/file.txt?query=1')).toBe('file.txt?query=1')
        })

        it('should return URL if last segment is empty', () => {
            expect(filenameFromURL('https://example.com/path/')).toBe('https://example.com/path/')
        })

        it('should handle URL with only filename', () => {
            expect(filenameFromURL('file.txt')).toBe('file.txt')
        })

        it('should handle URL with hash', () => {
            expect(filenameFromURL('https://example.com/file.txt#section')).toBe('file.txt#section')
        })
    })
})