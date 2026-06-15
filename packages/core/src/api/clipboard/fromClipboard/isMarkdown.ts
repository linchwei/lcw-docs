/**
 * Markdown 检测辅助函数
 *
 * 判断纯文本是否包含 Markdown 语法特征，
 * 用于粘贴时决定是否尝试 Markdown 解析。
 */

const MARKDOWN_PATTERN = /^(#{1,6}\s|[-*+]\s|\d+\.\s|```|>\s|\*\*|__|\[.*?\]\(.*?\)|!\[.*?\]\(.*?\)|---|\*\*\*|___)/m

/**
 * 判断文本是否看起来像 Markdown
 *
 * @param text - 待检测的纯文本
 * @returns 如果文本包含 Markdown 语法特征则返回 true
 */
export function looksLikeMarkdown(text: string): boolean {
    if (text.length < 2) return false
    return MARKDOWN_PATTERN.test(text)
}
