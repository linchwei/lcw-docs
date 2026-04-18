/**
 * 侧边菜单插件
 *
 * 该插件在用户鼠标悬停在块附近时显示一个侧边菜单。
 * 菜单提供拖拽排序、删除等块操作功能。
 */

import { PluginView } from '@tiptap/pm/state'
import { EditorState, Plugin, PluginKey } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'

import { Block } from '../../blocks/defaultBlocks'
import type { LcwDocEditor } from '../../editor/LcwDocEditor'
import { UiElementPosition } from '../../extensions-shared/UiElementPosition'
import { BlockSchema, InlineContentSchema, StyleSchema } from '../../schema/index'
import { initializeESMDependencies } from '../../util/esmDependencies'
import { EventEmitter } from '../../util/EventEmitter'
import { dragStart, getDraggableBlockFromElement, unsetDragImage } from './dragging'

/**
 * 侧边菜单状态
 *
 * 描述侧边菜单的显示状态、位置和关联的块信息
 */
export type SideMenuState<BSchema extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema> = UiElementPosition & {
    block: Block<BSchema, I, S>
}

/**
 * 根据鼠标位置获取对应的块元素
 *
 * 通过elementsFromPoint获取鼠标位置的元素，然后向上查找
 * 最近的块容器元素，返回块的信息（节点和ID）。
 *
 * @param mousePos - 鼠标坐标位置
 * @param view - 编辑器视图
 * @returns 块元素信息，包含DOM节点和ID，如果未找到则返回undefined
 */
const getBlockFromMousePos = (
    mousePos: {
        x: number
        y: number
    },
    view: EditorView
): { node: HTMLElement; id: string } | undefined => {
    if (!view.dom.firstChild) {
        return
    }

    const editorBoundingBox = (view.dom.firstChild as HTMLElement).getBoundingClientRect()

    const coords = {
        left: editorBoundingBox.left + editorBoundingBox.width / 2,
        top: mousePos.y,
    }

    const elements = view.root.elementsFromPoint(coords.left, coords.top)
    let block = undefined

    for (const element of elements) {
        if (view.dom.contains(element)) {
            block = getDraggableBlockFromElement(element, view)
            break
        }
    }

    return block
}

/**
 * 侧边菜单视图类
 *
 * 负责处理侧边菜单UI的显示和用户交互，包括：
 * - 监听鼠标移动事件，显示/隐藏菜单
 * - 处理拖拽排序功能
 * - 管理菜单的冻结状态
 */
export class SideMenuView<BSchema extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema> implements PluginView {
    public state?: SideMenuState<BSchema, I, S>
    public readonly emitUpdate: (state: SideMenuState<BSchema, I, S>) => void

    private mousePos: { x: number; y: number } | undefined

    private hoveredBlock: HTMLElement | undefined

    public menuFrozen = false

    constructor(
        private readonly editor: LcwDocEditor<BSchema, I, S>,
        private readonly pmView: EditorView,
        emitUpdate: (state: SideMenuState<BSchema, I, S>) => void
    ) {
        this.emitUpdate = () => {
            if (!this.state) {
                throw new Error('Attempting to update uninitialized side menu')
            }

            emitUpdate(this.state)
        }

        this.pmView.root.addEventListener('drop', this.onDrop as EventListener, true)
        this.pmView.root.addEventListener('dragover', this.onDragOver as EventListener)
        initializeESMDependencies()
        this.pmView.root.addEventListener('mousemove', this.onMouseMove as EventListener, true)
        this.pmView.root.addEventListener('keydown', this.onKeyDown as EventListener, true)
    }

    /**
     * 更新菜单状态
     *
     * @param state - 新的菜单状态
     */
    updateState = (state: SideMenuState<BSchema, I, S>) => {
        this.state = state
        this.emitUpdate(this.state)
    }

