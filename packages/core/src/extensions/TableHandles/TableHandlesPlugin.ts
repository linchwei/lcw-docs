/**
 * 表格处理插件
 *
 * 该插件提供表格的行和列拖拽排序功能。
 * 用户可以通过拖拽表格的边框来重新排列行或列的顺序。
 */

import { Plugin, PluginKey, PluginView } from 'prosemirror-state'
import { Decoration, DecorationSet, EditorView } from 'prosemirror-view'

import { nodeToBlock } from '../../api/nodeConversions/nodeToBlock'
import { getNodeById } from '../../api/nodeUtil'
import { DefaultBlockSchema } from '../../blocks/defaultBlocks'
import { checkBlockIsDefaultType } from '../../blocks/defaultBlockTypeGuards'
import type { LcwDocEditor } from '../../editor/LcwDocEditor'
import { BlockFromConfigNoChildren, BlockSchemaWithBlock, InlineContentSchema, StyleSchema } from '../../schema/index'
import { EventEmitter } from '../../util/EventEmitter'
import { getDraggableBlockFromElement } from '../SideMenu/dragging'

let dragImageElement: HTMLElement | undefined

/**
 * 表格处理状态
 *
 * 描述当前表格处理UI的显示状态和位置信息
 */
export type TableHandlesState<I extends InlineContentSchema, S extends StyleSchema> = {
    show: boolean
    showAddOrRemoveRowsButton: boolean
    showAddOrRemoveColumnsButton: boolean
    referencePosCell: DOMRect | undefined
    referencePosTable: DOMRect

    block: BlockFromConfigNoChildren<DefaultBlockSchema['table'], I, S>
    colIndex: number | undefined
    rowIndex: number | undefined

    draggingState:
        | {
              draggedCellOrientation: 'row' | 'col'
              originalIndex: number
              mousePos: number
          }
        | undefined

    widgetContainer: HTMLElement | undefined
}

/**
 * 创建隐藏的拖拽图像元素
 *
 * 用于在拖拽操作时设置一个不可见的拖拽图像，
 * 避免使用默认的拖拽图像影响用户体验。
 *
 * @param rootEl - 文档或ShadowRoot根节点
 */
function setHiddenDragImage(rootEl: Document | ShadowRoot) {
    if (dragImageElement) {
        return
    }

    dragImageElement = document.createElement('div')
    dragImageElement.innerHTML = '_'
    dragImageElement.style.opacity = '0'
    dragImageElement.style.height = '1px'
    dragImageElement.style.width = '1px'
    if (rootEl instanceof Document) {
        rootEl.body.appendChild(dragImageElement)
    } else {
        rootEl.appendChild(dragImageElement)
    }
}

/**
 * 移除隐藏的拖拽图像元素
 *
 * @param rootEl - 文档或ShadowRoot根节点
 */
function unsetHiddenDragImage(rootEl: Document | ShadowRoot) {
    if (dragImageElement) {
        if (rootEl instanceof Document) {
            rootEl.body.removeChild(dragImageElement)
        } else {
            rootEl.removeChild(dragImageElement)
        }
        dragImageElement = undefined
    }
}

/**
 * 获取子元素的索引
 *
 * @param node - DOM元素
 * @returns 该元素在其父元素中的索引位置
 */
function getChildIndex(node: Element) {
    return Array.prototype.indexOf.call(node.parentElement!.childNodes, node)
}

/**
 * 获取鼠标所在位置的表格单元格信息
 *
 * 从鼠标目标元素向上遍历DOM树，找到最近的TD或TH元素，
 * 或者找到包含表格的.tableWrapper元素。
 *
 * @param target - 鼠标事件的目标元素
 * @returns 单元格信息，包含类型、DOM节点和tbody节点
 */
