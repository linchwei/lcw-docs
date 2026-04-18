import { describe, it, expect } from 'vitest'
import {
    UnreachableCaseError,
    assertEmpty,
    NoInfer,
} from '../../src/util/typescript'

describe('typescript utils', () => {
    describe('UnreachableCaseError', () => {
        it('should create error with value message', () => {
            const error = new UnreachableCaseError('foo' as never)
            expect(error.message).toBe('Unreachable case: foo')
        })

        it('should be instance of Error', () => {
            const error = new UnreachableCaseError(1 as never)
            expect(error).toBeInstanceOf(Error)
        })

        it('should handle string values', () => {
            const error = new UnreachableCaseError('unknown' as never)
            expect(error.message).toBe('Unreachable case: unknown')
        })
    })

    describe('assertEmpty', () => {
        it('should not throw for empty object', () => {
            expect(() => assertEmpty({}, false)).not.toThrow()
            expect(() => assertEmpty({}, true)).not.toThrow()
        })

        it('should throw for non-empty object', () => {
            expect(() => assertEmpty({ foo: 'bar' as unknown as never }, true)).toThrow('Object must be empty')
        })

        it('should not throw for non-empty object when throwError is false', () => {
            expect(() => assertEmpty({ foo: 'bar' as unknown as never }, false)).not.toThrow()
        })

        it('should include full object in error message', () => {
            try {
                assertEmpty({ a: 1 as never, b: 2 as never }, true)
            } catch (e) {
                expect((e as Error).message).toContain('{"a":1,"b":2}')
            }
        })
    })

    describe('NoInfer', () => {
        it('should preserve type information', () => {
            function test<T>(value: T, defaultValue: NoInfer<T>) {
                return value ?? defaultValue
            }
            // NoInfer<'hello'> 类型为 'hello'，所以传入 'world' 会有类型错误
            // 这里只测试运行时行为，不测试类型约束
            const result = test<string>('hello', 'world')
            expect(result).toBe('hello')
        })

        it('should work with number type', () => {
            function test<T>(value: T, defaultValue: NoInfer<T>) {
                return value ?? defaultValue
            }
            const result = test<number>(42, 0)
            expect(result).toBe(42)
        })

        it('should work with object type', () => {
            function test<T>(value: T, defaultValue: NoInfer<T>) {
                return value ?? defaultValue
            }
            const obj = { key: 'value' }
            const result = test(obj, { key: 'default' })
            expect(result).toBe(obj)
        })
    })
})
