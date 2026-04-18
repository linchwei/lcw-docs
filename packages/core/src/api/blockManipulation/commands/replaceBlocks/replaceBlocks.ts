/**
 * 替换块
 *
 * 该函数用于在编辑器中同时执行删除和插入操作。
 * 可以用新的块替换指定的旧块，实现块的替换功能。
 */
import { Node } from 'prosemirror-model'

import { Block, PartialBlock } from '../../../../blocks/defaultBlocks'
import type { LcwDocEditor } from '../../../../editor/LcwDocEditor'
import { BlockIdentifier, BlockSchema, InlineContentSchema, StyleSchema } from '../../../../schema/index'
import { blockToNode } from '../../../nodeConversions/blockToNode'
import { nodeToBlock } from '../../../nodeConversions/nodeToBlock'
import { removeBlocksWithCallback } from '../removeBlocks/removeBlocks'

/**
 * 替换指定的块
 *
 * 将指定的块替换为新的块，返回插入的块和被移除的块。
 *
 * @param editor - 编辑器实例
 * @param blocksToRemove - 要移除的块标识符数组
 * @param blocksToInsert - 要插入的块数组
 * @returns 返回包含 insertedBlocks 和 removedBlocks 的对象
 */
export function replaceBlocks<BSchema extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema>(
    editor: LcwDocEditor<BSchema, I, S>,
    blocksToRemove: BlockIdentifier[],
    blocksToInsert: PartialBlock<BSchema, I, S>[]
): {
    insertedBlocks: Block<BSchema, I, S>[]
    removedBlocks: Block<BSchema, I, S>[]
} {
    const nodesToInsert: Node[] = []
    for (const block of blocksToInsert) {
        nodesToInsert.push(blockToNode(block, editor.pmSchema, editor.schema.styleSchema))
    }

    const idOfFirstBlock = typeof blocksToRemove[0] === 'string' ? blocksToRemove[0] : blocksToRemove[0].id
    const removedBlocks = removeBlocksWithCallback(editor, blocksToRemove, (node, pos, tr, removedSize) => {
        if (node.attrs.id === idOfFirstBlock) {
            const oldDocSize = tr.doc.nodeSize
            tr.insert(pos, nodesToInsert)
            const newDocSize = tr.doc.nodeSize

            return removedSize + oldDocSize - newDocSize
        }

        return removedSize
    })

    const insertedBlocks: Block<BSchema, I, S>[] = []
    for (const node of nodesToInsert) {
        insertedBlocks.push(
            nodeToBlock(node, editor.schema.blockSchema, editor.schema.inlineContentSchema, editor.schema.styleSchema, editor.blockCache)
        )
    }

    return { insertedBlocks, removedBlocks }
}