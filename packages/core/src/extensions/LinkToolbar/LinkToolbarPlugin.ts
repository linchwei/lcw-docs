/**
 * 链接工具栏插件
 *
 * 该插件在用户鼠标悬停在链接上或选中链接文本时显示一个工具栏。
 * 工具栏提供编辑链接和删除链接的功能。
 */

import { getMarkRange, posToDOMRect, Range } from '@tiptap/core'
import { EditorView } from '@tiptap/pm/view'
import { Mark } from 'prosemirror-model'
import { Plugin, PluginKey, PluginView } from 'prosemirror-state'

import type { LcwDocEditor } from '../../editor/LcwDocEditor'
import { UiElementPosition } from '../../extensions-shared/UiElementPosition'
import { BlockSchema, InlineContentSchema, StyleSchema } from '../../schema/index'
import { EventEmitter } from '../../util/EventEmitter'

/**
 * 链接工具栏状态
 *
 * 描述链接工具栏的显示状态、位置、URL和文本内容
 */
export type LinkToolbarState = UiElementPosition & {
    url: string
    text: string
}

/**
 * 链接工具栏视图类
 *
 * 负责处理链接工具栏的显示和用户交互，包括：
 * - 检测鼠标悬停和键盘导航到的链接
 * - 管理工具栏的显示和隐藏
 * - 提供编辑和删除链接的方法
 */
class LinkToolbarView implements PluginView {
    public state?: LinkToolbarState
    public emitUpdate: () => void

    menuUpdateTimer: ReturnType<typeof setTimeout> | undefined
    startMenuUpdateTimer: () => void
    stopMenuUpdateTimer: () => void

    mouseHoveredLinkMark: Mark | undefined
    mouseHoveredLinkMarkRange: Range | undefined

    keyboardHoveredLinkMark: Mark | undefined
    keyboardHoveredLinkMarkRange: Range | undefined

    linkMark: Mark | undefined
    linkMarkRange: Range | undefined

    constructor(
        private readonly editor: LcwDocEditor<any, any, any>,
        private readonly pmView: EditorView,
        emitUpdate: (state: LinkToolbarState) => void
    ) {
        this.emitUpdate = () => {
            if (!this.state) {
                throw new Error('Attempting to update uninitialized link toolbar')
            }

            emitUpdate(this.state)
        }

        this.startMenuUpdateTimer = () => {
            this.menuUpdateTimer = setTimeout(() => {
                this.update()
            }, 250)
        }

        this.stopMenuUpdateTimer = () => {
            if (this.menuUpdateTimer) {
                clearTimeout(this.menuUpdateTimer)
                this.menuUpdateTimer = undefined
            }

            return false
        }

        this.pmView.dom.addEventListener('mouseover', this.mouseOverHandler)
        this.pmView.root.addEventListener('click', this.clickHandler as EventListener, true)
        this.pmView.root.addEventListener('scroll', this.scrollHandler, true)
    }

    /**
     * 处理鼠标悬停事件
     *
     * 检测鼠标是否悬停在链接上，如果是则更新状态
     */
    mouseOverHandler = (event: MouseEvent) => {
        this.mouseHoveredLinkMark = undefined
        this.mouseHoveredLinkMarkRange = undefined

        this.stopMenuUpdateTimer()

        if (event.target instanceof HTMLAnchorElement && event.target.nodeName === 'A') {
            const hoveredLinkElement = event.target
            const posInHoveredLinkMark = this.pmView.posAtDOM(hoveredLinkElement, 0) + 1
            const resolvedPosInHoveredLinkMark = this.pmView.state.doc.resolve(posInHoveredLinkMark)
            const marksAtPos = resolvedPosInHoveredLinkMark.marks()

            for (const mark of marksAtPos) {
                if (mark.type.name === this.pmView.state.schema.mark('link').type.name) {
                    this.mouseHoveredLinkMark = mark
                    this.mouseHoveredLinkMarkRange = getMarkRange(resolvedPosInHoveredLinkMark, mark.type, mark.attrs) || undefined

                    break
                }
            }
        }

        this.startMenuUpdateTimer()

        return false
    }

    /**
     * 处理点击事件
     *
     * 当点击编辑器外部时，隐藏工具栏
     */
    clickHandler = (event: MouseEvent) => {
        const editorWrapper = this.pmView.dom.parentElement!

        if (
            this.linkMark &&
            event &&
            event.target &&
            !(editorWrapper === (event.target as Node) || editorWrapper.contains(event.target as Node))
        ) {
            if (this.state?.show) {
                this.state.show = false
                this.emitUpdate()
            }
        }
    }

    /**
     * 处理滚动事件
     *
     * 当编辑器滚动时，更新工具栏位置
     */
    scrollHandler = () => {
        if (this.linkMark !== undefined) {
            if (this.state?.show) {
                this.state.referencePos = posToDOMRect(this.pmView, this.linkMarkRange!.from, this.linkMarkRange!.to)
                this.emitUpdate()
            }
        }
    }

