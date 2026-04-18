/**
 * 文本光标位置
 *
 * 该文件提供获取和设置文本光标位置的功能。
 * 用于获取光标所在块的信息，以及相邻块和父块的信息。
 */
import { Node } from 'prosemirror-model'

import { TextCursorPosition } from '../../../../editor/cursorPositionTypes'
import type { LcwDocEditor } from '../../../../editor/LcwDocEditor'
import { BlockIdentifier, BlockSchema, InlineContentSchema, StyleSchema } from '../../../../schema/index'
import { UnreachableCaseError } from '../../../../util/typescript'
import { getBlockInfo, getBlockInfoFromSelection } from '../../../getBlockInfoFromPos'
import { nodeToBlock } from '../../../nodeConversions/nodeToBlock'
import { getNodeById } from '../../../nodeUtil'

/**
 * 获取文本光标位置信息
 *
 * 返回当前光标所在块的信息，包括：
 * - 当前块
 * - 前一个块
 * - 下一个块
 * - 父块（如果存在）
 *
 * @param editor - 编辑器实例
 * @returns 返回文本光标位置信息对象
 */
export function getTextCursorPosition<BSchema extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema>(
    editor: LcwDocEditor<BSchema, I, S>
): TextCursorPosition<BSchema, I, S> {
    const { blockContainer } = getBlockInfoFromSelection(editor._tiptapEditor.state)

    const resolvedPos = editor._tiptapEditor.state.doc.resolve(blockContainer.beforePos)
    const prevNode = resolvedPos.nodeBefore

    const nextNode = editor._tiptapEditor.state.doc.resolve(blockContainer.afterPos).nodeAfter

    let parentNode: Node | undefined = undefined
    if (resolvedPos.depth > 1) {
        parentNode = resolvedPos.node(resolvedPos.depth - 1)
    }

    return {
        block: nodeToBlock(
            blockContainer.node,
            editor.schema.blockSchema,
            editor.schema.inlineContentSchema,
            editor.schema.styleSchema,
            editor.blockCache
        ),
        prevBlock:
            prevNode === null
                ? undefined
                : nodeToBlock(
                      prevNode,
                      editor.schema.blockSchema,
                      editor.schema.inlineContentSchema,
                      editor.schema.styleSchema,
                      editor.blockCache
                  ),
        nextBlock:
            nextNode === null
                ? undefined
                : nodeToBlock(
                      nextNode,
                      editor.schema.blockSchema,
                      editor.schema.inlineContentSchema,
                      editor.schema.styleSchema,
                      editor.blockCache
                  ),
        parentBlock:
            parentNode === undefined
                ? undefined
                : nodeToBlock(
                      parentNode,
                      editor.schema.blockSchema,
                      editor.schema.inlineContentSchema,
                      editor.schema.styleSchema,
                      editor.blockCache
                  ),
    }
}

/**
 * 设置文本光标位置
 *
 * 将光标设置到指定块的开始或结束位置。
 *
 * @param editor - 编辑器实例
 * @param targetBlock - 目标块的标识符
 * @param placement - 放置位置，'start' 表示开始，'end' 表示结束
 */
export function setTextCursorPosition<BSchema extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema>(
    editor: LcwDocEditor<BSchema, I, S>,
    targetBlock: BlockIdentifier,
    placement: 'start' | 'end' = 'start'
) {
    const id = typeof targetBlock === 'string' ? targetBlock : targetBlock.id

    const posInfo = getNodeById(id, editor._tiptapEditor.state.doc)
    const { blockContent } = getBlockInfo(posInfo)

    const contentType: 'none' | 'inline' | 'table' = editor.schema.blockSchema[blockContent.node.type.name]!.content

    if (contentType === 'none') {
        editor._tiptapEditor.commands.setNodeSelection(blockContent.beforePos)
        return
    }

    if (contentType === 'inline') {
        if (placement === 'start') {
            editor._tiptapEditor.commands.setTextSelection(blockContent.beforePos + 1)
        } else {
            editor._tiptapEditor.commands.setTextSelection(blockContent.afterPos - 1)
        }
    } else if (contentType === 'table') {
        if (placement === 'start') {
            editor._tiptapEditor.commands.setTextSelection(blockContent.beforePos + 4)
        } else {
            editor._tiptapEditor.commands.setTextSelection(blockContent.afterPos - 4)
        }
    } else {
        throw new UnreachableCaseError(contentType)
    }
}