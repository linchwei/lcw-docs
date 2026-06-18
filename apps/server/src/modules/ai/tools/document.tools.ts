/**
 * 文档读取工具集
 *
 * 将编辑器的文档读取能力封装为 LangGraph Tool，
 * 使 AI Agent 能像人类一样"阅读"文档结构。
 *
 * 数据来源：
 * 前端在请求时将文档 blocks 传入，存储在 LangGraph configurable.context 中，
 * 工具通过 config.configurable 访问。工具不直接连接数据库或编辑器。
 *
 * 工具列表：
 * - getDocumentOutline: 获取文档大纲（标题层级）
 * - getSectionContent: 获取指定章节的详细内容
 * - getSelectedContent: 获取用户当前选区及上下文
 * - searchDocument: 在文档中搜索关键词
 *
 * @module tools/document
 */
import { tool } from '@langchain/core/tools'
import { z } from 'zod'

/**
 * 文档上下文接口
 *
 * 前端在请求时传入的文档结构化上下文，
 * 存储在 LangGraph configurable.context 中。
 * 这个接口与前端 StructuredContext 接口一一对应。
 */
export interface DocumentContext {
    /** 文档大纲：标题层级和 blockId 映射 */
    outline: Array<{
        /** 标题层级，1-6 对应 H1-H6 */
        level: number
        /** 标题文本 */
        text: string
        /** 对应的 Block ID，用于精确定位 */
        blockId: string
    }>
    /** 文档所有 block 的扁平列表 */
    blocks: Array<{
        /** Block 唯一标识 */
        id: string
        /** Block 类型：heading / paragraph / bulletListItem 等 */
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
        /** 选区前文（前 2 个 block 的内容拼接） */
        before: string
        /** 选区后文（后 2 个 block 的内容拼接） */
        after: string
    }
}

/**
 * 从 config 中获取文档上下文的辅助函数
 *
 * LangGraph Tool 的 config.configurable 包含请求时传入的上下文数据。
 * 此函数统一处理类型断言和空值检查。
 *
 * @param config - LangGraph 工具调用时传入的 config 对象
 * @returns 文档上下文，如果未传入则返回 null
 */
function getDocumentContext(config: Record<string, any>): DocumentContext | null {
    return config?.configurable?.context ?? null
}

/**
 * 获取文档大纲结构
 *
 * 返回文档中所有标题的层级和位置信息，
 * 帮助 Agent 快速了解文档整体结构。
 */
export const getDocumentOutline = tool(
    async (_, config) => {
        const ctx = getDocumentContext(config as any)
        if (!ctx) {
            return '错误：无法获取文档上下文，请确保文档已打开'
        }

        if (ctx.outline.length === 0) {
            return '当前文档没有标题结构'
        }

        // 格式化大纲为缩进可读文本
        const outlineText = ctx.outline
            .map(item => `${'  '.repeat(item.level - 1)}${item.level}. ${item.text} (id: ${item.blockId})`)
            .join('\n')

        return `文档大纲：\n${outlineText}`
    },
    {
        name: 'get_document_outline',
        description: '获取当前文档的大纲结构，包含所有标题层级和位置信息。用于快速了解文档结构。',
        schema: z.object({}),
    }
)

/**
 * 获取指定 Section 内容
 *
 * 通过标题名称或 blockId 定位章节，
 * 返回该章节下所有 block 的结构化内容。
 * 标题匹配支持模糊搜索（大小写不敏感）。
 */
export const getSectionContent = tool(
    async ({ sectionTitle, blockId }, config) => {
        const ctx = getDocumentContext(config as any)
        if (!ctx) {
            return '错误：无法获取文档上下文'
        }

        let targetBlockId = blockId

        // 如果没有 blockId，通过标题模糊匹配
        if (!targetBlockId && sectionTitle) {
            const matched = ctx.outline.find(item => item.text.toLowerCase().includes(sectionTitle.toLowerCase()))
            if (matched) {
                targetBlockId = matched.blockId
            } else {
                return `未找到标题包含 "${sectionTitle}" 的章节`
            }
        }

        if (!targetBlockId) {
            return '请提供 sectionTitle 或 blockId'
        }

        // 找到目标 block 在大纲中的位置
        const targetOutline = ctx.outline.find(item => item.blockId === targetBlockId)
        if (!targetOutline) {
            return `未找到 blockId 为 "${targetBlockId}" 的章节`
        }

        // 确定该 section 的范围：从目标标题到下一个同级/更高级标题
        const targetOutlineIndex = ctx.outline.indexOf(targetOutline)
        const nextOutline = ctx.outline[targetOutlineIndex + 1]

        // 在 blocks 列表中定位起止位置
        const startIdx = ctx.blocks.findIndex(b => b.id === targetBlockId)
        let endIdx = ctx.blocks.length

        if (nextOutline) {
            const nextIdx = ctx.blocks.findIndex(b => b.id === nextOutline.blockId)
            if (nextIdx > startIdx) {
                endIdx = nextIdx
            }
        }

        // 提取该 section 下的所有 block
        const sectionBlocks = ctx.blocks.slice(startIdx, endIdx)
        const content = sectionBlocks.map(b => `[${b.type}${b.level ? ` H${b.level}` : ''}] ${b.content}`).join('\n')

        return `章节 "${targetOutline.text}" 的内容：\n${content}`
    },
    {
        name: 'get_section_content',
        description: '获取文档中指定 section 的内容。通过标题名称模糊匹配或 blockId 精确定位。',
        schema: z.object({
            sectionTitle: z.string().optional().describe('Section 标题，支持模糊匹配'),
            blockId: z.string().optional().describe('Block ID，精确定位'),
        }),
    }
)

