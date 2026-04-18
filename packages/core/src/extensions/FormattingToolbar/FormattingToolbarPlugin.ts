import { isNodeSelection, isTextSelection, posToDOMRect } from '@tiptap/core'
import { EditorState, Plugin, PluginKey, PluginView } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'

import type { LcwDocEditor } from '../../editor/LcwDocEditor'
import { UiElementPosition } from '../../extensions-shared/UiElementPosition'
import { BlockSchema, InlineContentSchema, StyleSchema } from '../../schema/index'
import { EventEmitter } from '../../util/EventEmitter'

export type FormattingToolbarState = UiElementPosition

export class FormattingToolbarView implements PluginView {
    public state?: FormattingToolbarState
    public emitUpdate: () => void

    public preventHide = false
    public preventShow = false

    public shouldShow: (props: { view: EditorView; state: EditorState; from: number; to: number }) => boolean = ({
        state,
        from,
        to,
        view,
    }) => {
        const { doc, selection } = state
        const { empty } = selection
        const isEmptyTextBlock = !doc.textBetween(from, to).length && isTextSelection(state.selection)

        if (selection.$from.parent.type.spec.code || (isNodeSelection(selection) && selection.node.type.spec.code)) {
            return false
        }

        return !(!view.hasFocus() || empty || isEmptyTextBlock)
    }

    constructor(
        private readonly editor: LcwDocEditor<BlockSchema, InlineContentSchema, StyleSchema>,
        private readonly pmView: EditorView,
        emitUpdate: (state: FormattingToolbarState) => void
    ) {
        this.emitUpdate = () => {
            if (!this.state) {
                throw new Error('Attempting to update uninitialized formatting toolbar')
            }

            emitUpdate(this.state)
        }

        pmView.dom.addEventListener('mousedown', this.viewMousedownHandler)
        pmView.dom.addEventListener('mouseup', this.viewMouseupHandler)
        pmView.dom.addEventListener('dragstart', this.dragHandler)
        pmView.dom.addEventListener('dragover', this.dragHandler)
        pmView.dom.addEventListener('blur', this.blurHandler)
        pmView.root.addEventListener('scroll', this.scrollHandler, true)
    }

    blurHandler = (event: FocusEvent) => {
        if (this.preventHide) {
            this.preventHide = false

            return
        }

        const editorWrapper = this.pmView.dom.parentElement!

        if (
            event &&
            event.relatedTarget &&
            (editorWrapper === (event.relatedTarget as Node) ||
                editorWrapper.contains(event.relatedTarget as Node) ||
                (event.relatedTarget as HTMLElement).matches('.bn-ui-container, .bn-ui-container *'))
        ) {
            return
        }

        if (this.state?.show) {
            this.state.show = false
            this.emitUpdate()
        }
    }

    viewMousedownHandler = () => {
        this.preventShow = true
    }

    viewMouseupHandler = () => {
        this.preventShow = false
        setTimeout(() => this.update(this.pmView))
    }

    dragHandler = () => {
        if (this.state?.show) {
            this.state.show = false
            this.emitUpdate()
        }
    }

    scrollHandler = () => {
        if (this.state?.show) {
            this.state.referencePos = this.getSelectionBoundingBox()
            this.emitUpdate()
        }
    }

    update(view: EditorView, oldState?: EditorState) {
        const { state, composing } = view
        const { doc, selection } = state
        const isSame = oldState && oldState.doc.eq(doc) && oldState.selection.eq(selection)

        if (composing || isSame) {
            return
        }

        const { ranges } = selection
        const from = Math.min(...ranges.map(range => range.$from.pos))
        const to = Math.max(...ranges.map(range => range.$to.pos))

        const shouldShow = this.shouldShow?.({
            view,
            state,
            from,
            to,
        })

        if (!this.preventShow && (shouldShow || this.preventHide)) {
            this.state = {
                show: true,
                referencePos: this.getSelectionBoundingBox(),
            }

            this.emitUpdate()

            return
        }

        if (this.state?.show && !this.preventHide && (!shouldShow || this.preventShow || !this.editor.isEditable)) {
            this.state.show = false
            this.emitUpdate()

            return
        }
    }

    destroy() {
        this.pmView.dom.removeEventListener('mousedown', this.viewMousedownHandler)
        this.pmView.dom.removeEventListener('mouseup', this.viewMouseupHandler)
        this.pmView.dom.removeEventListener('dragstart', this.dragHandler)
        this.pmView.dom.removeEventListener('dragover', this.dragHandler)
        this.pmView.dom.removeEventListener('blur', this.blurHandler)

        this.pmView.root.removeEventListener('scroll', this.scrollHandler, true)
    }

    closeMenu = () => {
        if (this.state?.show) {
            this.state.show = false
            this.emitUpdate()
        }
    }

    getSelectionBoundingBox() {
        const { state } = this.pmView
        const { selection } = state

        const { ranges } = selection
        const from = Math.min(...ranges.map(range => range.$from.pos))
        const to = Math.max(...ranges.map(range => range.$to.pos))

        if (isNodeSelection(selection)) {
            const node = this.pmView.nodeDOM(from) as HTMLElement
            if (node) {
                return node.getBoundingClientRect()
            }
        }

        return posToDOMRect(this.pmView, from, to)
    }
}

export const formattingToolbarPluginKey = new PluginKey('FormattingToolbarPlugin')

export class FormattingToolbarProsemirrorPlugin extends EventEmitter<any> {
    private view: FormattingToolbarView | undefined
    public readonly plugin: Plugin

    constructor(editor: LcwDocEditor<any, any, any>) {
        super()
        this.plugin = new Plugin({
            key: formattingToolbarPluginKey,
            view: editorView => {
                this.view = new FormattingToolbarView(editor, editorView, state => {
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

    public get shown() {
        return this.view?.state?.show || false
    }

    public onUpdate(callback: (state: FormattingToolbarState) => void) {
        return this.on('update', callback)
    }

    public closeMenu = () => this.view!.closeMenu()
}
