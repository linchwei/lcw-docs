/**
 * 复制到剪贴板扩展
 *
 * 该文件提供将编辑器内容复制到剪贴板的功能。
 * 支持多种格式：内部 HTML、外部 HTML 和 Markdown。
 */
import { Extension } from '@tiptap/core'
import { Fragment, Node } from 'prosemirror-model'
import { NodeSelection, Plugin } from 'prosemirror-state'
import { CellSelection } from 'prosemirror-tables'
import * as pmView from 'prosemirror-view'
import { EditorView } from 'prosemirror-view'

import type { LcwDocEditor } from '../../../editor/LcwDocEditor'
import { BlockSchema, InlineContentSchema, StyleSchema } from '../../../schema/index'
import { createExternalHTMLExporter } from '../../exporters/html/externalHTMLExporter'
import { cleanHTMLToMarkdown } from '../../exporters/markdown/markdownExporter'
import { fragmentToBlocks } from '../../nodeConversions/fragmentToBlocks'
import { contentNodeToInlineContent, contentNodeToTableContent } from '../../nodeConversions/nodeToBlock'

/**
 * 将片段转换为外部 HTML
 *
 * 根据选择的内容类型（表格、内联内容或块）转换为相应的外部 HTML。
 *
 * @param view - 编辑器视图
 * @param selectedFragment - 选中的片段
 * @param editor - 编辑器实例
 * @returns 返回外部 HTML 字符串
 */
function fragmentToExternalHTML<BSchema extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema>(
    view: pmView.EditorView,
    selectedFragment: Fragment,
    editor: LcwDocEditor<BSchema, I, S>
) {
    let isWithinBlockContent = false
    const isWithinTable = view.state.selection instanceof CellSelection

    if (!isWithinTable) {
        const fragmentWithoutParents = view.state.doc.slice(view.state.selection.from, view.state.selection.to, false).content

        const children = []
        for (let i = 0; i < fragmentWithoutParents.childCount; i++) {
            children.push(fragmentWithoutParents.child(i))
        }

        isWithinBlockContent =
            children.find(
                child =>
                    child.type.name === 'blockContainer' || child.type.name === 'blockGroup' || child.type.spec.group === 'blockContent'
            ) === undefined
        if (isWithinBlockContent) {
            selectedFragment = fragmentWithoutParents
        }
    }

    let externalHTML: string

    const externalHTMLExporter = createExternalHTMLExporter(view.state.schema, editor)

    if (isWithinTable) {
        if (selectedFragment.firstChild?.type.name === 'table') {
            selectedFragment = selectedFragment.firstChild.content
        }

        const ic = contentNodeToTableContent(selectedFragment as any, editor.schema.inlineContentSchema, editor.schema.styleSchema)

        externalHTML = externalHTMLExporter.exportInlineContent(ic as any, {})
    } else if (isWithinBlockContent) {
        const ic = contentNodeToInlineContent(selectedFragment as any, editor.schema.inlineContentSchema, editor.schema.styleSchema)
        externalHTML = externalHTMLExporter.exportInlineContent(ic, {})
    } else {
        const blocks = fragmentToBlocks(selectedFragment, editor.schema)
        externalHTML = externalHTMLExporter.exportBlocks(blocks, {})
    }
    return externalHTML
}

/**
 * 将选中内容转换为 HTML
 *
 * 返回剪贴板所需的三种格式：内部 HTML、外部 HTML 和 Markdown。
 *
 * @param view - 编辑器视图
 * @param editor - 编辑器实例
 * @returns 返回包含 clipboardHTML、externalHTML 和 markdown 的对象
 */
export function selectedFragmentToHTML<BSchema extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema>(
    view: EditorView,
    editor: LcwDocEditor<BSchema, I, S>
): {
    clipboardHTML: string
    externalHTML: string
    markdown: string
} {
    if ('node' in view.state.selection && (view.state.selection.node as Node).type.spec.group === 'blockContent') {
        editor.dispatch(
            editor._tiptapEditor.state.tr.setSelection(new NodeSelection(view.state.doc.resolve(view.state.selection.from - 1)))
        )
    }

    const clipboardHTML: string = (pmView as any).__serializeForClipboard(view, view.state.selection.content()).dom.innerHTML

    const selectedFragment = view.state.selection.content().content

    const externalHTML = fragmentToExternalHTML<BSchema, I, S>(view, selectedFragment, editor)

    const markdown = cleanHTMLToMarkdown(externalHTML)

    return { clipboardHTML, externalHTML, markdown }
}

/**
 * 复制到剪贴板
 *
 * 将选中内容复制到剪贴板，设置多种格式的数据。
 *
 * @param editor - 编辑器实例
 * @param view - 编辑器视图
 * @param event - 剪贴板事件
 */
const copyToClipboard = <BSchema extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema>(
    editor: LcwDocEditor<BSchema, I, S>,
    view: EditorView,
    event: ClipboardEvent
) => {
    event.preventDefault()
    event.clipboardData!.clearData()

    const { clipboardHTML, externalHTML, markdown } = selectedFragmentToHTML(view, editor)

    event.clipboardData!.setData('lcwdoc/html', clipboardHTML)
    event.clipboardData!.setData('text/html', externalHTML)
    event.clipboardData!.setData('text/plain', markdown)
}

/**
 * 创建复制到剪贴板扩展
 *
 * 返回一个 Tiptap 扩展，处理复制、剪切和拖拽开始事件。
 *
 * @param editor - 编辑器实例
 * @returns 返回 Tiptap 扩展
 */
export const createCopyToClipboardExtension = <BSchema extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema>(
    editor: LcwDocEditor<BSchema, I, S>
) =>
    Extension.create<{ editor: LcwDocEditor<BSchema, I, S> }, undefined>({
        name: 'copyToClipboard',
        addProseMirrorPlugins() {
            return [
                new Plugin({
                    props: {
                        handleDOMEvents: {
                            copy(view, event) {
                                copyToClipboard(editor, view, event)
                                return true
                            },
                            cut(view, event) {
                                copyToClipboard(editor, view, event)
                                view.dispatch(view.state.tr.deleteSelection())
                                return true
                            },

                            dragstart(view, event) {
                                if (!('node' in view.state.selection)) {
                                    return
                                }

                                if ((view.state.selection.node as Node).type.spec.group !== 'blockContent') {
                                    return
                                }

                                editor.dispatch(
                                    editor._tiptapEditor.state.tr.setSelection(
                                        new NodeSelection(view.state.doc.resolve(view.state.selection.from - 1))
                                    )
                                )

                                event.preventDefault()
                                event.dataTransfer!.clearData()

                                const { clipboardHTML, externalHTML, markdown } = selectedFragmentToHTML(view, editor)

                                event.dataTransfer!.setData('lcwdoc/html', clipboardHTML)
                                event.dataTransfer!.setData('text/html', externalHTML)
                                event.dataTransfer!.setData('text/plain', markdown)

                                return true
                            },
                        },
                    },
                }),
            ]
        },
    })