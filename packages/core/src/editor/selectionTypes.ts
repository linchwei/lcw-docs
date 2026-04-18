/**
 * selectionTypes.ts
 *
 * 选区类型定义模块。
 * 定义了文档选区的相关类型，用于描述用户在编辑器中选择的区块内容。
 */

import { Block } from '../blocks/defaultBlocks'
import { BlockSchema, InlineContentSchema, StyleSchema } from '../schema/index'

/**
 * 选区类型
 *
 * 描述当前编辑器选区中包含的区块列表。
 *
 * @typeParam BSchema - 区块 Schema 类型
 * @typeParam I - 内联内容 Schema 类型
 * @typeParam S - 样式 Schema 类型
 */
export type Selection<BSchema extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema> = {
    /**
     * 选区中包含的区块数组
     */
    blocks: Block<BSchema, I, S>[]
}
