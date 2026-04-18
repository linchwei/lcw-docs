/**
 * 合并块
 *
 * 该文件提供块合并功能，用于将两个相邻的块合并为一个块。
 * 主要用于编辑器中的块操作，如在块之间没有内容时合并块。
 */
import { Node, ResolvedPos } from 'prosemirror-model'
import { EditorState } from 'prosemirror-state'

import { getBlockInfoFromResolvedPos } from '../../../getBlockInfoFromPos'

/**
 * 获取前一个块的位置
 *
 * 在合并操作中，需要找到当前块前面的块。
 * 如果前一个块在块组中，会递归查找直到找到实际的块容器。
 *
 * @param doc - 文档节点
 * @param $nextBlockPos - 当前块的位置解析结果
 * @returns 返回前一个块的位置
 */
export const getPrevBlockPos = (doc: Node, $nextBlockPos: ResolvedPos) => {
    const prevNode = $nextBlockPos.nodeBefore

    if (!prevNode) {
        throw new Error(
            `Attempted to get previous blockContainer node for merge at position ${$nextBlockPos.pos} but a previous node does not exist`
        )
    }

    let prevBlockBeforePos = $nextBlockPos.posAtIndex($nextBlockPos.index() - 1)
    let prevBlockInfo = getBlockInfoFromResolvedPos(doc.resolve(prevBlockBeforePos))

    while (prevBlockInfo.blockGroup) {
        const group = prevBlockInfo.blockGroup.node

        prevBlockBeforePos = doc.resolve(prevBlockInfo.blockGroup.beforePos + 1).posAtIndex(group.childCount - 1)
        prevBlockInfo = getBlockInfoFromResolvedPos(doc.resolve(prevBlockBeforePos))
    }

    return doc.resolve(prevBlockBeforePos)
}

/**
 * 检查两个块是否可以合并
 *
 * 只有当两个块的内容类型都是 'inline*' 且前一个块有子内容时才能合并。
 *
 * @param $prevBlockPos - 前一个块的位置
 * @param $nextBlockPos - 后一个块的位置
 * @returns 返回是否可以合并
 */
const canMerge = ($prevBlockPos: ResolvedPos, $nextBlockPos: ResolvedPos) => {
    const prevBlockInfo = getBlockInfoFromResolvedPos($prevBlockPos)
    const nextBlockInfo = getBlockInfoFromResolvedPos($nextBlockPos)

    return (
        prevBlockInfo.blockContent.node.type.spec.content === 'inline*' &&
        nextBlockInfo.blockContent.node.type.spec.content === 'inline*' &&
        prevBlockInfo.blockContent.node.childCount > 0
    )
}

/**
 * 执行块合并操作
 *
 * 内部函数，执行实际的块合并逻辑。
 * 如果后一个块在块组中，先将其从块组中提升出来。
 * 然后删除两个块之间的内容，使它们合并。
 *
 * @param state - 编辑器状态
 * @param dispatch - 分发函数
 * @param $prevBlockPos - 前一个块的位置
 * @param $nextBlockPos - 后一个块的位置
 * @returns 返回是否成功
 */
const mergeBlocks = (
    state: EditorState,
    dispatch: ((args?: any) => any) | undefined,
    $prevBlockPos: ResolvedPos,
    $nextBlockPos: ResolvedPos
) => {
    const nextBlockInfo = getBlockInfoFromResolvedPos($nextBlockPos)

    if (nextBlockInfo.blockGroup) {
        const childBlocksStart = state.doc.resolve(nextBlockInfo.blockGroup.beforePos + 1)
        const childBlocksEnd = state.doc.resolve(nextBlockInfo.blockGroup.afterPos - 1)
        const childBlocksRange = childBlocksStart.blockRange(childBlocksEnd)

        if (dispatch) {
            state.tr.lift(childBlocksRange!, $nextBlockPos.depth)
        }
    }

    if (dispatch) {
        const prevBlockInfo = getBlockInfoFromResolvedPos($prevBlockPos)

        dispatch(state.tr.delete(prevBlockInfo.blockContent.afterPos - 1, nextBlockInfo.blockContent.beforePos + 1))
    }

    return true
}

/**
 * 合并块命令
 *
 * 创建一个命令，用于在两个块之间的指定位置合并它们。
 *
 * @param posBetweenBlocks - 两个块之间的位置
 * @returns 返回命令函数
 */
export const mergeBlocksCommand =
    (posBetweenBlocks: number) =>
    ({ state, dispatch }: { state: EditorState; dispatch: ((args?: any) => any) | undefined }) => {
        const $nextBlockPos = state.doc.resolve(posBetweenBlocks)
        const $prevBlockPos = getPrevBlockPos(state.doc, $nextBlockPos)

        if (!canMerge($prevBlockPos, $nextBlockPos)) {
            return false
        }

        return mergeBlocks(state, dispatch, $prevBlockPos, $nextBlockPos)
    }