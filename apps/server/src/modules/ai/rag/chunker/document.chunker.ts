/**
 * 文档分块器
 *
 * 将文档内容拆分为适合 Embedding 的语义单元（chunk）。
 * 分块是 RAG 流水线的关键步骤：分块质量直接影响检索精度。
 *
 * 分块策略（按优先级）：
 *   1. Block 级分块：每个 block 天然是一个语义单元
 *      - block 内容 ≤ maxChunkSize → 整个 block 作为一个 chunk
 *      - block 内容 > maxChunkSize → 按段落/句子进一步拆分
 *   2. 语义合并：相邻的短 block（如列表项）合并为一个 chunk
 *      - 避免生成过短的 chunk（< minChunkSize）
 *      - 保持上下文完整性
 *   3. 重叠窗口：长文本拆分时保留 overlapSize 的重叠
 *      - 确保跨 chunk 边界的信息不丢失
 *
 * @module rag/chunker/service
 */
import { Injectable, Logger } from '@nestjs/common'

import { DocumentChunk, ChunkingConfig, DEFAULT_CHUNKING_CONFIG } from './chunker.types'

/** Block 数据结构（与 DocumentContext.blocks 对齐） */
interface BlockData {
    id: string
    type: string
    content: string
    level?: number
}

@Injectable()
export class DocumentChunker {
    private readonly logger = new Logger(DocumentChunker.name)

    /**
     * 将文档 blocks 分块
     *
     * 基于 DocumentContext.blocks 结构进行分块：
     * - 短 block 合并（语义合并）
     * - 长 block 拆分（按段落/句子）
     * - 保持 blockId 追溯能力
     *
     * @param pageId - 文档 pageId
     * @param blocks - 文档 block 列表（来自 DocumentContext）
     * @param config - 分块配置，不传使用默认值
     * @returns 分块结果数组
     */
    chunkDocument(pageId: string, blocks: BlockData[], config?: Partial<ChunkingConfig>): DocumentChunk[] {
        const cfg = { ...DEFAULT_CHUNKING_CONFIG, ...config }
        const chunks: DocumentChunk[] = []
        let chunkIndex = 0

        // 临时缓冲区：累积短 block，达到 minChunkSize 后输出
        let bufferContent = ''
        let bufferBlockId = ''
        let bufferStartOffset = 0

        // 文档级累积偏移量，追踪每个 block 在文档中的字符位置
        let docOffset = 0

        for (const block of blocks) {
            if (!block.content || block.content.trim().length === 0) {
                continue
            }

            // 如果 block 内容超过 maxChunkSize，需要拆分
            if (block.content.length > cfg.maxChunkSize) {
                // 先输出缓冲区中的内容
                if (bufferContent.length >= cfg.minChunkSize) {
                    chunks.push({
                        pageId,
                        blockId: bufferBlockId,
                        content: bufferContent.trim(),
                        chunkIndex: chunkIndex++,
                        startOffset: bufferStartOffset,
                        endOffset: bufferStartOffset + bufferContent.length,
                    })
                    bufferContent = ''
                }

                // 拆分长 block
                const subChunks = this.splitLongText(
                    block.content,
                    pageId,
                    block.id,
                    cfg,
                    chunkIndex,
                )
                chunks.push(...subChunks)
                chunkIndex += subChunks.length
                docOffset += block.content.length
                continue
            }

            // 短 block：尝试合并到缓冲区
            if (bufferContent.length === 0) {
                bufferContent = block.content
                bufferBlockId = block.id
                bufferStartOffset = docOffset
            } else {
                bufferContent += '\n' + block.content
            }
            docOffset += block.content.length

            // 缓冲区达到 maxChunkSize 或超过 minChunkSize 且当前 block 是标题时提前输出
            if (bufferContent.length >= cfg.maxChunkSize ||
                (bufferContent.length >= cfg.minChunkSize && block.type === 'heading')
            ) {
                chunks.push({
                    pageId,
                    blockId: bufferBlockId,
                    content: bufferContent.trim(),
                    chunkIndex: chunkIndex++,
                    startOffset: bufferStartOffset,
                    endOffset: bufferStartOffset + bufferContent.length,
                })
                bufferContent = ''
            }
        }

        // 输出缓冲区剩余内容
        if (bufferContent.trim().length > 0) {
            chunks.push({
                pageId,
                blockId: bufferBlockId,
                content: bufferContent.trim(),
                chunkIndex: chunkIndex++,
                startOffset: bufferStartOffset,
                endOffset: bufferStartOffset + bufferContent.length,
            })
        }

        this.logger.log(`文档 ${pageId} 分块完成: ${blocks.length} 个 block → ${chunks.length} 个 chunk`)
        return chunks
    }