    /**
     * 根据鼠标位置更新菜单状态
     *
     * 如果菜单未被冻结且鼠标位置有效，
     * 则获取该位置对应的块并显示菜单。
     */
    updateStateFromMousePos = () => {
        if (this.menuFrozen || !this.mousePos) {
            return
        }

        const block = getBlockFromMousePos(this.mousePos, this.pmView)
        if (!block || !this.editor.isEditable) {
            if (this.state?.show) {
                this.state.show = false
                this.updateState(this.state)
            }

            return
        }

        if (this.state?.show && this.hoveredBlock?.hasAttribute('data-id') && this.hoveredBlock?.getAttribute('data-id') === block.id) {
            return
        }

        this.hoveredBlock = block.node

        const blockContent = block.node.firstChild as HTMLElement

        if (!blockContent) {
            return
        }

        if (this.editor.isEditable) {
            const editorBoundingBox = (this.pmView.dom.firstChild as HTMLElement).getBoundingClientRect()
            const blockContentBoundingBox = blockContent.getBoundingClientRect()

            this.updateState({
                show: true,
                referencePos: new DOMRect(
                    editorBoundingBox.x,
                    blockContentBoundingBox.y,
                    blockContentBoundingBox.width,
                    blockContentBoundingBox.height
                ),
                block: this.editor.getBlock(this.hoveredBlock!.getAttribute('data-id')!)!,
            })
        }
    }

    /**
     * 处理拖拽放置事件
     *
     * 如果是从编辑器内部拖拽，则触发drop事件
     */
    onDrop = (event: DragEvent) => {
        this.editor._tiptapEditor.commands.blur()

        if ((event as any).synthetic || !event.dataTransfer?.types.includes('lcwdoc/html')) {
            return
        }

        const pos = this.pmView.posAtCoords({
            left: event.clientX,
            top: event.clientY,
        })

        if (!pos || pos.inside === -1) {
            const evt = new Event('drop', event) as any
            const editorBoundingBox = (this.pmView.dom.firstChild as HTMLElement).getBoundingClientRect()
            evt.clientX =
                event.clientX < editorBoundingBox.left || event.clientX > editorBoundingBox.left + editorBoundingBox.width
                    ? editorBoundingBox.left + editorBoundingBox.width / 2
                    : event.clientX
            evt.clientY = Math.min(Math.max(event.clientY, editorBoundingBox.top), editorBoundingBox.top + editorBoundingBox.height)
            evt.dataTransfer = event.dataTransfer
            evt.preventDefault = () => event.preventDefault()
            evt.synthetic = true
            this.pmView.dom.dispatchEvent(evt)
        }
    }

    /**
     * 处理拖拽悬停事件
     *
     * 如果是从编辑器内部拖拽，则计算并设置drop坐标
     */
    onDragOver = (event: DragEvent) => {
        if ((event as any).synthetic || !event.dataTransfer?.types.includes('lcwdoc/html')) {
            return
        }
        const pos = this.pmView.posAtCoords({
            left: event.clientX,
            top: event.clientY,
        })

        if (!pos || (pos.inside === -1 && this.pmView.dom.firstChild)) {
            const evt = new Event('dragover', event) as any
            const editorBoundingBox = (this.pmView.dom.firstChild as HTMLElement).getBoundingClientRect()
            evt.clientX = editorBoundingBox.left + editorBoundingBox.width / 2
            evt.clientY = event.clientY
            evt.dataTransfer = event.dataTransfer
            evt.preventDefault = () => event.preventDefault()
            evt.synthetic = true
            this.pmView.dom.dispatchEvent(evt)
        }
    }

    /**
     * 处理键盘事件
     *
     * 当菜单显示且编辑器获得焦点时，隐藏菜单
     */
    onKeyDown = () => {
        if (this.state?.show && this.editor.isFocused()) {
            this.state.show = false
            this.emitUpdate(this.state)
        }
    }

