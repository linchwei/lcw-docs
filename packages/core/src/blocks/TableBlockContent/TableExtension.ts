/**
 * 表格扩展模块
 * 为表格块提供列宽调整、表格编辑和键盘快捷键支持
 */
import { callOrReturn, Extension, getExtensionField } from '@tiptap/core'
import { columnResizing, tableEditing } from 'prosemirror-tables'

/**
 * 列宽调整的最小宽度阈值
 */
export const RESIZE_MIN_WIDTH = 35
/**
 * 空单元格的默认宽度
 */
export const EMPTY_CELL_WIDTH = 120
/**
 * 空单元格的默认高度
 */
export const EMPTY_CELL_HEIGHT = 31

/**
 * 表格扩展
 * 提供表格编辑的核心功能
 */
export const TableExtension = Extension.create({
    name: 'LcwDocTableExtension',

    /**
     * 添加 ProseMirror 插件
     * 集成列宽调整和表格编辑功能
     */
    addProseMirrorPlugins: () => {
        return [
            columnResizing({
                cellMinWidth: RESIZE_MIN_WIDTH,
                defaultCellMinWidth: EMPTY_CELL_WIDTH,
                View: null,
            }),
            tableEditing(),
        ]
    },

    /**
     * 键盘快捷键定义
     * Enter: 在表格段落中设置硬换行
     * Backspace: 在表格段落的起始位置删除
     */
    addKeyboardShortcuts() {
        return {
            Enter: () => {
                if (this.editor.state.selection.empty && this.editor.state.selection.$head.parent.type.name === 'tableParagraph') {
                    this.editor.commands.setHardBreak()

                    return true
                }

                return false
            },
            Backspace: () => {
                const selection = this.editor.state.selection
                const selectionIsEmpty = selection.empty
                const selectionIsAtStartOfNode = selection.$head.parentOffset === 0
                const selectionIsInTableParagraphNode = selection.$head.node().type.name === 'tableParagraph'

                return selectionIsEmpty && selectionIsAtStartOfNode && selectionIsInTableParagraphNode
            },
        }
    },

    /**
     * 扩展节点模式
     * 为节点添加 tableRole 字段
     */
    extendNodeSchema(extension) {
        const context = {
            name: extension.name,
            options: extension.options,
            storage: extension.storage,
        }

        return {
            tableRole: callOrReturn(getExtensionField(extension, 'tableRole', context)),
        }
    },
})
