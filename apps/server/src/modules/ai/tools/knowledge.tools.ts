/**
 * 知识库工具集
 *
 * 将 RAG 检索能力封装为 LangGraph Tool，
 * 使 AI Agent 能对知识库进行语义搜索、分块查询和跨文档关联。
 *
 * 数据来源：
 * - RAG 服务（ragService）：通过 config.configurable.ragService 注入，
 *   提供语义检索、向量搜索等能力
 * - 文档上下文（context）：通过 config.configurable.context 注入，
 *   与 document.tools.ts 共享同一份文档结构数据
 * - 页面标识（pageId）：通过 config.configurable.pageId 注入，
 *   标识当前正在操作的文档
 *
 * 工具列表：
 * - searchKnowledge: 语义搜索知识库内容
 * - getChunkDetail: 获取分块详情及前后文
 * - getDocumentStructure: 获取文档结构及分块分布
 * - listIndexedChunks: 列出已索引分块
 * - searchCrossDocuments: 跨文档语义搜索
 * - getRelatedDocuments: 获取关联文档
 *
 * @module tools/knowledge
 */
import { tool } from '@langchain/core/tools'
import { z } from 'zod'

import { DocumentContext } from './document.tools'

/**
 * 从 config 中获取 RAG 服务的辅助函数
 *
 * LangGraph Tool 的 config.configurable 包含请求时注入的 RAG 服务实例。
 * 此函数统一处理类型断言和空值检查。
 *
 * @param config - LangGraph 工具调用时传入的 config 对象
 * @returns RagService 实例，如果未注入则返回 null
 */
function getRagService(config: Record<string, any>): any | null {
    return config?.configurable?.ragService ?? null
}

/**
 * 从 config 中获取当前页面 ID 的辅助函数
 *
 * @param config - LangGraph 工具调用时传入的 config 对象
 * @returns 当前页面 ID，如果未传入则返回 null
 */
function getPageId(config: Record<string, any>): string | null {
    return config?.configurable?.pageId ?? null
}

/**
 * 从 config 中获取文档上下文的辅助函数
 *
 * 复用 document.tools.ts 中定义的 DocumentContext 接口，
 * 统一处理类型断言和空值检查。
 *
 * @param config - LangGraph 工具调用时传入的 config 对象
 * @returns 文档上下文，如果未传入则返回 null
 */
function getDocumentContext(config: Record<string, any>): DocumentContext | null {
    return config?.configurable?.context ?? null
}

/**
 * 从 config 中获取用户 ID 的辅助函数
 *
 * @param config - LangGraph 工具调用时传入的 config 对象
 * @returns 用户 ID，如果未传入则返回 null
 */
function _getUserId(config: Record<string, any>): string | null {
    return config?.configurable?.userId ?? null
}

/**
 * 语义搜索知识库内容
 *
 * 通过 RAG 向量检索，在当前文档或指定文档中搜索与查询语义相关的内容。
 * 支持通过 pageId 限定搜索范围，也可不传 pageId 搜索所有文档。
 * 返回结果包含相似度分数、文档标识、分块标识和内容预览。
 */
export const searchKnowledge = tool(
    async ({ query, topK, pageId }, config) => {
        const ragService = getRagService(config as any)
        if (!ragService) {
            return 'RAG 服务不可用'
        }

        try {
            const results = await ragService.retrieve(query, {
                topK,
                minScore: 0.5,
                pageId: pageId || undefined,
            })

            if (results.length === 0) {
                return `语义搜索未找到与 "${query}" 相关的内容`
            }

            return results
                .map((r: any, i: number) => {
                    const scoreStr = r.score.toFixed(2)
                    const preview = r.content.length > 300 ? r.content.slice(0, 300) + '...' : r.content
                    return `[搜索结果 ${i + 1}] (相似度: ${scoreStr}, 文档: ${r.pageId}, 分块: ${r.chunkId}, block: ${r.blockId})\n${preview}`
                })
                .join('\n\n')
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error)
            return `语义搜索失败: ${msg}`
        }
    },
    {
        name: 'search_knowledge',
        description: '语义搜索知识库内容。通过 RAG 向量检索，理解查询语义，找到相关内容。可限定搜索范围到特定文档。',
        schema: z.object({
            query: z.string().describe('搜索查询文本'),
            topK: z.number().default(5).describe('返回结果数量上限，默认 5'),
            pageId: z.string().optional().describe('限定搜索范围到特定文档，不传则搜索所有文档'),
        }),
    }
)

