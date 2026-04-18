/**
 * 在指定位置插入块
 *
 * 该函数用于在编辑器的指定位置插入一个或多个块。
 * 可以选择在参考块之前或之后插入。
 *
 * @param editor - 编辑器实例
 * @param blocksToInsert - 要插入的块数组
 * @param referenceBlock - 参考块的标识符（ID或对象）
 * @param placement - 插入位置，'before' 表示在参考块之前，'after' 表示在参考块之后
 * @returns 返回插入的块数组
 */
import { Node } from 'prosemirror-model'

import { Block, PartialBlock } from '../../../../blocks/defaultBlocks'
import type { LcwDocEditor } from '../../../../editor/LcwDocEditor'
import { BlockIdentifier, BlockSchema, InlineContentSchema, StyleSchema } from '../../../../schema/index'
import { blockToNode } from '../../../nodeConversions/blockToNode'
import { nodeToBlock } from '../../../nodeConversions/nodeToBlock'
import { getNodeById } from '../../../nodeUtil'

export function insertBlocks<BSchema extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema>(
    editor: LcwDocEditor<BSchema, I, S>,
    blocksToInsert: PartialBlock<BSchema, I, S>[],
    referenceBlock: BlockIdentifier,
    placement: 'before' | 'after' = 'before'
): Block<BSchema, I, S>[] {
    const id = typeof referenceBlock === 'string' ? referenceBlock : referenceBlock.id

    const nodesToInsert: Node[] = []
    for (const blockSpec of blocksToInsert) {
        nodesToInsert.push(blockToNode(blockSpec, editor.pmSchema, editor.schema.styleSchema))
    }

    const { node, posBeforeNode } = getNodeById(id, editor._tiptapEditor.state.doc)

    if (placement === 'before') {
        editor.dispatch(editor._tiptapEditor.state.tr.insert(posBeforeNode, nodesToInsert))
    }

    if (placement === 'after') {
        editor.dispatch(editor._tiptapEditor.state.tr.insert(posBeforeNode + node.nodeSize, nodesToInsert))
    }

    const insertedBlocks: Block<BSchema, I, S>[] = []
    for (const node of nodesToInsert) {
        insertedBlocks.push(
            nodeToBlock(node, editor.schema.blockSchema, editor.schema.inlineContentSchema, editor.schema.styleSchema, editor.blockCache)
        )
    }

    return insertedBlocks
}