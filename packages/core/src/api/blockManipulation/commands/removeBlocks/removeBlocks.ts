/**
 * 删除块
 *
 * 该文件包含用于从编辑器中删除块的功能。
 * 主要函数 removeBlocks 用于删除指定的块，并返回被删除的块列表。
 * removeBlocksWithCallback 提供了更高级的功能，允许在删除过程中执行自定义回调。
 */
import { Node } from 'prosemirror-model'
import { Transaction } from 'prosemirror-state'

import { Block } from '../../../../blocks/defaultBlocks'
import type { LcwDocEditor } from '../../../../editor/LcwDocEditor'
import { BlockIdentifier, BlockSchema, InlineContentSchema, StyleSchema } from '../../../../schema/index'
import { nodeToBlock } from '../../../nodeConversions/nodeToBlock'

/**
 * 带回调函数的删除块实现
 *
 * 允许在删除过程中执行自定义回调，用于计算文档大小变化等操作。
 *
 * @param editor - 编辑器实例
 * @param blocksToRemove - 要删除的块标识符数组
 * @param callback - 可选回调函数，接收节点、位置、事务和已删除大小，返回新的已删除大小
 * @returns 返回被删除的块数组
 */
export function removeBlocksWithCallback<BSchema extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema>(
    editor: LcwDocEditor<BSchema, I, S>,
    blocksToRemove: BlockIdentifier[],
    callback?: (node: Node, pos: number, tr: Transaction, removedSize: number) => number
): Block<BSchema, I, S>[] {
    const ttEditor = editor._tiptapEditor
    const tr = ttEditor.state.tr

    const idsOfBlocksToRemove = new Set<string>(blocksToRemove.map(block => (typeof block === 'string' ? block : block.id)))
    const removedBlocks: Block<BSchema, I, S>[] = []
    let removedSize = 0

    ttEditor.state.doc.descendants((node, pos) => {
        if (idsOfBlocksToRemove.size === 0) {
            return false
        }

        if (node.type.name !== 'blockContainer' || !idsOfBlocksToRemove.has(node.attrs.id)) {
            return true
        }

        removedBlocks.push(
            nodeToBlock(node, editor.schema.blockSchema, editor.schema.inlineContentSchema, editor.schema.styleSchema, editor.blockCache)
        )
        idsOfBlocksToRemove.delete(node.attrs.id)

        removedSize = callback?.(node, pos, tr, removedSize) || removedSize
        const oldDocSize = tr.doc.nodeSize
        tr.delete(pos - removedSize - 1, pos - removedSize + node.nodeSize + 1)
        const newDocSize = tr.doc.nodeSize
        removedSize += oldDocSize - newDocSize

        return false
    })

    if (idsOfBlocksToRemove.size > 0) {
        const notFoundIds = [...idsOfBlocksToRemove].join('\n')

        throw Error('Blocks with the following IDs could not be found in the editor: ' + notFoundIds)
    }

    editor.dispatch(tr)

    return removedBlocks
}

/**
 * 删除指定的块
 *
 * 从编辑器中删除一个或多个块，并返回被删除的块数组。
 *
 * @param editor - 编辑器实例
 * @param blocksToRemove - 要删除的块标识符数组
 * @returns 返回被删除的块数组
 */
export function removeBlocks<BSchema extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema>(
    editor: LcwDocEditor<BSchema, I, S>,
    blocksToRemove: BlockIdentifier[]
): Block<BSchema, I, S>[] {
    return removeBlocksWithCallback(editor, blocksToRemove)
}