/**
 * 获取分块详情及前后文
 *
 * 通过分块 ID 获取该分块的完整内容，以及前后若干个分块的上下文。
 * 帮助 Agent 在定位到相关分块后，进一步了解其上下文环境。
 */
export const getChunkDetail = tool(
    async ({ chunkId, contextBlocks }, config) => {
        const ragService = getRagService(config as any)
        if (!ragService) {
            return 'RAG 服务不可用'
        }

        try {
            const { chunk, before, after } = await ragService.getChunkWithContext(chunkId, contextBlocks)

            const formatChunk = (r: any, marker: string) => {
                const preview = r.content.length > 300 ? r.content.slice(0, 300) + '...' : r.content
                return `${marker} (分块: ${r.chunkId}, block: ${r.blockId})\n${preview}`
            }

            const parts = [
                ...before.map((r: any) => formatChunk(r, '  [上下文]')),
                formatChunk(chunk, '→ [当前分块]'),
                ...after.map((r: any) => formatChunk(r, '  [上下文]')),
            ]

            return `分块详情 (ID: ${chunkId})：\n\n${parts.join('\n\n')}`
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error)
            return `获取分块详情失败: ${msg}`
        }
    },
    {
        name: 'get_chunk_detail',
        description: '获取指定分块的详情及前后文。在定位到相关分块后，用此工具了解其上下文环境。',
        schema: z.object({
            chunkId: z.number().describe('分块 ID'),
            contextBlocks: z.number().default(2).describe('前后各获取的上下文分块数，默认 2'),
        }),
    }
)

/**
 * 获取文档结构及分块分布
 *
 * 返回当前文档的大纲结构和各 block 的摘要信息。
 * 如果 includeChunkMap 为 true，还会包含分块在文档中的分布信息，
 * 帮助 Agent 了解哪些区域已被索引、分块如何划分。
 */
export const getDocumentStructure = tool(
    async ({ includeChunkMap }, config) => {
        const ctx = getDocumentContext(config as any)
        if (!ctx) {
            return '错误：无法获取文档上下文，请确保文档已打开'
        }

        // 格式化大纲
        const outlineText =
            ctx.outline.length > 0
                ? ctx.outline.map(item => `${'  '.repeat(item.level - 1)}${item.level}. ${item.text} (id: ${item.blockId})`).join('\n')
                : '当前文档没有标题结构'

        // 格式化 block 摘要
        const blockSummary = ctx.blocks
            .slice(0, 30)
            .map(b => {
                const preview = b.content.length > 80 ? b.content.slice(0, 80) + '...' : b.content
                return `[${b.type}${b.level ? ` H${b.level}` : ''}] (id: ${b.id}) ${preview}`
            })
            .join('\n')

        const moreBlocks = ctx.blocks.length > 30 ? `\n... 还有 ${ctx.blocks.length - 30} 个 block 未显示` : ''

        let result = `文档大纲：\n${outlineText}\n\nBlock 摘要（共 ${ctx.blocks.length} 个）：\n${blockSummary}${moreBlocks}`

        // 如果需要分块分布信息，通过 RAG 服务获取
        if (includeChunkMap) {
            const ragService = getRagService(config as any)
            const pageId = getPageId(config as any)

            if (ragService && pageId) {
                try {
                    const { items: chunks } = await ragService.listChunks(pageId, 100, 0)

                    if (chunks.length > 0) {
                        // 按分块序号排序
                        const sorted = [...chunks].sort((a: any, b: any) => a.chunkIndex - b.chunkIndex)
                        const chunkMap = sorted
                            .map((c: any) => {
                                const preview = c.content.length > 60 ? c.content.slice(0, 60) + '...' : c.content
                                return `  [分块 ${c.chunkIndex}] (block: ${c.blockId}) ${preview}`
                            })
                            .join('\n')

                        result += `\n\n分块分布（共 ${chunks.length} 个分块）：\n${chunkMap}`
                    } else {
                        result += '\n\n分块分布：当前文档暂无索引分块'
                    }
                } catch {
                    result += '\n\n分块分布：获取分块信息失败'
                }
            } else {
                result += '\n\n分块分布：RAG 服务不可用或缺少 pageId，无法获取分块分布'
            }
        }

        return result
    },
    {
        name: 'get_document_structure',
        description: '获取当前文档的结构及分块分布信息。包含大纲、block 摘要，可选展示分块分布。',
        schema: z.object({
            includeChunkMap: z.boolean().default(false).describe('是否包含分块分布信息，默认 false'),
        }),
    }
)

