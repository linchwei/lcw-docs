/**
 * 更新块
 *
 * 该文件提供更新编辑器中现有块的功能。
 * 可以更新块的内容、类型、属性和子块。
 */
import { Fragment, Node as PMNode, Slice } from 'prosemirror-model'
import { EditorState } from 'prosemirror-state'

import { Block, PartialBlock } from '../../../../blocks/defaultBlocks'
import { LcwDocEditor } from '../../../../editor/LcwDocEditor'
import { BlockIdentifier, BlockSchema } from '../../../../schema/blocks/types'
import { InlineContentSchema } from '../../../../schema/inlineContent/types'
import { StyleSchema } from '../../../../schema/styles/types'
import { UnreachableCaseError } from '../../../../util/typescript'
import { getBlockInfoFromResolvedPos } from '../../../getBlockInfoFromPos'
import { blockToNode, inlineContentToNodes, tableContentToNodes } from '../../../nodeConversions/blockToNode'
import { nodeToBlock } from '../../../nodeConversions/nodeToBlock'
import { getNodeById } from '../../../nodeUtil'

/**
 * 更新块的命令实现
 *
 * 内部使用的命令函数，用于在指定位置更新块。
 * 支持更新块的内容、类型和属性。
 *
 * @param editor - 编辑器实例
 * @param posBeforeBlock - 块前面的位置
 * @param block - 要更新的块数据（PartialBlock）
 * @returns 返回一个命令函数，接受 EditorState 和 dispatch
 */
export const updateBlockCommand =
    <BSchema extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema>(
        editor: LcwDocEditor<BSchema, I, S>,
        posBeforeBlock: number,
        block: PartialBlock<BSchema, I, S>
    ) =>
    ({ state, dispatch }: { state: EditorState; dispatch: ((args?: any) => any) | undefined }) => {
        const { blockContainer, blockContent, blockGroup } = getBlockInfoFromResolvedPos(state.doc.resolve(posBeforeBlock))

        if (dispatch) {
            if (block.children !== undefined) {
                const childNodes = []

                for (const child of block.children) {
                    childNodes.push(blockToNode(child, state.schema, editor.schema.styleSchema))
                }

                if (blockGroup) {
                    state.tr.replace(blockGroup.beforePos + 1, blockGroup.afterPos - 1, new Slice(Fragment.from(childNodes), 0, 0))
                } else {
                    state.tr.insert(blockContent.afterPos, state.schema.nodes['blockGroup'].create({}, childNodes))
                }
            }

            const oldType = blockContent.node.type.name
            const newType = block.type || oldType

            let content: PMNode[] | 'keep' = 'keep'

            if (block.content) {
                if (typeof block.content === 'string') {
                    content = inlineContentToNodes([block.content], state.schema, editor.schema.styleSchema)
                } else if (Array.isArray(block.content)) {
                    content = inlineContentToNodes(block.content, state.schema, editor.schema.styleSchema)
                } else if (block.content.type === 'tableContent') {
                    content = tableContentToNodes(block.content, state.schema, editor.schema.styleSchema)
                } else {
                    throw new UnreachableCaseError(block.content.type)
                }
            } else {
                const oldContentType = state.schema.nodes[oldType].spec.content
                const newContentType = state.schema.nodes[newType].spec.content

                if (oldContentType === '') {
                } else if (newContentType !== oldContentType) {
                    content = []
                }
            }

            if (content === 'keep') {
                state.tr.setNodeMarkup(blockContent.beforePos, block.type === undefined ? undefined : state.schema.nodes[block.type], {
                    ...blockContent.node.attrs,
                    ...block.props,
                })
            } else {
                state.tr.replaceWith(
                    blockContent.beforePos,
                    blockContent.afterPos,
                    state.schema.nodes[newType].create(
                        {
                            ...blockContent.node.attrs,
                            ...block.props,
                        },
                        content
                    )
                )
            }

            state.tr.setNodeMarkup(blockContainer.beforePos, undefined, {
                ...blockContainer.node.attrs,
                ...block.props,
            })
        }

        return true
    }

/**
 * 更新指定块
 *
 * 根据块标识符更新编辑器中的块，可以更新内容、类型、属性等。
 *
 * @param editor - 编辑器实例
 * @param blockToUpdate - 要更新的块的标识符
 * @param update - 块的更新数据（PartialBlock）
 * @returns 返回更新后的块
 */
export function updateBlock<BSchema extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema>(
    editor: LcwDocEditor<BSchema, I, S>,
    blockToUpdate: BlockIdentifier,
    update: PartialBlock<BSchema, I, S>
): Block<BSchema, I, S> {
    const ttEditor = editor._tiptapEditor

    const id = typeof blockToUpdate === 'string' ? blockToUpdate : blockToUpdate.id
    const { posBeforeNode } = getNodeById(id, ttEditor.state.doc)

    ttEditor.commands.command(({ state, dispatch }) => {
        updateBlockCommand(editor, posBeforeNode, update)({ state, dispatch })
        return true
    })

    const blockContainerNode = ttEditor.state.doc.resolve(posBeforeNode + 1).node()

    return nodeToBlock(
        blockContainerNode,
        editor.schema.blockSchema,
        editor.schema.inlineContentSchema,
        editor.schema.styleSchema,
        editor.blockCache
    )
}