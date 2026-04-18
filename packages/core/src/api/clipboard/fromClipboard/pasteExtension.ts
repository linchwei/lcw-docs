/**
 * 剪贴板粘贴扩展
 *
 * 该文件提供处理从剪贴板粘贴内容的功能。
 * 支持多种格式：VSCode 数据、内部 HTML、外部 HTML、文件和纯文本。
 */
import { Extension } from '@tiptap/core'
import { Plugin } from 'prosemirror-state'

import type { LcwDocEditor } from '../../../editor/LcwDocEditor'
import { BlockSchema, InlineContentSchema, StyleSchema } from '../../../schema/index'
import { nestedListsToLcwDocStructure } from '../../parsers/html/util/nestedLists'
import { acceptedMIMETypes } from './acceptedMIMETypes'
import { handleFileInsertion } from './handleFileInsertion'
import { handleVSCodePaste } from './handleVSCodePaste'

/**
 * 创建剪贴板粘贴扩展
 *
 * 返回一个 Tiptap 扩展，用于处理 ProseMirror 的粘贴事件。
 * 根据剪贴板数据类型调用相应的处理函数。
 *
 * @param editor - 编辑器实例
 * @returns 返回 Tiptap 扩展
 */
export const createPasteFromClipboardExtension = <BSchema extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema>(
    editor: LcwDocEditor<BSchema, I, S>
) =>
    Extension.create<{ editor: LcwDocEditor<BSchema, I, S> }, undefined>({
        name: 'pasteFromClipboard',
        addProseMirrorPlugins() {
            return [
                new Plugin({
                    props: {
                        handleDOMEvents: {
                            paste(_view, event) {
                                event.preventDefault()

                                if (!editor.isEditable) {
                                    return
                                }

                                let format: (typeof acceptedMIMETypes)[number] | undefined
                                for (const mimeType of acceptedMIMETypes) {
                                    if (event.clipboardData!.types.includes(mimeType)) {
                                        format = mimeType
                                        break
                                    }
                                }
                                if (!format) {
                                    return true
                                }

                                if (format === 'vscode-editor-data') {
                                    handleVSCodePaste(event, editor)
                                    return true
                                }

                                if (format === 'Files') {
                                    handleFileInsertion(event, editor)
                                    return true
                                }

                                let data = event.clipboardData!.getData(format)

                                if (format === 'lcwdoc/html') {
                                    editor._tiptapEditor.view.pasteHTML(data)
                                    return true
                                }

                                if (format === 'text/html') {
                                    const htmlNode = nestedListsToLcwDocStructure(data.trim())
                                    data = htmlNode.innerHTML
                                    editor._tiptapEditor.view.pasteHTML(data)
                                    return true
                                }

                                editor._tiptapEditor.view.pasteText(data)

                                return true
                            },
                        },
                    },
                }),
            ]
        },
    })