/**
 * 列出已索引分块
 *
 * 获取指定文档中已索引的分块列表，包含分块 ID、内容预览、
 * 来源 block ID 和分块序号。用于了解文档的索引状态和分块情况。
 */
export const listIndexedChunks = tool(
    async ({ pageId, limit, offset }, config) => {
        const ragService = getRagService(config as any)
        if (!ragService) {
            return 'RAG 服务不可用'
        }

        try {
            const { items: results, total } = await ragService.listChunks(pageId, limit, offset)

            if (results.length === 0) {
                return `文档 ${pageId} 暂无索引分块`
            }

            const formatted = results
                .map((r: any, i: number) => {
                    const preview = r.content.length > 150 ? r.content.slice(0, 150) + '...' : r.content
                    return `[分块 ${offset + i + 1}] (id: ${r.chunkId}, block: ${r.blockId}, 序号: ${r.chunkIndex})\n${preview}`
                })
                .join('\n\n')

            return `文档 ${pageId} 的索引分块（共 ${total} 个，显示 ${offset + 1}-${offset + results.length}）：\n\n${formatted}`
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error)
            return `获取索引分块失败: ${msg}`
        }
    },
    {
        name: 'list_indexed_chunks',
        description: '列出指定文档中已索引的分块，包含内容预览和分块信息。用于了解文档的索引状态。',
        schema: z.object({
            pageId: z.string().describe('文档 pageId'),
            limit: z.number().default(20).describe('返回结果数量上限，默认 20'),
            offset: z.number().default(0).describe('偏移量，默认 0'),
        }),
    }
)

/**
 * 跨文档语义搜索
 *
 * 在所有文档中进行语义搜索，不限定特定文档。
 * 返回结果按文档分组，包含文档信息和匹配内容。
 * 适用于用户提出的问题需要跨多个文档查找相关信息的场景。
 */
export const searchCrossDocuments = tool(
    async ({ query, topK, minScore }, config) => {
        const ragService = getRagService(config as any)
        if (!ragService) {
            return 'RAG 服务不可用'
        }

        try {
            // 不传 pageId，搜索所有文档
            const results = await ragService.retrieve(query, {
                topK,
                minScore,
            })

            if (results.length === 0) {
                return `跨文档搜索未找到与 "${query}" 相关的内容`
            }

            // 按文档分组
            const grouped = new Map<string, any[]>()
            for (const r of results) {
                const list = grouped.get(r.pageId) || []
                list.push(r)
                grouped.set(r.pageId, list)
            }

            // 格式化输出
            const parts: string[] = []
            let docIndex = 0
            for (const [pageId, chunks] of grouped) {
                docIndex++
                parts.push(`--- 文档 ${docIndex}: ${pageId} (${chunks.length} 个匹配) ---`)
                for (const chunk of chunks) {
                    const scoreStr = chunk.score.toFixed(2)
                    const preview = chunk.content.length > 200 ? chunk.content.slice(0, 200) + '...' : chunk.content
                    parts.push(`  (相似度: ${scoreStr}, block: ${chunk.blockId})\n  ${preview}`)
                }
            }

            return `跨文档搜索结果（共 ${results.length} 条，来自 ${grouped.size} 个文档）：\n\n${parts.join('\n\n')}`
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error)
            return `跨文档搜索失败: ${msg}`
        }
    },
    {
        name: 'search_cross_documents',
        description: '跨文档语义搜索。在所有文档中搜索与查询语义相关的内容，结果按文档分组展示。',
        schema: z.object({
            query: z.string().describe('搜索查询文本'),
            topK: z.number().default(10).describe('返回结果数量上限，默认 10'),
            minScore: z.number().default(0.5).describe('最低相似度阈值，默认 0.5'),
        }),
    }
)

