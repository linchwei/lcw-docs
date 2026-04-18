/**
 * 防抖函数
 * @param func
 * @param wait
 * @returns
 */
export const debounce = <T extends (...args: any[]) => any>(func: T, wait = 300) => {
    let timeout: ReturnType<typeof setTimeout>
    return (...args: Parameters<T>): Promise<ReturnType<T>> =>
        new Promise(resolve => {
            clearTimeout(timeout)
            timeout = setTimeout(() => {
                resolve(func(...args))
            }, wait)
        })
}
