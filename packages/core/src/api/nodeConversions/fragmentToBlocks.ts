/**
 * 片段转块
 *
 * 该文件提供将 ProseMirror Fragment 转换为块数组的功能。
 * 用于从文档片段中提取所有块容器节点。
 */
import { Fragment } from '@tiptap/pm/model'

import { LcwDocSchema } from '../../editor/LcwDocSchema'
import { BlockNoDefaults, BlockSchema, InlineContentSchema, StyleSchema } from '../../schema/index'
import { nodeToBlock } from './nodeToBlock'

/**
 * 将片段转换为块数组
 *
 * 遍历片段中的所有节点，找出所有 blockContainer 节点并转换为块。
 * 跳过嵌套在 blockGroup 中的 blockContainer（由父节点处理）。
 *
 * @param fragment - ProseMirror 片段
 * @param schema - 编辑器 schema
 * @returns 返回块数组
 */
export function fragmentToBlocks<B extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema>(
    fragment: Fragment,
    schema: LcwDocSchema<B, I, S>
) {
    const blocks: BlockNoDefaults<B, I, S>[] = []
    fragment.descendants(node => {
        if (node.type.name === 'blockContainer') {
            if (node.firstChild?.type.name === 'blockGroup') {
                return true
            }
            blocks.push(nodeToBlock(node, schema.blockSchema, schema.inlineContentSchema, schema.styleSchema))
            return false
        }
        return true
    })
    return blocks
}