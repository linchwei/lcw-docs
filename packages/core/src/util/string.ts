/**
 * 字符串工具函数模块
 * 提供字符串转换和处理的功能函数
 */

/**
 * 将驼峰命名转换为 data-kebab 格式
 * 主要用于将 JavaScript 属性名转换为 HTML data 属性名
 * @param str - 驼峰格式的字符串，例如 'myProperty'
 * @returns data-kebab 格式的字符串，例如 'data-my-property'
 * @example
 * camelToDataKebab('myProperty') // 返回 'data-my-property'
 */
export function camelToDataKebab(str: string): string {
    return 'data-' + str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}

/**
 * 从 URL 中提取文件名
 * 获取 URL 路径最后一部分作为文件名
 * @param url - 完整的 URL 字符串
 * @returns URL 中的文件名，如果 URL 以斜杠结尾则返回原 URL
 * @example
 * filenameFromURL('https://example.com/path/to/file.txt') // 返回 'file.txt'
 * filenameFromURL('https://example.com/path/') // 返回 'https://example.com/path/'
 */
export function filenameFromURL(url: string): string {
    const parts = url.split('/')
    if (!parts.length || parts[parts.length - 1] === '') {
        return url
    }
    return parts[parts.length - 1]
}