/**
 * 获取关联文档
 *
 * 根据当前文档的内容，查找其他文档中语义相关的内容。
 * 实现方式：获取当前文档的代表性分块，然后搜索其他文档中的相似内容。
 * 适用于发现文档间的关联关系和知识交叉引用。
 */
export const getRelatedDocuments = tool(
    async ({ pageId, topK }, config) => {
        const ragService = getRagService(config as any)
        if (!ragService) {
            return 'RAG 服务不可用'
        }

        try {
            // 获取当前文档的代表性分块（取前几个分块作为文档摘要）
            const { items: currentChunks } = await ragService.listChunks(pageId, 3, 0)

            if (currentChunks.length === 0) {
                return `文档 ${pageId} 暂无索引分块，无法查找关联文档`
            }

            // 用当前文档的分块内容作为查询，搜索其他文档
            const representativeContent = currentChunks.map((c: any) => c.content).join(' ')

            // 截取前 500 字符作为查询，避免查询过长
            const query = representativeContent.slice(0, 500)

            const allResults = await ragService.retrieve(query, {
                topK: topK + currentChunks.length, // 多取一些，排除自身后仍够
                minScore: 0.3,
            })

            // 过滤掉当前文档的结果
            const otherDocResults = allResults.filter((r: any) => r.pageId !== pageId)

            if (otherDocResults.length === 0) {
                return `未找到与文档 ${pageId} 关联的其他文档`
            }

            // 按文档分组
            const grouped = new Map<string, any[]>()
            for (const r of otherDocResults) {
                const list = grouped.get(r.pageId) || []
                list.push(r)
                grouped.set(r.pageId, list)
            }

            // 格式化输出
            const parts: string[] = []
            let docIndex = 0
            for (const [relatedPageId, chunks] of grouped) {
                docIndex++
                // 取该文档中最高分的结果作为代表
                const bestScore = Math.max(...chunks.map((c: any) => c.score))
                parts.push(`--- 关联文档 ${docIndex}: ${relatedPageId} (最高相似度: ${bestScore.toFixed(2)}, ${chunks.length} 个匹配) ---`)
                // 只展示前 3 个匹配
                for (const chunk of chunks.slice(0, 3)) {
                    const scoreStr = chunk.score.toFixed(2)
                    const preview = chunk.content.length > 150 ? chunk.content.slice(0, 150) + '...' : chunk.content
                    parts.push(`  (相似度: ${scoreStr}, block: ${chunk.blockId})\n  ${preview}`)
                }
            }

            return `关联文档（共 ${grouped.size} 个文档）：\n\n${parts.join('\n\n')}`
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error)
            return `获取关联文档失败: ${msg}`
        }
    },
    {
        name: 'get_related_documents',
        description: '获取与当前文档语义关联的其他文档。基于当前文档内容搜索其他文档中的相似内容。',
        schema: z.object({
            pageId: z.string().describe('当前文档 pageId'),
            topK: z.number().default(5).describe('返回结果数量上限，默认 5'),
        }),
    }
)

/** 导出所有知识库工具，供 Agent 注册使用 */
export const knowledgeTools = [
    searchKnowledge,
    getChunkDetail,
    getDocumentStructure,
    listIndexedChunks,
    searchCrossDocuments,
    getRelatedDocuments,
]
