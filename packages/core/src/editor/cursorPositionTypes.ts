/**
 * cursorPositionTypes.ts
 *
 * 光标位置类型定义模块。
 * 定义了文本光标位置的相关类型，用于描述光标在文档中的位置信息。
 */

import { Block } from '../blocks/defaultBlocks'
import { BlockSchema, InlineContentSchema, StyleSchema } from '../schema/index'

/**
 * 文本光标位置类型
 *
 * 描述当前光标所在位置及其相邻区块的信息。
 *
 * @typeParam BSchema - 区块 Schema 类型
 * @typeParam I - 内联内容 Schema 类型
 * @typeParam S - 样式 Schema 类型
 */
export type TextCursorPosition<BSchema extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema> = {
    /**
     * 光标所在的当前区块
     */
    block: Block<BSchema, I, S>

    /**
     * 当前区块的前一个区块，如果不存在则为 undefined
     */
    prevBlock: Block<BSchema, I, S> | undefined

    /**
     * 当前区块的后一个区块，如果不存在则为 undefined
     */
    nextBlock: Block<BSchema, I, S> | undefined

    /**
     * 当前区块的父区块（如果光标在嵌套的区块内），如果不存在则为 undefined
     */
    parentBlock: Block<BSchema, I, S> | undefined
}
