/**
 * 结构化上下文提取器
 *
 * 替代当前 extractTextFromBlocks(maxLength) 的全文拼接方式，
 * 实现分层上下文策略，在有限的 Token 预算内提供最有效的上下文。
 *
 * 分层策略：
 * 1. 大纲层（始终包含）：文档标题层级，约 200 tokens
 *    - 让 Agent 快速了解文档整体结构
 *    - 不包含具体内容，只包含标题和层级
 *
 * 2. 选区层（有选区时包含）：选区 + 前后上下文，约 1000 tokens
 *    - 用户选中的文本
 *    - 选区前 2 个 block 的内容
 *    - 选区后 2 个 block 的内容
 *
 * 3. Section 摘要层（无选区时包含）：各 section 首段，约 3000 tokens
 *    - 每个 heading 下的第一个 paragraph 作为摘要
 *    - 每个摘要截断到 100 字符
 *
 * 与全文拼接的对比：
 * - 全文拼接：6000 字符 ≈ 1500 tokens，但信息密度低
 * - 分层策略：大纲 200 + 选区 1000 + 摘要 3000 ≈ 4200 tokens，信息密度高
 *
 * @module context/structured-context
 */

/**
 * 结构化上下文接口（前后端共享）
 *
 * 前端在请求时提取文档结构，传入后端，
 * 后端存入 LangGraph configurable.context 中。
 * 此接口与前端 StructuredContext 接口一一对应。
 */
export interface StructuredContext {
    /** 文档大纲：标题层级和 blockId 映射 */
    outline: Array<{
        /** 标题层级，1-6 对应 H1-H6 */
        level: number
        /** 标题文本 */
        text: string
        /** 对应的 Block ID */
        blockId: string
    }>

    /** 文档所有 block 的扁平列表 */
    blocks: Array<{
        /** Block 唯一标识 */
        id: string
        /** Block 类型 */
        type: string
        /** Block 的文本内容 */
        content: string
        /** 标题层级（仅 heading 类型有值） */
        level?: number
    }>

    /** 用户选区信息（可选，有选区时才传入） */
    selection?: {
        /** 选中的文本 */
        text: string
        /** 选区所在 blockId */
        blockId: string
        /** 选区前文 */
        before: string
        /** 选区后文 */
        after: string
    }
}

/**
 * 将结构化上下文格式化为 System Prompt 中的文本
 *
 * 按照分层策略，将上下文格式化为 AI 可理解的文本。
 * 此函数在后端 AiService 中调用，将上下文注入到 system message 中。
 *
 * @param ctx - 结构化上下文
 * @returns 格式化后的文本，可直接拼接到 system prompt 中
 */
export function formatStructuredContext(ctx: StructuredContext): string {
    const parts: string[] = []

    // 第 1 层：文档大纲（始终包含）
    if (ctx.outline.length > 0) {
        const outlineText = ctx.outline.map(item => `${'  '.repeat(item.level - 1)}${item.level}. ${item.text}`).join('\n')
        parts.push(`## 文档大纲\n${outlineText}`)
    }

    // 第 2 层：选区上下文（有选区时包含）
    if (ctx.selection) {
        parts.push(`## 当前选区上下文\n[前文] ${ctx.selection.before}\n[选区] ${ctx.selection.text}\n[后文] ${ctx.selection.after}`)
    }

    // 第 3 层：Section 摘要（无选区时包含各 section 首段）
    if (!ctx.selection && ctx.blocks.length > 0) {
        const summaries = extractSectionSummaries(ctx)
        if (summaries.length > 0) {
            parts.push(`## 各章节摘要\n${summaries.join('\n')}`)
        }
    }

    return parts.join('\n\n')
}

/**
 * 提取各 Section 的首段作为摘要
 *
 * 每个 heading 下的第一个 paragraph block 作为该 section 的摘要。
 * 摘要截断到 100 字符，避免上下文过长。
 *
 * @param ctx - 结构化上下文
 * @returns 摘要文本列表，格式如 "- # 标题：摘要内容..."
 */
function extractSectionSummaries(ctx: StructuredContext): string[] {
    const summaries: string[] = []
    let currentHeading = ''

    for (const block of ctx.blocks) {
        if (block.type === 'heading') {
            // 遇到标题，更新当前标题
            currentHeading = `${'#'.repeat(block.level || 1)} ${block.content}`
        } else if (block.type === 'paragraph' && currentHeading) {
            // 遇到段落且有标题，取首段作为摘要
            const truncated = block.content.length > 100 ? block.content.slice(0, 100) + '...' : block.content
            summaries.push(`- ${currentHeading}：${truncated}`)
            // 重置标题，避免重复添加同一 section 的多个段落
            currentHeading = ''
        }
    }

    return summaries
}