function domCellAround(target: Element) {
    let currentTarget: Element | undefined = target
    while (
        currentTarget &&
        currentTarget.nodeName !== 'TD' &&
        currentTarget.nodeName !== 'TH' &&
        !currentTarget.classList.contains('tableWrapper')
    ) {
        if (currentTarget.classList.contains('ProseMirror')) {
            return undefined
        }
        const parent: ParentNode | null = currentTarget.parentNode

        if (!parent || !(parent instanceof Element)) {
            return undefined
        }
        currentTarget = parent
    }

    return currentTarget.nodeName === 'TD' || currentTarget.nodeName === 'TH'
        ? {
              type: 'cell',
              domNode: currentTarget,
              tbodyNode: currentTarget.closest('tbody'),
          }
        : {
              type: 'wrapper',
              domNode: currentTarget,
              tbodyNode: currentTarget.querySelector('tbody'),
          }
}

/**
 * 隐藏指定选择器的所有元素
 *
 * @param selector - CSS选择器
 * @param rootEl - 文档或ShadowRoot根节点
 */
function hideElements(selector: string, rootEl: Document | ShadowRoot) {
    const elementsToHide = rootEl.querySelectorAll(selector)

    for (let i = 0; i < elementsToHide.length; i++) {
        ;(elementsToHide[i] as HTMLElement).style.visibility = 'hidden'
    }
}

/**
 * 表格处理视图类
 *
 * 负责处理表格UI的显示和用户交互，包括：
 * - 鼠标移动时更新处理器的位置
 * - 处理行列拖拽的逻辑
 * - 管理拖拽状态的更新
 */
export class TableHandlesView<I extends InlineContentSchema, S extends StyleSchema> implements PluginView {
    public state?: TableHandlesState<I, S>
    public emitUpdate: () => void

    public tableId: string | undefined
    public tablePos: number | undefined
    public tableElement: HTMLElement | undefined

    public menuFrozen = false

    public mouseState: 'up' | 'down' | 'selecting' = 'up'

    public prevWasEditable: boolean | null = null

    constructor(
        private readonly editor: LcwDocEditor<BlockSchemaWithBlock<'table', DefaultBlockSchema['table']>, I, S>,
        private readonly pmView: EditorView,
        emitUpdate: (state: TableHandlesState<I, S>) => void
    ) {
        this.emitUpdate = () => {
            if (!this.state) {
                throw new Error('Attempting to update uninitialized image toolbar')
            }

            emitUpdate(this.state)
        }

        pmView.dom.addEventListener('mousemove', this.mouseMoveHandler)
        pmView.dom.addEventListener('mousedown', this.viewMousedownHandler)
        window.addEventListener('mouseup', this.mouseUpHandler)

        pmView.root.addEventListener('dragover', this.dragOverHandler as EventListener)
        pmView.root.addEventListener('drop', this.dropHandler as EventListener)
    }

    /**
     * 处理鼠标按下事件
     * 将鼠标状态设置为 'down'
     */
    viewMousedownHandler = () => {
        this.mouseState = 'down'
    }

    /**
     * 处理鼠标释放事件
     * 将鼠标状态设置为 'up' 并触发移动处理
     */
    mouseUpHandler = (event: MouseEvent) => {
        this.mouseState = 'up'
        this.mouseMoveHandler(event)
    }

