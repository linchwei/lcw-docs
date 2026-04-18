/**
 * TypeScript 工具类型模块
 * 提供 TypeScript 类型操作的辅助类型和错误类
 */

/**
 * 不可达分支错误类
 * 用于 TypeScript 的 never 类型检查，确保所有可能的情况都被处理
 * 当在 switch/if 语句中使用时，如果存在未处理的 case，TypeScript 会提示错误
 * @example
 * function handleValue(val: string | number) {
 *   if (typeof val === 'string') {
 *     // 处理字符串
 *   } else if (typeof val === 'number') {
 *     // 处理数字
 *   } else {
 *     throw new UnreachableCaseError(val) // val 会被推断为 never
 *   }
 * }
 */
export class UnreachableCaseError extends Error {
    constructor(val: never) {
        super(`Unreachable case: ${val}`)
    }
}

/**
 * 断言对象为空
 * 检查对象是否为空（只有可选的 data-test 属性），用于开发环境下的类型检查
 * @param obj - 要检查的对象
 * @param throwError - 当对象不为空时是否抛出错误，默认为 true
 */
export function assertEmpty(obj: Record<string, never>, throwError = true) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { 'data-test': dataTest, ...rest } = obj // exclude data-test

    if (Object.keys(rest).length > 0 && throwError) {
        throw new Error('Object must be empty ' + JSON.stringify(obj))
    }
}

/**
 * 禁止类型推断的辅助类型
 * 用于在泛型函数中阻止类型自动推断，确保类型参数使用显式指定的值
 * @typeParam T - 要阻止推断的类型
 * @example
 * function foo<T>(arg: NoInfer<T>): T { return arg }
 * // 下面调用时，number 不会自动推断给 T，而是使用显式传入的值
 * foo<1>(1) // OK
 */
export type NoInfer<T> = [T][T extends any ? 0 : never]