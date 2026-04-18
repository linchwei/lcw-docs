/**
 * 文件面板插件
 *
 * 该插件在用户点击或选中文件块时显示一个文件操作面板。
 * 面板提供文件预览、下载、替换等功能。
 */

import { EditorState, Plugin, PluginKey, PluginView } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'

import type { LcwDocEditor } from '../../editor/LcwDocEditor'
import { UiElementPosition } from '../../extensions-shared/UiElementPosition'
import type { BlockFromConfig, FileBlockConfig, InlineContentSchema, StyleSchema } from '../../schema/index'
import { EventEmitter } from '../../util/EventEmitter'

/**
 * 文件面板状态
 *
 * 描述文件面板的显示状态、位置和关联的文件块信息
 */
export type FilePanelState<I extends InlineContentSchema, S extends StyleSchema> = UiElementPosition & {
    block: BlockFromConfig<FileBlockConfig, I, S>
}

/**
 * 文件面板视图类
 *
 * 负责处理文件面板的显示和用户交互，包括：
 * - 监听编辑器事件，检测文件块的点击
 * - 处理滚动事件以更新面板位置
 * - 管理面板的显示和隐藏
 */
export class FilePanelView<I extends InlineContentSchema, S extends StyleSchema> implements PluginView {
    public state?: FilePanelState<I, S>
    public emitUpdate: () => void

    constructor(
        private readonly editor: LcwDocEditor<Record<string, FileBlockConfig>, I, S>,
        private readonly pluginKey: PluginKey,
        private readonly pmView: EditorView,
        emitUpdate: (state: FilePanelState<I, S>) => void
    ) {
        this.emitUpdate = () => {
            if (!this.state) {
                throw new Error('Attempting to update uninitialized file panel')
            }

            emitUpdate(this.state)
        }

        pmView.dom.addEventListener('mousedown', this.mouseDownHandler)
        pmView.dom.addEventListener('dragstart', this.dragstartHandler)
        pmView.root.addEventListener('scroll', this.scrollHandler, true)
    }

    /**
     * 处理鼠标按下事件
     *
     * 当面板显示时，点击任意位置隐藏面板
     */
    mouseDownHandler = () => {
        if (this.state?.show) {
            this.state.show = false
            this.emitUpdate()
        }
    }

    /**
     * 处理拖拽开始事件
     *
     * 当面板显示时，开始拖拽操作会隐藏面板
     */
    dragstartHandler = () => {
        if (this.state?.show) {
            this.state.show = false
            this.emitUpdate()
        }
    }

    /**
     * 处理滚动事件
     *
     * 当面板显示时，滚动会更新面板的位置信息
     */
    scrollHandler = () => {
        if (this.state?.show) {
            const blockElement = this.pmView.root.querySelector(`[data-node-type="blockContainer"][data-id="${this.state.block.id}"]`)
            if (!blockElement) {
                return
            }
            this.state.referencePos = blockElement.getBoundingClientRect()
            this.emitUpdate()
        }
    }

    /**
     * 更新视图
     *
     * 根据插件状态和编辑器状态更新面板显示状态
     */
    update(view: EditorView, prevState: EditorState) {
        const pluginState: {
            block: BlockFromConfig<FileBlockConfig, I, S>
        } = this.pluginKey.getState(view.state)

        if (!this.state?.show && pluginState.block && this.editor.isEditable) {
            const blockElement = this.pmView.root.querySelector(`[data-node-type="blockContainer"][data-id="${pluginState.block.id}"]`)
            if (!blockElement) {
                return
            }
            this.state = {
                show: true,
                referencePos: blockElement.getBoundingClientRect(),
                block: pluginState.block,
            }

            this.emitUpdate()

            return
        }

        if (!view.state.selection.eq(prevState.selection) || !view.state.doc.eq(prevState.doc) || !this.editor.isEditable) {
            if (this.state?.show) {
                this.state.show = false

                this.emitUpdate()
            }
        }
    }

    /**
     * 关闭菜单
     */
    closeMenu = () => {
        if (this.state?.show) {
            this.state.show = false
            this.emitUpdate()
        }
    }

    /**
     * 销毁视图
     *
     * 移除所有事件监听器
     */
    destroy() {
        this.pmView.dom.removeEventListener('mousedown', this.mouseDownHandler)

        this.pmView.dom.removeEventListener('dragstart', this.dragstartHandler)

        this.pmView.root.removeEventListener('scroll', this.scrollHandler, true)
    }
}

const filePanelPluginKey = new PluginKey('FilePanelPlugin')

/**
 * 文件面板的ProseMirror插件
 *
 * 包装FilePanelView，提供事件发射机制和键盘事件处理
 */
export class FilePanelProsemirrorPlugin<I extends InlineContentSchema, S extends StyleSchema> extends EventEmitter<any> {
    private view: FilePanelView<I, S> | undefined
    public readonly plugin: Plugin

    constructor(editor: LcwDocEditor<Record<string, FileBlockConfig>, I, S>) {
        super()
        this.plugin = new Plugin<{
            block: BlockFromConfig<FileBlockConfig, I, S> | undefined
        }>({
            key: filePanelPluginKey,
            view: editorView => {
                this.view = new FilePanelView<I, S>(editor, filePanelPluginKey, editorView, state => {
                    this.emit('update', state)
                })
                return this.view
            },
            props: {
                handleKeyDown: (_view, event: KeyboardEvent) => {
                    if (event.key === 'Escape' && this.shown) {
                        this.view?.closeMenu()
                        return true
                    }
                    return false
                },
            },
            state: {
                init: () => {
                    return {
                        block: undefined,
                    }
                },
                apply: transaction => {
                    const block: BlockFromConfig<FileBlockConfig, I, S> | undefined = transaction.getMeta(filePanelPluginKey)?.block

                    return {
                        block,
                    }
                },
            },
        })
    }

    /**
     * 获取面板是否显示
     */
    public get shown() {
        return this.view?.state?.show || false
    }

    /**
     * 订阅状态更新事件
     *
     * @param callback - 状态更新时的回调函数
     * @returns 事件取消订阅函数
     */
    public onUpdate(callback: (state: FilePanelState<I, S>) => void) {
        return this.on('update', callback)
    }

    /**
     * 关闭菜单
     */
    public closeMenu = () => this.view?.closeMenu()
}
