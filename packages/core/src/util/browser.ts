/**
 * 浏览器工具函数模块
 * 提供浏览器环境检测、快捷键格式化、CSS类名处理等功能
 */

/**
 * 检测当前是否为 Apple 操作系统（macOS 或 iOS）
 * 通过检测 navigator.platform 或 userAgent 判断
 * @returns 是否为 Apple 操作系统
 */
export const isAppleOS = () => {
    return (
        typeof navigator !== 'undefined' &&
        (/Mac/.test(navigator.platform) || (/AppleWebKit/.test(navigator.userAgent) && /Mobile\/\w+/.test(navigator.userAgent)))
    )
}

/**
 * 格式化键盘快捷键显示文本
 * 将快捷键中的 'Mod' 修饰符替换为对应操作系统的符号
 * Apple 系统显示 '⌘'，其他系统显示指定的 ctrlText（默认为 'Ctrl'）
 * @param shortcut - 原始快捷键字符串，例如 'Mod+S'
 * @param ctrlText - 非 Apple 系统使用的修饰符文本，默认为 'Ctrl'
 * @returns 格式化后的快捷键文本
 */
export function formatKeyboardShortcut(shortcut: string, ctrlText = 'Ctrl') {
    if (isAppleOS()) {
        return shortcut.replace('Mod', '⌘')
    } else {
        return shortcut.replace('Mod', ctrlText)
    }
}

/**
 * 合并多个 CSS 类名
 * 过滤掉空字符串，只保留有值的类名并用空格连接
 * @param classes - 要合并的类名数组
 * @returns 合并后的类名字符串
 */
export function mergeCSSClasses(...classes: string[]) {
    return classes.filter(c => c).join(' ')
}

/**
 * 检测当前浏览器是否为 Safari
 * 通过 userAgent 字符串判断，排除 Chrome 和 Android
 * @returns 是否为 Safari 浏览器
 */
export const isSafari = () => /^((?!chrome|android).)*safari/i.test(navigator.userAgent)