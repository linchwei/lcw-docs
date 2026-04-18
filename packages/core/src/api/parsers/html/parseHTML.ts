/**
 * HTML 解析
 *
 * 该文件提供将 HTML 字符串解析为块数组的功能。
 * 使用 ProseMirror 的 DOMParser 进行解析，并处理嵌套列表结构。
 */
import { DOMParser, Schema } from 'prosemirror-model'

import { Block } from '../../../blocks/defaultBlocks'
import { BlockSchema, InlineContentSchema, StyleSchema } from '../../../schema/index'
import { nodeToBlock } from '../../nodeConversions/nodeToBlock'
import { nestedListsToLcwDocStructure } from './util/nestedLists'

/**
 * 将 HTML 转换为块数组
 *
 * 异步函数，解析 HTML 字符串并转换为编辑器可用的块数组。
 * 首先处理嵌套列表结构，然后使用 ProseMirror DOMParser 进行解析。
 *
 * @param html - HTML 字符串
 * @param blockSchema - 块 schema
 * @param icSchema - 内联内容 schema
 * @param styleSchema - 样式 schema
 * @param pmSchema - ProseMirror schema
 * @returns 返回解析后的块数组
 */
export async function HTMLToBlocks<BSchema extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema>(
    html: string,
    blockSchema: BSchema,
    icSchema: I,
    styleSchema: S,
    pmSchema: Schema
): Promise<Block<BSchema, I, S>[]> {
    const htmlNode = nestedListsToLcwDocStructure(html)
    const parser = DOMParser.fromSchema(pmSchema)

    const parentNode = parser.parse(htmlNode, {
        topNode: pmSchema.nodes['blockGroup'].create(),
    })

    const blocks: Block<BSchema, I, S>[] = []

    for (let i = 0; i < parentNode.childCount; i++) {
        blocks.push(nodeToBlock(parentNode.child(i), blockSchema, icSchema, styleSchema))
    }

    return blocks
}