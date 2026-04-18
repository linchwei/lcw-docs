/**
 * 列表项键盘快捷键模块
 * 处理列表项块（无序列表、有序列表、任务列表）的 Enter 键行为
 */
import { splitBlockCommand } from '../../api/blockManipulation/commands/splitBlock/splitBlock'
import { updateBlockCommand } from '../../api/blockManipulation/commands/updateBlock/updateBlock'
import { getBlockInfoFromSelection } from '../../api/getBlockInfoFromPos'
import { LcwDocEditor } from '../../editor/LcwDocEditor'

/**
 * 处理列表项中的 Enter 键按下事件
 * 当列表项为空时转换为段落
 * 当列表项有内容时拆分为新的列表项
 */
export const handleEnter = (editor: LcwDocEditor<any, any, any>) => {
    const ttEditor = editor._tiptapEditor
    const { blockContent, blockContainer } = getBlockInfoFromSelection(ttEditor.state)

    const selectionEmpty = ttEditor.state.selection.anchor === ttEditor.state.selection.head

    if (
        !(
            blockContent.node.type.name === 'bulletListItem' ||
            blockContent.node.type.name === 'numberedListItem' ||
            blockContent.node.type.name === 'checkListItem'
        ) ||
        !selectionEmpty
    ) {
        return false
    }

    return ttEditor.commands.first(({ state, chain, commands }) => [
        () =>
            commands.command(() => {
                if (blockContent.node.childCount === 0) {
                    return commands.command(
                        updateBlockCommand(editor, blockContainer.beforePos, {
                            type: 'paragraph',
                            props: {},
                        })
                    )
                }

                return false
            }),

        () =>
            commands.command(() => {
                if (blockContent.node.childCount > 0) {
                    chain().deleteSelection().command(splitBlockCommand(state.selection.from, true)).run()

                    return true
                }

                return false
            }),
    ])
}
