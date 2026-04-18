import { describe, it, expect, beforeEach, vi } from 'vitest'
import { EventEmitter } from '../../src/util/EventEmitter'

interface TestEvents {
    click: [x: number, y: number]
    change: [value: string]
    reset: []
    data: [data: { id: number; name: string }]
}

class TestableEventEmitter<T extends Record<string, any>> extends EventEmitter<T> {
    testEmit(event: keyof T, ...args: any[]) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.emit(event as any, ...(args as any))
    }
    testRemoveAllListeners() {
        this.removeAllListeners()
    }
}

describe('EventEmitter', () => {
    let emitter: TestableEventEmitter<TestEvents>

    beforeEach(() => {
        emitter = new TestableEventEmitter<TestEvents>()
    })

    describe('on and emit', () => {
        it('should register and call event handler', () => {
            const handler = vi.fn()
            emitter.on('reset', handler)
            emitter.testEmit('reset')

            expect(handler).toHaveBeenCalledTimes(1)
        })

        it('should pass arguments to handler', () => {
            const handler = vi.fn()
            emitter.on('click', handler)
            emitter.testEmit('click', 100, 200)

            expect(handler).toHaveBeenCalledWith(100, 200)
        })

        it('should support multiple handlers for same event', () => {
            const handler1 = vi.fn()
            const handler2 = vi.fn()
            emitter.on('change', handler1)
            emitter.on('change', handler2)
            emitter.testEmit('change', 'test')

            expect(handler1).toHaveBeenCalledWith('test')
            expect(handler2).toHaveBeenCalledWith('test')
        })

        it('should call handlers with object argument', () => {
            const handler = vi.fn()
            emitter.on('data', handler)
            const data = { id: 1, name: 'test' }
            emitter.testEmit('data', data)

            expect(handler).toHaveBeenCalledWith(data)
        })

        it('should not call handler if event not registered', () => {
            const handler = vi.fn()
            emitter.testEmit('reset')
            expect(handler).not.toHaveBeenCalled()
        })
    })

    describe('off', () => {
        it('should remove specific handler', () => {
            const handler1 = vi.fn()
            const handler2 = vi.fn()
            emitter.on('reset', handler1)
            emitter.on('reset', handler2)
            emitter.off('reset', handler1)
            emitter.testEmit('reset')

            expect(handler1).not.toHaveBeenCalled()
            expect(handler2).toHaveBeenCalledTimes(1)
        })

        it('should remove all handlers for event when no handler specified', () => {
            const handler1 = vi.fn()
            const handler2 = vi.fn()
            emitter.on('reset', handler1)
            emitter.on('reset', handler2)
            emitter.off('reset')
            emitter.testEmit('reset')

            expect(handler1).not.toHaveBeenCalled()
            expect(handler2).not.toHaveBeenCalled()
        })

        it('should not throw when removing non-existent handler', () => {
            const handler = vi.fn()
            expect(() => emitter.off('reset', handler)).not.toThrow()
        })
    })

    describe('removeAllListeners', () => {
        it('should remove all event listeners', () => {
            const clickHandler = vi.fn()
            const changeHandler = vi.fn()
            emitter.on('click', clickHandler)
            emitter.on('change', changeHandler)
            emitter.testRemoveAllListeners()
            emitter.testEmit('click', 0, 0)
            emitter.testEmit('change', 'test')

            expect(clickHandler).not.toHaveBeenCalled()
            expect(changeHandler).not.toHaveBeenCalled()
        })
    })

    describe('return value of on', () => {
        it('should return unsubscribe function', () => {
            const handler = vi.fn()
            const unsubscribe = emitter.on('reset', handler)
            unsubscribe()
            emitter.testEmit('reset')

            expect(handler).not.toHaveBeenCalled()
        })
    })
})