    /**
     * 处理鼠标移动事件
     *
     * 主要功能：
     * - 检测鼠标是否在表格单元格上
     * - 更新处理器的显示状态和位置
     * - 显示或隐藏行列添加/删除按钮
     */
    mouseMoveHandler = (event: MouseEvent) => {
        if (this.menuFrozen) {
            return
        }

        if (this.mouseState === 'selecting') {
            return
        }

        if (!(event.target instanceof Element) || !this.pmView.dom.contains(event.target)) {
            return
        }

        const target = domCellAround(event.target)

        if (target?.type === 'cell' && this.mouseState === 'down' && !this.state?.draggingState) {
            this.mouseState = 'selecting'

            if (this.state?.show) {
                this.state.show = false
                this.state.showAddOrRemoveRowsButton = false
                this.state.showAddOrRemoveColumnsButton = false
                this.emitUpdate()
            }
            return
        }

        if (!target || !this.editor.isEditable) {
            if (this.state?.show) {
                this.state.show = false
                this.state.showAddOrRemoveRowsButton = false
                this.state.showAddOrRemoveColumnsButton = false
                this.emitUpdate()
            }
            return
        }

        if (!target.tbodyNode) {
            return
        }

        const tableRect = target.tbodyNode.getBoundingClientRect()

        const blockEl = getDraggableBlockFromElement(target.domNode, this.pmView)
        if (!blockEl) {
            return
        }
        this.tableElement = blockEl.node

        let tableBlock: BlockFromConfigNoChildren<DefaultBlockSchema['table'], I, S> | undefined

        const pmNodeInfo = getNodeById(blockEl.id, this.editor._tiptapEditor.state.doc)

        const block = nodeToBlock(
            pmNodeInfo.node,
            this.editor.schema.blockSchema,
            this.editor.schema.inlineContentSchema,
            this.editor.schema.styleSchema,
            this.editor.blockCache
        )

        if (checkBlockIsDefaultType('table', block, this.editor)) {
            this.tablePos = pmNodeInfo.posBeforeNode + 1
            tableBlock = block
        }

        if (!tableBlock) {
            return
        }

        this.tableId = blockEl.id
        const widgetContainer = target.domNode.closest('.tableWrapper')?.querySelector('.table-widgets-container') as HTMLElement

        if (target?.type === 'wrapper') {
            const belowTable = event.clientY >= tableRect.bottom - 1 && event.clientY < tableRect.bottom + 20
            const toRightOfTable = event.clientX >= tableRect.right - 1 && event.clientX < tableRect.right + 20
            const hideHandles = event.clientX > tableRect.right || event.clientY > tableRect.bottom

            this.state = {
                ...this.state!,
                show: true,
                showAddOrRemoveRowsButton: belowTable,
                showAddOrRemoveColumnsButton: toRightOfTable,
                referencePosTable: tableRect,
                block: tableBlock,
                widgetContainer,
                colIndex: hideHandles ? undefined : this.state!.colIndex,
                rowIndex: hideHandles ? undefined : this.state!.rowIndex,
                referencePosCell: hideHandles ? undefined : this.state!.referencePosCell,
            }
        } else {
            const colIndex = getChildIndex(target.domNode)
            const rowIndex = getChildIndex(target.domNode.parentElement!)
            const cellRect = target.domNode.getBoundingClientRect()

            if (
                this.state !== undefined &&
                this.state.show &&
                this.tableId === blockEl.id &&
                this.state.rowIndex === rowIndex &&
                this.state.colIndex === colIndex
            ) {
                return
            }

            this.state = {
                show: true,
                showAddOrRemoveColumnsButton: colIndex === tableBlock.content.rows[0].cells.length - 1,
                showAddOrRemoveRowsButton: rowIndex === tableBlock.content.rows.length - 1,
                referencePosTable: tableRect,

                block: tableBlock,
                draggingState: undefined,
                referencePosCell: cellRect,
                colIndex: colIndex,
                rowIndex: rowIndex,

                widgetContainer,
            }
        }
        this.emitUpdate()

        return false
    }