    /**
     * 处理鼠标移动事件
     *
     * 更新鼠标位置，检查鼠标是否在编辑器内，
     * 并调用updateStateFromMousePos更新菜单状态。
     */
    onMouseMove = (event: MouseEvent) => {
        if (this.menuFrozen) {
            return
        }

        this.mousePos = { x: event.clientX, y: event.clientY }

        const editorOuterBoundingBox = this.pmView.dom.getBoundingClientRect()
        const cursorWithinEditor =
            this.mousePos.x > editorOuterBoundingBox.left &&
            this.mousePos.x < editorOuterBoundingBox.right &&
            this.mousePos.y > editorOuterBoundingBox.top &&
            this.mousePos.y < editorOuterBoundingBox.bottom

        const editorWrapper = this.pmView.dom!.parentElement!

        if (
            cursorWithinEditor &&
            event &&
            event.target &&
            !(editorWrapper === event.target || editorWrapper.contains(event.target as HTMLElement))
        ) {
            if (this.state?.show) {
                this.state.show = false
                this.emitUpdate(this.state)
            }

            return
        }

        this.updateStateFromMousePos()
    }

    /**
     * 更新视图
     *
     * 当文档发生变化且菜单显示时，重新计算菜单位置
     */
    update(_view: EditorView, prevState: EditorState) {
        const docChanged = !prevState.doc.eq(this.pmView.state.doc)
        if (docChanged && this.state?.show) {
            this.updateStateFromMousePos()
        }
    }

    /**
     * 销毁视图
     *
     * 移除所有事件监听器，隐藏菜单
     */
    destroy() {
        if (this.state?.show) {
            this.state.show = false
            this.emitUpdate(this.state)
        }
        this.pmView.root.removeEventListener('mousemove', this.onMouseMove as EventListener, true)
        this.pmView.root.removeEventListener('dragover', this.onDragOver as EventListener)

        this.pmView.root.removeEventListener('drop', this.onDrop as EventListener, true)
        this.pmView.root.removeEventListener('keydown', this.onKeyDown as EventListener, true)
    }
}

export const sideMenuPluginKey = new PluginKey('SideMenuPlugin')

/**
 * 侧边菜单的ProseMirror插件
 *
 * 包装SideMenuView，提供事件发射机制和状态管理
 */
export class SideMenuProsemirrorPlugin<
    BSchema extends BlockSchema,
    I extends InlineContentSchema,
    S extends StyleSchema,
> extends EventEmitter<any> {
    public view: SideMenuView<BSchema, I, S> | undefined
    public readonly plugin: Plugin

    constructor(private readonly editor: LcwDocEditor<BSchema, I, S>) {
        super()
        this.plugin = new Plugin({
            key: sideMenuPluginKey,
            view: editorView => {
                this.view = new SideMenuView(editor, editorView, state => {
                    this.emit('update', state)
                })
                return this.view
            },
        })
    }

    /**
     * 订阅状态更新事件
     *
     * @param callback - 状态更新时的回调函数
     * @returns 事件取消订阅函数
     */
    public onUpdate(callback: (state: SideMenuState<BSchema, I, S>) => void) {
        return this.on('update', callback)
    }

    /**
     * 开始块拖拽
     *
     * @param event - 拖拽事件，包含dataTransfer和clientY
     */
    blockDragStart = (event: { dataTransfer: DataTransfer | null; clientY: number }) => {
        dragStart(event, this.editor)
    }

    /**
     * 结束块拖拽
     */
    blockDragEnd = () => unsetDragImage(this.editor.prosemirrorView.root)

    /**
     * 冻结菜单
     *
     * 阻止菜单响应鼠标移动事件
     */
    freezeMenu = () => (this.view!.menuFrozen = true)

    /**
     * 解冻菜单
     *
     * 允许菜单响应鼠标移动事件并隐藏菜单
     */
    unfreezeMenu = () => {
        this.view!.menuFrozen = false
        this.view!.state!.show = false
        this.view!.emitUpdate(this.view!.state!)
    }
}
