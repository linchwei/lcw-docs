/**
 * 部分块测试工具
 *
 * 该文件提供用于测试的块转换工具函数。
 * 将 PartialBlock 转换为完整的 Block 对象，添加默认值和 ID。
 */
import { Block, PartialBlock } from '../../blocks/defaultBlocks'
import UniqueID from '../../extensions/UniqueID/UniqueID'
import { BlockSchema, TableContent } from '../../schema/blocks/types'
import {
    InlineContent,
    InlineContentSchema,
    isPartialLinkInlineContent,
    isStyledTextInlineContent,
    PartialInlineContent,
    StyledText,
} from '../../schema/inlineContent/types'
import { StyleSchema } from '../../schema/styles/types'

/**
 * 将文本简写转换为带样式的文本
 *
 * @param content - 字符串或带样式文本数组
 * @returns 返回带样式的文本数组
 */
function textShorthandToStyledText(content: string | StyledText<any>[] = ''): StyledText<any>[] {
    if (typeof content === 'string') {
        return [
            {
                type: 'text',
                text: content,
                styles: {},
            },
        ]
    }
    return content
}

/**
 * 将部分内容转换为内联内容
 *
 * 处理各种形式的内容输入，包括字符串、数组等。
 *
 * @param content - 部分内联内容或表格内容
 * @returns 返回内联内容数组或表格内容
 */
function partialContentToInlineContent(
    content: PartialInlineContent<any, any> | TableContent<any> | undefined
): InlineContent<any, any>[] | TableContent<any> | undefined {
    if (typeof content === 'string') {
        return textShorthandToStyledText(content)
    }

    if (Array.isArray(content)) {
        return content.flatMap(partialContent => {
            if (typeof partialContent === 'string') {
                return textShorthandToStyledText(partialContent)
            } else if (isPartialLinkInlineContent(partialContent)) {
                return {
                    ...partialContent,
                    content: textShorthandToStyledText(partialContent.content),
                }
            } else if (isStyledTextInlineContent(partialContent)) {
                return partialContent
            } else {
                return {
                    props: {},
                    ...partialContent,
                    content: partialContentToInlineContent(partialContent.content),
                } as any
            }
        })
    }

    return content
}

/**
 * 将部分块数组转换为测试用块数组
 *
 * @param schema - 块 schema
 * @param partialBlocks - 部分块数组
 * @returns 返回完整的块数组
 */
export function partialBlocksToBlocksForTesting<BSchema extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema>(
    schema: BSchema,
    partialBlocks: Array<PartialBlock<BSchema, I, S>>
): Array<Block<BSchema, I, S>> {
    return partialBlocks.map(partialBlock => partialBlockToBlockForTesting(schema, partialBlock))
}

/**
 * 将部分块转换为测试用块
 *
 * 添加默认值和类型信息，使部分块成为完整的块对象。
 *
 * @param schema - 块 schema
 * @param partialBlock - 部分块
 * @returns 返回完整的块
 */
export function partialBlockToBlockForTesting<BSchema extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema>(
    schema: BSchema,
    partialBlock: PartialBlock<BSchema, I, S>
): Block<BSchema, I, S> {
    const contentType: 'inline' | 'table' | 'none' = schema[partialBlock.type!].content

    const withDefaults: Block<BSchema, I, S> = {
        id: '',
        type: partialBlock.type!,
        props: {} as any,
        content:
            contentType === 'inline'
                ? []
                : contentType === 'table'
                  ? { type: 'tableContent', columnWidths: [], rows: [] }
                  : (undefined as any),
        children: [] as any,
        ...partialBlock,
    }

    Object.entries(schema[partialBlock.type!].propSchema).forEach(([propKey, propValue]) => {
        if (withDefaults.props[propKey] === undefined) {
            ;(withDefaults.props as any)[propKey] = propValue.default
        }
    })

    if (contentType === 'inline') {
        const content = withDefaults.content as InlineContent<I, S>[] | undefined
        withDefaults.content = partialContentToInlineContent(content) as any
    } else if (contentType === 'table') {
        const content = withDefaults.content as TableContent<I, S> | undefined
        withDefaults.content = {
            type: 'tableContent',
            columnWidths: content?.columnWidths || content?.rows[0]?.cells.map(() => undefined) || [],
            rows:
                content?.rows.map(row => ({
                    cells: row.cells.map(cell => partialContentToInlineContent(cell)),
                })) || [],
        } as any
    }

    return {
        ...withDefaults,
        content: partialContentToInlineContent(withDefaults.content),
        children: withDefaults.children.map(c => {
            return partialBlockToBlockForTesting(schema, c)
        }),
    } as any
}

/**
 * 为块添加 ID
 *
 * 如果块没有 ID，则生成一个唯一 ID。
 *
 * @param block - 部分块
 */
export function addIdsToBlock(block: PartialBlock<any, any, any>) {
    if (!block.id) {
        block.id = UniqueID.options.generateID()
    }
    if (block.children) {
        addIdsToBlocks(block.children)
    }
}

/**
 * 为块数组添加 ID
 *
 * @param blocks - 部分块数组
 */
export function addIdsToBlocks(blocks: PartialBlock<any, any, any>[]) {
    for (const block of blocks) {
        addIdsToBlock(block)
    }
}