    /**
     * 处理拖拽悬停事件
     *
     * 计算鼠标在表格中的位置，更新当前悬停的行列索引，
     * 并在需要时更新UI状态。
     */
    dragOverHandler = (event: DragEvent) => {
        if (this.state?.draggingState === undefined) {
            return
        }

        event.preventDefault()
        event.dataTransfer!.dropEffect = 'move'

        hideElements('.prosemirror-dropcursor-block, .prosemirror-dropcursor-inline', this.pmView.root)

        const boundedMouseCoords = {
            left: Math.min(Math.max(event.clientX, this.state.referencePosTable.left + 1), this.state.referencePosTable.right - 1),
            top: Math.min(Math.max(event.clientY, this.state.referencePosTable.top + 1), this.state.referencePosTable.bottom - 1),
        }

        const tableCellElements = this.pmView.root
            .elementsFromPoint(boundedMouseCoords.left, boundedMouseCoords.top)
            .filter(element => element.tagName === 'TD' || element.tagName === 'TH')
        if (tableCellElements.length === 0) {
            throw new Error('Could not find table cell element that the mouse cursor is hovering over.')
        }
        const tableCellElement = tableCellElements[0]

        let emitStateUpdate = false

        const rowIndex = getChildIndex(tableCellElement.parentElement!)
        const colIndex = getChildIndex(tableCellElement)
        const oldIndex = this.state.draggingState.draggedCellOrientation === 'row' ? this.state.rowIndex : this.state.colIndex
        const newIndex = this.state.draggingState.draggedCellOrientation === 'row' ? rowIndex : colIndex
        const dispatchDecorationsTransaction = newIndex !== oldIndex

        if (this.state.rowIndex !== rowIndex || this.state.colIndex !== colIndex) {
            this.state.rowIndex = rowIndex
            this.state.colIndex = colIndex

            this.state.referencePosCell = tableCellElement.getBoundingClientRect()

            emitStateUpdate = true
        }

        const mousePos = this.state.draggingState.draggedCellOrientation === 'row' ? boundedMouseCoords.top : boundedMouseCoords.left
        if (this.state.draggingState.mousePos !== mousePos) {
            this.state.draggingState.mousePos = mousePos

            emitStateUpdate = true
        }

        if (emitStateUpdate) {
            this.emitUpdate()
        }

        if (dispatchDecorationsTransaction) {
            this.editor.dispatch(this.pmView.state.tr.setMeta(tableHandlesPluginKey, true))
        }
    }

    /**
     * 处理拖拽释放事件
     *
     * 执行实际的行或列移动操作：
     * - 如果是行拖拽，splice移动该行
     * - 如果是列拖拽，移动所有行中对应列的单元格
     * - 更新编辑器中的表格块
     */
    dropHandler = (event: DragEvent) => {
        this.mouseState = 'up'
        if (this.state === undefined || this.state.draggingState === undefined) {
            return
        }

        if (this.state.rowIndex === undefined || this.state.colIndex === undefined) {
            throw new Error('Attempted to drop table row or column, but no table block was hovered prior.')
        }

        event.preventDefault()

        const { draggingState, colIndex, rowIndex } = this.state

        const rows = this.state.block.content.rows

        if (draggingState.draggedCellOrientation === 'row') {
            const rowToMove = rows[draggingState.originalIndex]
            rows.splice(draggingState.originalIndex, 1)
            rows.splice(rowIndex, 0, rowToMove)
        } else {
            const cellsToMove = rows.map(row => row.cells[draggingState.originalIndex])
            rows.forEach((row, rowIndex) => {
                row.cells.splice(draggingState.originalIndex, 1)
                row.cells.splice(colIndex, 0, cellsToMove[rowIndex])
            })
        }

        this.editor.updateBlock(this.state.block, {
            type: 'table',
            content: {
                type: 'tableContent',
                rows: rows,
            },
        })

        this.editor.setTextCursorPosition(this.state.block.id)
    }

    /**
     * 更新视图状态
     *
     * 确保表格边界和行列索引有效，
     * 并更新块的引用以反映最新状态。
     */
    update() {
        if (!this.state || !this.state.show) {
            return
        }

        const tableBody = this.tableElement!.querySelector('tbody')
        if (!tableBody) {
            return
        }

        if (this.state.rowIndex !== undefined && this.state.colIndex !== undefined) {
            if (this.state.rowIndex >= tableBody.children.length) {
                this.state.rowIndex = tableBody.children.length - 1
            }
            if (this.state.colIndex >= tableBody.children[0].children.length) {
                this.state.colIndex = tableBody.children[0].children.length - 1
            }

            const row = tableBody.children[this.state.rowIndex]
            const cell = row.children[this.state.colIndex]
            this.state.referencePosCell = cell.getBoundingClientRect()
        }

        this.state.block = this.editor.getBlock(this.state.block.id)!
        this.state.referencePosTable = tableBody.getBoundingClientRect()
        this.emitUpdate()
    }

