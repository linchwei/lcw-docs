/**
 * 键盘快捷键扩展
 *
 * 该扩展定义了编辑器的主要键盘快捷键行为。
 * 包括退格键、删除键、回车键、Tab键等的功能实现。
 */

import { Extension } from '@tiptap/core'
import { TextSelection } from 'prosemirror-state'

import { getPrevBlockPos, mergeBlocksCommand } from '../../api/blockManipulation/commands/mergeBlocks/mergeBlocks'
import { splitBlockCommand } from '../../api/blockManipulation/commands/splitBlock/splitBlock'
import { updateBlockCommand } from '../../api/blockManipulation/commands/updateBlock/updateBlock'
import { getBlockInfoFromResolvedPos, getBlockInfoFromSelection } from '../../api/getBlockInfoFromPos'
import { LcwDocEditor } from '../../editor/LcwDocEditor'

/**
 * 键盘快捷键扩展
 *
 * 该扩展通过 addKeyboardShortcuts 方法注册各种键盘快捷键处理函数，
 * 实现编辑器的核心编辑功能，如删除、合并块、分割块等操作。
 */
export const KeyboardShortcutsExtension = Extension.create<{
    editor: LcwDocEditor<any, any, any>
}>({
    priority: 50,
    addKeyboardShortcuts() {
        /**
         * 处理退格键（Backspace）
         *
         * 退格键的处理按优先级依次尝试：
         * 1. 删除选区内容
         * 2. 撤销输入规则
         * 3. 如果在块开头且当前不是段落，则转换为段落
         * 4. 如果在块开头且是列表项，则取消缩进
         * 5. 如果在块开头且可以合并，则合并两个块
         * 6. 如果前一个块为空且可以删除，则删除前一个块
         */
        const handleBackspace = () =>
            this.editor.commands.first(({ chain, commands }) => [
                () => commands.deleteSelection(),
                () => commands.undoInputRule(),
                () =>
                    commands.command(({ state }) => {
                        const blockInfo = getBlockInfoFromSelection(state)

                        const selectionAtBlockStart = state.selection.from === blockInfo.blockContent.beforePos + 1
                        const isParagraph = blockInfo.blockContent.node.type.name === 'paragraph'

                        if (selectionAtBlockStart && !isParagraph) {
                            return commands.command(
                                updateBlockCommand(this.options.editor, blockInfo.blockContainer.beforePos, {
                                    type: 'paragraph',
                                    props: {},
                                })
                            )
                        }

                        return false
                    }),
                () =>
                    commands.command(({ state }) => {
                        const { blockContent } = getBlockInfoFromSelection(state)

                        const selectionAtBlockStart = state.selection.from === blockContent.beforePos + 1

                        if (selectionAtBlockStart) {
                            return commands.liftListItem('blockContainer')
                        }

                        return false
                    }),
                () =>
                    commands.command(({ state }) => {
                        const { blockContainer, blockContent } = getBlockInfoFromSelection(state)

                        const { depth } = state.doc.resolve(blockContainer.beforePos)

                        const selectionAtBlockStart = state.selection.from === blockContent.beforePos + 1
                        const selectionEmpty = state.selection.empty
                        const blockAtDocStart = blockContainer.beforePos === 1

                        const posBetweenBlocks = blockContainer.beforePos

                        if (!blockAtDocStart && selectionAtBlockStart && selectionEmpty && depth === 1) {
                            return chain().command(mergeBlocksCommand(posBetweenBlocks)).scrollIntoView().run()
                        }

                        return false
                    }),
                () =>
                    commands.command(({ state }) => {
                        const blockInfo = getBlockInfoFromSelection(state)

                        const { depth } = state.doc.resolve(blockInfo.blockContainer.beforePos)

                        const selectionAtBlockStart = state.selection.from === blockInfo.blockContent.beforePos + 1
                        const selectionEmpty = state.selection.empty
                        const blockAtDocStart = blockInfo.blockContainer.beforePos === 1

                        if (!blockAtDocStart && selectionAtBlockStart && selectionEmpty && depth === 1) {
                            const prevBlockPos = getPrevBlockPos(state.doc, state.doc.resolve(blockInfo.blockContainer.beforePos))
                            const prevBlockInfo = getBlockInfoFromResolvedPos(state.doc.resolve(prevBlockPos.pos))

                            const prevBlockNotTableAndNoContent =
                                prevBlockInfo.blockContent.node.type.spec.content === '' ||
                                (prevBlockInfo.blockContent.node.type.spec.content === 'inline*' &&
                                    prevBlockInfo.blockContent.node.childCount === 0)

                            if (prevBlockNotTableAndNoContent) {
                                return chain()
                                    .cut(
                                        {
                                            from: blockInfo.blockContainer.beforePos,
                                            to: blockInfo.blockContainer.afterPos,
                                        },
                                        prevBlockInfo.blockContainer.afterPos
                                    )
                                    .deleteRange({
                                        from: prevBlockInfo.blockContainer.beforePos,
                                        to: prevBlockInfo.blockContainer.afterPos,
                                    })
                                    .run()
                            }
                        }

                        return false
                    }),
            ])

        /**
         * 处理删除键（Delete）
         *
         * 删除键的处理按优先级依次尝试：
         * 1. 删除选区内容
         * 2. 如果在块末尾且可以合并，则与下一个块合并
         */
        const handleDelete = () =>
            this.editor.commands.first(({ commands }) => [
                () => commands.deleteSelection(),
                () =>
                    commands.command(({ state }) => {
                        const { blockContainer, blockContent, blockGroup } = getBlockInfoFromSelection(state)

                        const { depth } = state.doc.resolve(blockContainer.beforePos)
                        const blockAtDocEnd = blockContainer.afterPos === state.doc.nodeSize - 3
                        const selectionAtBlockEnd = state.selection.from === blockContent.afterPos - 1
                        const selectionEmpty = state.selection.empty
                        const hasChildBlocks = blockGroup !== undefined

                        if (!blockAtDocEnd && selectionAtBlockEnd && selectionEmpty && !hasChildBlocks) {
                            let oldDepth = depth
                            let newPos = blockContainer.afterPos + 1
                            let newDepth = state.doc.resolve(newPos).depth

                            while (newDepth < oldDepth) {
                                oldDepth = newDepth
                                newPos += 2
                                newDepth = state.doc.resolve(newPos).depth
                            }

                            return commands.command(mergeBlocksCommand(newPos - 1))
                        }

                        return false
                    }),
            ])

        /**
         * 处理回车键（Enter）
         *
         * 回车键的处理按优先级依次尝试：
         * 1. 如果在列表项开头且为空，则取消缩进
         * 2. 如果在块开头且为空，则在当前块后插入新块
         * 3. 否则执行分割块命令
         */
        const handleEnter = () =>
            this.editor.commands.first(({ commands }) => [
                () =>
                    commands.command(({ state }) => {
                        const { blockContent, blockContainer } = getBlockInfoFromSelection(state)

                        const { depth } = state.doc.resolve(blockContainer.beforePos)

                        const selectionAtBlockStart = state.selection.$anchor.parentOffset === 0
                        const selectionEmpty = state.selection.anchor === state.selection.head
                        const blockEmpty = blockContent.node.childCount === 0
                        const blockIndented = depth > 1

                        if (selectionAtBlockStart && selectionEmpty && blockEmpty && blockIndented) {
                            return commands.liftListItem('blockContainer')
                        }

                        return false
                    }),
                () =>
                    commands.command(({ state, dispatch }) => {
                        const { blockContainer, blockContent } = getBlockInfoFromSelection(state)

                        const selectionAtBlockStart = state.selection.$anchor.parentOffset === 0
                        const selectionEmpty = state.selection.anchor === state.selection.head
                        const blockEmpty = blockContent.node.childCount === 0

                        if (selectionAtBlockStart && selectionEmpty && blockEmpty) {
                            const newBlockInsertionPos = blockContainer.afterPos
                            const newBlockContentPos = newBlockInsertionPos + 2

                            if (dispatch) {
                                const newBlock = state.schema.nodes['blockContainer'].createAndFill()!

                                state.tr.insert(newBlockInsertionPos, newBlock).scrollIntoView()
                                state.tr.setSelection(new TextSelection(state.doc.resolve(newBlockContentPos)))
                            }

                            return true
                        }

                        return false
                    }),
                () =>
                    commands.command(({ state, chain }) => {
                        const { blockContent } = getBlockInfoFromSelection(state)

                        const selectionAtBlockStart = state.selection.$anchor.parentOffset === 0
                        const blockEmpty = blockContent.node.childCount === 0

                        if (!blockEmpty) {
                            chain()
                                .deleteSelection()
                                .command(splitBlockCommand(state.selection.from, selectionAtBlockStart, selectionAtBlockStart))
                                .run()

                            return true
                        }

                        return false
                    }),
            ])

        return {
            Backspace: handleBackspace,
            Delete: handleDelete,
            Enter: handleEnter,
            /**
             * Tab键：缩进列表项
             * 如果格式化工具栏、链接工具栏或文件面板显示，则不处理
             */
            Tab: () => {
                if (
                    this.options.editor.formattingToolbar?.shown ||
                    this.options.editor.linkToolbar?.shown ||
                    this.options.editor.filePanel?.shown
                ) {
                    return false
                }
                this.editor.commands.sinkListItem('blockContainer')
                return true
            },
            /**
             * Shift+Tab：取消缩进列表项
             * 如果格式化工具栏、链接工具栏或文件面板显示，则不处理
             */
            'Shift-Tab': () => {
                if (
                    this.options.editor.formattingToolbar?.shown ||
                    this.options.editor.linkToolbar?.shown ||
                    this.options.editor.filePanel?.shown
                ) {
                    return false
                }
                this.editor.commands.liftListItem('blockContainer')
                return true
            },
            /**
             * Shift+Ctrl+ArrowUp：向上移动块
             */
            'Shift-Mod-ArrowUp': () => {
                this.options.editor.moveBlockUp()
                return true
            },
            /**
             * Shift+Ctrl+ArrowDown：向下移动块
             */
            'Shift-Mod-ArrowDown': () => {
                this.options.editor.moveBlockDown()
                return true
            },
        }
    },
})