    /**
     * 编辑链接
     *
     * 用新的URL和文本替换当前链接
     */
    editLink(url: string, text: string) {
        const tr = this.pmView.state.tr.insertText(text, this.linkMarkRange!.from, this.linkMarkRange!.to)
        tr.addMark(this.linkMarkRange!.from, this.linkMarkRange!.from + text.length, this.pmView.state.schema.mark('link', { href: url }))
        this.editor.dispatch(tr)
        this.pmView.focus()

        if (this.state?.show) {
            this.state.show = false
            this.emitUpdate()
        }
    }

    /**
     * 删除链接
     *
     * 移除链接标记，保留文本内容
     */
    deleteLink() {
        this.editor.dispatch(
            this.pmView.state.tr
                .removeMark(this.linkMarkRange!.from, this.linkMarkRange!.to, this.linkMark!.type)
                .setMeta('preventAutolink', true)
        )
        this.pmView.focus()

        if (this.state?.show) {
            this.state.show = false
            this.emitUpdate()
        }
    }

    /**
     * 更新视图状态
     *
     * 检测当前光标位置是否有链接，更新工具栏显示状态
     */
    update() {
        if (!this.pmView.hasFocus()) {
            return
        }
        const prevLinkMark = this.linkMark

        this.linkMark = undefined
        this.linkMarkRange = undefined
        this.keyboardHoveredLinkMark = undefined
        this.keyboardHoveredLinkMarkRange = undefined

        if (this.pmView.state.selection.empty) {
            const marksAtPos = this.pmView.state.selection.$from.marks()

            for (const mark of marksAtPos) {
                if (mark.type.name === this.pmView.state.schema.mark('link').type.name) {
                    this.keyboardHoveredLinkMark = mark
                    this.keyboardHoveredLinkMarkRange = getMarkRange(this.pmView.state.selection.$from, mark.type, mark.attrs) || undefined

                    break
                }
            }
        }

        if (this.mouseHoveredLinkMark) {
            this.linkMark = this.mouseHoveredLinkMark
            this.linkMarkRange = this.mouseHoveredLinkMarkRange
        }

        if (this.keyboardHoveredLinkMark) {
            this.linkMark = this.keyboardHoveredLinkMark
            this.linkMarkRange = this.keyboardHoveredLinkMarkRange
        }

        if (this.linkMark && this.editor.isEditable) {
            this.state = {
                show: true,
                referencePos: posToDOMRect(this.pmView, this.linkMarkRange!.from, this.linkMarkRange!.to),
                url: this.linkMark!.attrs.href,
                text: this.pmView.state.doc.textBetween(this.linkMarkRange!.from, this.linkMarkRange!.to),
            }
            this.emitUpdate()

            return
        }

        if (this.state?.show && prevLinkMark && (!this.linkMark || !this.editor.isEditable)) {
            this.state.show = false
            this.emitUpdate()

            return
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
        this.pmView.dom.removeEventListener('mouseover', this.mouseOverHandler)
        this.pmView.root.removeEventListener('scroll', this.scrollHandler, true)
        this.pmView.root.removeEventListener('click', this.clickHandler as EventListener, true)
    }
}

export const linkToolbarPluginKey = new PluginKey('LinkToolbarPlugin')

/**
 * 链接工具栏的ProseMirror插件
 *
 * 包装LinkToolbarView，提供事件发射机制和键盘事件处理
 */
export class LinkToolbarProsemirrorPlugin<
    BSchema extends BlockSchema,
    I extends InlineContentSchema,
    S extends StyleSchema,
> extends EventEmitter<any> {
    private view: LinkToolbarView | undefined
    public readonly plugin: Plugin

    constructor(editor: LcwDocEditor<BSchema, I, S>) {
        super()
        this.plugin = new Plugin({
            key: linkToolbarPluginKey,
            view: editorView => {
                this.view = new LinkToolbarView(editor, editorView, state => {
                    this.emit('update', state)
                })
                return this.view
            },
            props: {
                handleKeyDown: (_view, event: KeyboardEvent) => {
                    if (event.key === 'Escape' && this.shown) {
                        this.view!.closeMenu()
                        return true
                    }
                    return false
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
    public onUpdate(callback: (state: LinkToolbarState) => void) {
        return this.on('update', callback)
    }

    /**
     * 编辑链接
     *
     * @param url - 新的链接URL
     * @param text - 新的链接文本
     */
    public editLink = (url: string, text: string) => {
        this.view!.editLink(url, text)
    }

    /**
     * 删除链接
     */
    public deleteLink = () => {
        this.view!.deleteLink()
    }

    /**
     * 开始隐藏计时器
     */
    public startHideTimer = () => {
        this.view!.startMenuUpdateTimer()
    }

    /**
     * 停止隐藏计时器
     */
    public stopHideTimer = () => {
        this.view!.stopMenuUpdateTimer()
    }

    /**
     * 获取工具栏是否显示
     */
    public get shown() {
        return this.view?.state?.show || false
    }

    /**
     * 关闭菜单
     */
    public closeMenu = () => this.view!.closeMenu()
}