    /**
     * 销毁视图
     *
     * 移除所有事件监听器，清理资源
     */
    destroy() {
        this.pmView.dom.removeEventListener('mousemove', this.mouseMoveHandler)
        window.removeEventListener('mouseup', this.mouseUpHandler)
        this.pmView.dom.removeEventListener('mousedown', this.viewMousedownHandler)
        this.pmView.root.removeEventListener('dragover', this.dragOverHandler as EventListener)
        this.pmView.root.removeEventListener('drop', this.dropHandler as EventListener)
    }
}

export const tableHandlesPluginKey = new PluginKey('TableHandlesPlugin')

/**
 * 表格处理的ProseMirror插件
 *
 * 包装TableHandlesView，提供事件发射机制，
 * 并处理表格拖拽时的装饰器（drop cursor）渲染。
 */
export class TableHandlesProsemirrorPlugin<I extends InlineContentSchema, S extends StyleSchema> extends EventEmitter<any> {
    private view: TableHandlesView<I, S> | undefined
    public readonly plugin: Plugin

    constructor(private readonly editor: LcwDocEditor<BlockSchemaWithBlock<'table', DefaultBlockSchema['table']>, I, S>) {
        super()
        this.plugin = new Plugin({
            key: tableHandlesPluginKey,
            view: editorView => {
                this.view = new TableHandlesView(editor, editorView, state => {
                    this.emit('update', state)
                })
                return this.view
            },
            props: {
                decorations: state => {
                    if (
                        this.view === undefined ||
                        this.view.state === undefined ||
                        this.view.state.draggingState === undefined ||
                        this.view.tablePos === undefined
                    ) {
                        return
                    }

                    const newIndex =
                        this.view.state.draggingState.draggedCellOrientation === 'row' ? this.view.state.rowIndex : this.view.state.colIndex

                    if (newIndex === undefined) {
                        return
                    }

                    const decorations: Decoration[] = []

                    if (newIndex === this.view.state.draggingState.originalIndex) {
                        return DecorationSet.create(state.doc, decorations)
                    }

                    const tableResolvedPos = state.doc.resolve(this.view.tablePos + 1)
                    const tableNode = tableResolvedPos.node()

                    if (this.view.state.draggingState.draggedCellOrientation === 'row') {
                        const rowResolvedPos = state.doc.resolve(tableResolvedPos.posAtIndex(newIndex) + 1)
                        const rowNode = rowResolvedPos.node()

                        for (let i = 0; i < rowNode.childCount; i++) {
                            const cellResolvedPos = state.doc.resolve(rowResolvedPos.posAtIndex(i) + 1)
                            const cellNode = cellResolvedPos.node()
                            const decorationPos =
                                cellResolvedPos.pos + (newIndex > this.view.state.draggingState.originalIndex ? cellNode.nodeSize - 2 : 0)
                            decorations.push(
                                Decoration.widget(decorationPos, () => {
                                    const widget = document.createElement('div')
                                    widget.className = 'bn-table-drop-cursor'
                                    widget.style.left = '0'
                                    widget.style.right = '0'

                                    if (newIndex > this.view!.state!.draggingState!.originalIndex) {
                                        widget.style.bottom = '-2px'
                                    } else {
                                        widget.style.top = '-3px'
                                    }
                                    widget.style.height = '4px'

                                    return widget
                                })
                            )
                        }
                    } else {
                        for (let i = 0; i < tableNode.childCount; i++) {
                            const rowResolvedPos = state.doc.resolve(tableResolvedPos.posAtIndex(i) + 1)
                            const cellResolvedPos = state.doc.resolve(rowResolvedPos.posAtIndex(newIndex) + 1)
                            const cellNode = cellResolvedPos.node()
                            const decorationPos =
                                cellResolvedPos.pos + (newIndex > this.view.state.draggingState.originalIndex ? cellNode.nodeSize - 2 : 0)

                            decorations.push(
                                Decoration.widget(decorationPos, () => {
                                    const widget = document.createElement('div')
                                    widget.className = 'bn-table-drop-cursor'
                                    widget.style.top = '0'
                                    widget.style.bottom = '0'
                                    if (newIndex > this.view!.state!.draggingState!.originalIndex) {
                                        widget.style.right = '-2px'
                                    } else {
                                        widget.style.left = '-3px'
                                    }
                                    widget.style.width = '4px'

                                    return widget
                                })
                            )
                        }
                    }

                    return DecorationSet.create(state.doc, decorations)
                },
            },
        })
    }

