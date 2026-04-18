import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
    isAppleOS,
    formatKeyboardShortcut,
    mergeCSSClasses,
    isSafari,
} from '../../src/util/browser'

describe('browser utils', () => {
    const originalNavigator = globalThis.navigator

    beforeEach(() => {
        vi.resetModules()
    })

    afterEach(() => {
        Object.defineProperty(globalThis, 'navigator', {
            value: originalNavigator,
            writable: true,
            configurable: true,
        })
    })

    describe('isAppleOS', () => {
        it('should return true for Mac platform', () => {
            Object.defineProperty(globalThis, 'navigator', {
                value: { platform: 'Mac', userAgent: 'Mozilla/5.0' },
                writable: true,
                configurable: true,
            })
            expect(isAppleOS()).toBe(true)
        })

        it('should return true for iOS user agent with AppleWebKit and Mobile', () => {
            Object.defineProperty(globalThis, 'navigator', {
                value: {
                    platform: 'iPad',
                    userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
                },
                writable: true,
                configurable: true,
            })
            expect(isAppleOS()).toBe(true)
        })

        it('should return false for non-Apple platform', () => {
            Object.defineProperty(globalThis, 'navigator', {
                value: { platform: 'Win32', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
                writable: true,
                configurable: true,
            })
            expect(isAppleOS()).toBe(false)
        })

        it('should return false when navigator is undefined', () => {
            Object.defineProperty(globalThis, 'navigator', {
                value: undefined,
                writable: true,
                configurable: true,
            })
            expect(isAppleOS()).toBe(false)
        })
    })

    describe('formatKeyboardShortcut', () => {
        it('should replace Mod with ⌘ on Apple OS', () => {
            Object.defineProperty(globalThis, 'navigator', {
                value: { platform: 'Mac', userAgent: 'Mozilla/5.0' },
                writable: true,
                configurable: true,
            })
            expect(formatKeyboardShortcut('Mod+S')).toBe('⌘+S')
        })

        it('should replace Mod with default ctrlText on non-Apple OS', () => {
            Object.defineProperty(globalThis, 'navigator', {
                value: { platform: 'Win32', userAgent: 'Mozilla/5.0' },
                writable: true,
                configurable: true,
            })
            expect(formatKeyboardShortcut('Mod+S')).toBe('Ctrl+S')
        })

        it('should use custom ctrlText when provided', () => {
            Object.defineProperty(globalThis, 'navigator', {
                value: { platform: 'Win32', userAgent: 'Mozilla/5.0' },
                writable: true,
                configurable: true,
            })
            expect(formatKeyboardShortcut('Mod+S', 'Ctrl')).toBe('Ctrl+S')
            expect(formatKeyboardShortcut('Mod+S', 'Strg')).toBe('Strg+S')
        })
    })

    describe('mergeCSSClasses', () => {
        it('should merge multiple classes', () => {
            expect(mergeCSSClasses('foo', 'bar', 'baz')).toBe('foo bar baz')
        })

        it('should filter out empty strings', () => {
            expect(mergeCSSClasses('foo', '', 'bar', '', 'baz')).toBe('foo bar baz')
        })

        it('should handle all empty strings', () => {
            expect(mergeCSSClasses('', '', '')).toBe('')
        })

        it('should handle single class', () => {
            expect(mergeCSSClasses('foo')).toBe('foo')
        })

        it('should handle no arguments', () => {
            expect(mergeCSSClasses()).toBe('')
        })

        it('should handle undefined values', () => {
            expect(mergeCSSClasses('foo', undefined as any, 'bar')).toBe('foo bar')
        })
    })

    describe('isSafari', () => {
        it('should return true for Safari user agent', () => {
            Object.defineProperty(globalThis, 'navigator', {
                value: { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15' },
                writable: true,
                configurable: true,
            })
            expect(isSafari()).toBe(true)
        })

        it('should return false for Chrome user agent', () => {
            Object.defineProperty(globalThis, 'navigator', {
                value: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
                writable: true,
                configurable: true,
            })
            expect(isSafari()).toBe(false)
        })

        it('should return false for Android browser', () => {
            Object.defineProperty(globalThis, 'navigator', {
                value: { userAgent: 'Mozilla/5.0 (Linux; Android 11) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36' },
                writable: true,
                configurable: true,
            })
            expect(isSafari()).toBe(false)
        })
    })
})