/**
 * 获取选区内容
 *
 * 返回用户当前选中的文本，以及前后各 2 个 block 的上下文。
 */
export const getSelectedContent = tool(
    async (_, config) => {
        const ctx = getDocumentContext(config as any)
        if (!ctx) {
            return '错误：无法获取文档上下文'
        }

        if (!ctx.selection) {
            return '当前没有选中文本'
        }

        const { text, before, after } = ctx.selection
        return `选区上下文：\n[前文] ${before}\n[选区] ${text}\n[后文] ${after}`
    },
    {
        name: 'get_selected_content',
        description: '获取用户当前选中的文档内容及其上下文（前后各 2 个 block）',
        schema: z.object({}),
    }
)

/**
 * 语义搜索文档
 *
 * 支持两种搜索模式：
 *   1. 语义搜索（默认）：通过 RAG 向量检索，理解查询语义，找到相关内容
 *   2. 关键词搜索：精确匹配关键词，作为语义搜索不可用时的降级方案
 *
 * 语义搜索通过 config.configurable.ragService 获取 RagService 实例，
 * 如果 RagService 不可用（未配置 Embedding API Key 或 pgvector 未就绪），
 * 自动降级为关键词搜索。
 */
export const searchDocument = tool(
    async ({ query, useSemanticSearch }, config) => {
        const ctx = getDocumentContext(config as any)
        if (!ctx) {
            return '错误：无法获取文档上下文'
        }

        // 语义搜索路径（RAG）
        if (useSemanticSearch) {
            const ragService = (config as any)?.configurable?.ragService
            if (ragService && ragService.isAvailable()) {
                try {
                    const results = await ragService.retrieve(query, {
                        topK: 5,
                        minScore: 0.5,
                    })

                    if (results.length === 0) {
                        return `语义搜索未找到与 "${query}" 相关的内容`
                    }

                    return results
                        .map((r: any, i: number) => {
                            const scoreStr = r.score.toFixed(2)
                            const preview = r.content.length > 300 ? r.content.slice(0, 300) + '...' : r.content
                            return `[相关内容 ${i + 1}] (相似度: ${scoreStr}, 文档: ${r.pageId})\n${preview}`
                        })
                        .join('\n\n')
                } catch {
                    // 语义搜索失败，降级为关键词搜索
                }
            }
        }

        // 关键词回退路径（原有逻辑）
        const lowerQuery = query.toLowerCase()
        const matches = ctx.blocks.filter(block => block.content.toLowerCase().includes(lowerQuery))

        if (matches.length === 0) {
            return `未找到包含 "${query}" 的内容`
        }

        // 限制返回数量，避免上下文过长
        const limited = matches.slice(0, 10)
        const result = limited.map(b => `[${b.type}] (id: ${b.id}) ${b.content.slice(0, 200)}`).join('\n')

        return `找到 ${matches.length} 个匹配结果（显示前 ${limited.length} 个）：\n${result}`
    },
    {
        name: 'search_document',
        description: '在文档中搜索内容。支持语义搜索（理解含义，默认）和关键词搜索（精确匹配）。语义搜索可找到意思相近但用词不同的内容。',
        schema: z.object({
            query: z.string().describe('搜索查询'),
            useSemanticSearch: z.boolean().default(true).describe('是否使用语义搜索（默认 true）。语义搜索不可用时自动降级为关键词搜索'),
        }),
    }
)

/** 导出所有文档读取工具，供 Agent 注册使用 */
export const documentReadTools = [getDocumentOutline, getSectionContent, getSelectedContent, searchDocument]
