/**
 * 移动块
 *
 * 该文件提供块移动功能，用于在编辑器中移动块的位置。
 * 支持将块移动到另一个块之前或之后，也可以上下移动。
 */
import { NodeSelection, Selection, TextSelection } from 'prosemirror-state'
import { CellSelection } from 'prosemirror-tables'

import type { LcwDocEditor } from '../../../../editor/LcwDocEditor'
import { BlockIdentifier } from '../../../../schema/index'
import { getBlockInfoFromSelection } from '../../../getBlockInfoFromPos'
import { getNodeById } from '../../../nodeUtil'

/**
 * 块选择数据
 *
 * 保存块选择的状态信息，包括选择类型（文本、节点、单元格）
 * 和相关的位置信息，用于在移动块后恢复选择。
 */
type BlockSelectionData = (
    | {
          type: 'text'
          anchor: number
          head: number
      }
    | {
          type: 'node'
          from: number
      }
    | {
          type: 'cell'
          anchorCell: number
          headCell: number
      }
) & {
    blockId: string
    blockPos: number
}

/**
 * 获取块选择数据
 *
 * 保存当前块选择的状态，包括选择类型和位置。
 * 用于在移动块后恢复选择。
 *
 * @param editor - 编辑器实例
 * @returns 返回块选择数据
 */
function getBlockSelectionData(editor: LcwDocEditor<any, any, any>): BlockSelectionData {
    const { blockContainer } = getBlockInfoFromSelection(editor._tiptapEditor.state)

    const selectionData = {
        blockId: blockContainer.node.attrs.id,
        blockPos: blockContainer.beforePos,
    }

    if (editor._tiptapEditor.state.selection instanceof CellSelection) {
        return {
            ...selectionData,
            type: 'cell' as const,
            anchorCell: (editor._tiptapEditor.state.selection as CellSelection).$anchorCell.pos,
            headCell: (editor._tiptapEditor.state.selection as CellSelection).$headCell.pos,
        }
    } else if (editor._tiptapEditor.state.selection instanceof NodeSelection) {
        return {
            ...selectionData,
            type: 'node' as const,
            from: editor._tiptapEditor.state.selection.from,
        }
    } else {
        return {
            ...selectionData,
            type: 'text' as const,
            anchor: editor._tiptapEditor.state.selection.anchor,
            head: editor._tiptapEditor.state.selection.head,
        }
    }
}

/**
 * 从数据更新块选择
 *
 * 根据之前保存的块选择数据恢复选择状态。
 * 计算块移动后的位置偏移，确保选择位置正确。
 *
 * @param editor - 编辑器实例
 * @param data - 之前保存的块选择数据
 */
function updateBlockSelectionFromData(editor: LcwDocEditor<any, any, any>, data: BlockSelectionData) {
    const blockPos = getNodeById(data.blockId, editor._tiptapEditor.state.doc).posBeforeNode

    let selection: Selection
    if (data.type === 'cell') {
        selection = CellSelection.create(
            editor._tiptapEditor.state.doc,
            data.anchorCell + (blockPos - data.blockPos),
            data.headCell + (blockPos - data.blockPos)
        )
    } else if (data.type === 'node') {
        selection = NodeSelection.create(editor._tiptapEditor.state.doc, data.from + (blockPos - data.blockPos))
    } else {
        selection = TextSelection.create(
            editor._tiptapEditor.state.doc,
            data.anchor + (blockPos - data.blockPos),
            data.head + (blockPos - data.blockPos)
        )
    }

    editor._tiptapEditor.view.dispatch(editor._tiptapEditor.state.tr.setSelection(selection))
}

/**
 * 移动选中的块和选择
 *
 * 将当前选中的块移动到参考块的指定位置（之前或之后）。
 * 移动后恢复块的选择状态。
 *
 * @param editor - 编辑器实例
 * @param referenceBlock - 参考块的标识符
 * @param placement - 放置位置，'before' 或 'after'
 */
export function moveSelectedBlockAndSelection(
    editor: LcwDocEditor<any, any, any>,
    referenceBlock: BlockIdentifier,
    placement: 'before' | 'after'
) {
    const { block } = editor.getTextCursorPosition()
    const selectionData = getBlockSelectionData(editor)

    editor.removeBlocks([block])
    editor.insertBlocks([block], referenceBlock, placement)

    updateBlockSelectionFromData(editor, selectionData)
}

/**
 * 将块向上移动
 *
 * 将当前选中的块移动到上一个兄弟块之前。
 * 如果没有上一个兄弟块但有父块，则移动到父块之前。
 */
export function moveBlockUp(editor: LcwDocEditor<any, any, any>) {
    const editorSelection = editor.getSelection()
    if (editorSelection && editorSelection.blocks.length > 1) {
        return
    }

    const { prevBlock, parentBlock } = editor.getTextCursorPosition()

    let referenceBlockId: string | undefined
    let placement: 'before' | 'after' | undefined

    if (!prevBlock) {
        if (parentBlock) {
            referenceBlockId = parentBlock.id
            placement = 'before'
        }
    } else if (prevBlock.children.length > 0) {
        referenceBlockId = prevBlock.children[prevBlock.children.length - 1].id
        placement = 'after'
    } else {
        referenceBlockId = prevBlock.id
        placement = 'before'
    }

    if (!referenceBlockId || !placement) {
        return
    }

    moveSelectedBlockAndSelection(editor, referenceBlockId, placement)
}

/**
 * 将块向下移动
 *
 * 将当前选中的块移动到下一个兄弟块之后。
 * 如果没有下一个兄弟块但有父块，则移动到父块之后。
 */
export function moveBlockDown(editor: LcwDocEditor<any, any, any>) {
    const editorSelection = editor.getSelection()
    if (editorSelection && editorSelection.blocks.length > 1) {
        return
    }

    const { nextBlock, parentBlock } = editor.getTextCursorPosition()

    let referenceBlockId: string | undefined
    let placement: 'before' | 'after' | undefined

    if (!nextBlock) {
        if (parentBlock) {
            referenceBlockId = parentBlock.id
            placement = 'after'
        }
    } else if (nextBlock.children.length > 0) {
        referenceBlockId = nextBlock.children[0].id
        placement = 'before'
    } else {
        referenceBlockId = nextBlock.id
        placement = 'after'
    }

    if (!referenceBlockId || !placement) {
        return
    }

    moveSelectedBlockAndSelection(editor, referenceBlockId, placement)
}