    /**
     * 订阅状态更新事件
     *
     * @param callback - 状态更新时的回调函数
     * @returns 事件取消订阅函数
     */
    public onUpdate(callback: (state: TableHandlesState<I, S>) => void) {
        return this.on('update', callback)
    }

    /**
     * 开始列拖拽
     *
     * 设置拖拽状态为列模式，初始化相关数据
     */
    colDragStart = (event: { dataTransfer: DataTransfer | null; clientX: number }) => {
        if (this.view!.state === undefined || this.view!.state.colIndex === undefined) {
            throw new Error('Attempted to drag table column, but no table block was hovered prior.')
        }

        this.view!.state.draggingState = {
            draggedCellOrientation: 'col',
            originalIndex: this.view!.state.colIndex,
            mousePos: event.clientX,
        }
        this.view!.emitUpdate()

        this.editor.dispatch(
            this.editor._tiptapEditor.state.tr.setMeta(tableHandlesPluginKey, {
                draggedCellOrientation: this.view!.state.draggingState.draggedCellOrientation,
                originalIndex: this.view!.state.colIndex,
                newIndex: this.view!.state.colIndex,
                tablePos: this.view!.tablePos,
            })
        )

        setHiddenDragImage(this.editor._tiptapEditor.view.root)
        event.dataTransfer!.setDragImage(dragImageElement!, 0, 0)
        event.dataTransfer!.effectAllowed = 'move'
    }

    /**
     * 开始行拖拽
     *
     * 设置拖拽状态为行模式，初始化相关数据
     */
    rowDragStart = (event: { dataTransfer: DataTransfer | null; clientY: number }) => {
        if (this.view!.state === undefined || this.view!.state.rowIndex === undefined) {
            throw new Error('Attempted to drag table row, but no table block was hovered prior.')
        }

        this.view!.state.draggingState = {
            draggedCellOrientation: 'row',
            originalIndex: this.view!.state.rowIndex,
            mousePos: event.clientY,
        }
        this.view!.emitUpdate()

        this.editor.dispatch(
            this.editor._tiptapEditor.state.tr.setMeta(tableHandlesPluginKey, {
                draggedCellOrientation: this.view!.state.draggingState.draggedCellOrientation,
                originalIndex: this.view!.state.rowIndex,
                newIndex: this.view!.state.rowIndex,
                tablePos: this.view!.tablePos,
            })
        )

        setHiddenDragImage(this.editor._tiptapEditor.view.root)
        event.dataTransfer!.setDragImage(dragImageElement!, 0, 0)
        event.dataTransfer!.effectAllowed = 'copyMove'
    }

    /**
     * 结束拖拽
     *
     * 清除拖拽状态，移除隐藏的拖拽图像
     */
    dragEnd = () => {
        if (this.view!.state === undefined) {
            throw new Error('Attempted to drag table row, but no table block was hovered prior.')
        }

        this.view!.state.draggingState = undefined
        this.view!.emitUpdate()

        this.editor.dispatch(this.editor._tiptapEditor.state.tr.setMeta(tableHandlesPluginKey, null))

        unsetHiddenDragImage(this.editor._tiptapEditor.view.root)
    }

    /**
     * 冻结处理器
     *
     * 阻止处理器响应鼠标移动事件
     */
    freezeHandles = () => {
        this.view!.menuFrozen = true
    }

    /**
     * 解冻处理器
     *
     * 允许处理器响应鼠标移动事件
     */
    unfreezeHandles = () => {
        this.view!.menuFrozen = false
    }
}