    /**
     * 将纯文本分块
     *
     * 用于 PageService.search 场景，输入是完整的文档文本而非 block 结构。
     * 按段落边界拆分，长段落按句子拆分。
     *
     * @param text - 完整文档文本
     * @param pageId - 文档 pageId
     * @param config - 分块配置
     * @returns 分块结果数组
     */
    chunkText(text: string, pageId: string, config?: Partial<ChunkingConfig>): DocumentChunk[] {
        const cfg = { ...DEFAULT_CHUNKING_CONFIG, ...config }

        if (!text || text.trim().length === 0) {
            return []
        }

        // 如果文本不超过 maxChunkSize，直接作为一个 chunk
        if (text.length <= cfg.maxChunkSize) {
            return [{
                pageId,
                blockId: 'full-doc',
                content: text.trim(),
                chunkIndex: 0,
                startOffset: 0,
                endOffset: text.length,
            }]
        }

        // 按段落拆分
        const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0)
        const chunks: DocumentChunk[] = []
        let chunkIndex = 0
        let currentContent = ''
        let startOffset = 0

        for (const para of paragraphs) {
            if (currentContent.length + para.length + 1 > cfg.maxChunkSize && currentContent.length > 0) {
                chunks.push({
                    pageId,
                    blockId: 'text-chunk',
                    content: currentContent.trim(),
                    chunkIndex: chunkIndex++,
                    startOffset,
                    endOffset: startOffset + currentContent.length,
                })
                startOffset += currentContent.length
                currentContent = para
            } else {
                currentContent = currentContent ? currentContent + '\n\n' + para : para
            }
        }

        if (currentContent.trim().length > 0) {
            chunks.push({
                pageId,
                blockId: 'text-chunk',
                content: currentContent.trim(),
                chunkIndex,
                startOffset,
                endOffset: startOffset + currentContent.length,
            })
        }

        return chunks
    }

    /**
     * 拆分长文本为多个子 chunk
     *
     * 当单个 block 内容超过 maxChunkSize 时使用。
     * 按段落边界拆分，段落过长时按句子拆分。
     * 相邻 chunk 之间保留 overlapSize 的重叠区域。
     *
     * @param text - 待拆分的长文本
     * @param pageId - 文档 pageId
     * @param blockId - 来源 block ID
     * @param config - 分块配置
     * @param startIndex - 起始 chunkIndex
     * @returns 子 chunk 数组
     */
    private splitLongText(
        text: string,
        pageId: string,
        blockId: string,
        config: ChunkingConfig,
        startIndex: number,
    ): DocumentChunk[] {
        const chunks: DocumentChunk[] = []

        // 按段落拆分
        const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0)

        let currentContent = ''
        let chunkIndex = startIndex
        let offset = 0

        for (const para of paragraphs) {
            if (para.length > config.maxChunkSize) {
                // 段落过长，按句子拆分
                const sentences = para.split(/(?<=[。！？.!?\n])/g).filter(s => s.trim().length > 0)

                for (const sentence of sentences) {
                    if (currentContent.length + sentence.length > config.maxChunkSize && currentContent.length > 0) {
                        chunks.push({
                            pageId,
                            blockId,
                            content: currentContent.trim(),
                            chunkIndex: chunkIndex++,
                            startOffset: offset,
                            endOffset: offset + currentContent.length,
                        })
                        offset += currentContent.length - config.overlapSize
                        // 保留重叠部分
                        currentContent = currentContent.slice(-config.overlapSize) + sentence
                    } else {
                        currentContent += sentence
                    }
                }
            } else if (currentContent.length + para.length + 1 > config.maxChunkSize && currentContent.length > 0) {
                chunks.push({
                    pageId,
                    blockId,
                    content: currentContent.trim(),
                    chunkIndex: chunkIndex++,
                    startOffset: offset,
                    endOffset: offset + currentContent.length,
                })
                offset += currentContent.length - config.overlapSize
                currentContent = currentContent.slice(-config.overlapSize) + '\n\n' + para
            } else {
                currentContent = currentContent ? currentContent + '\n\n' + para : para
            }
        }

        if (currentContent.trim().length > 0) {
            chunks.push({
                pageId,
                blockId,
                content: currentContent.trim(),
                chunkIndex,
                startOffset: offset,
                endOffset: offset + currentContent.length,
            })
        }

        return chunks
    }
}
