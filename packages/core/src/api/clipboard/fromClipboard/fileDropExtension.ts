/**
 * 文件拖放扩展
 *
 * 该文件提供处理文件拖放事件的功能。
 * 当用户将文件拖入编辑器时，触发文件插入处理。
 */
import { Extension } from '@tiptap/core'
import { Plugin } from 'prosemirror-state'

import type { LcwDocEditor } from '../../../editor/LcwDocEditor'
import { BlockSchema, InlineContentSchema, StyleSchema } from '../../../schema/index'
import { acceptedMIMETypes } from './acceptedMIMETypes'
import { handleFileInsertion } from './handleFileInsertion'

/**
 * 创建文件拖放扩展
 *
 * 返回一个 Tiptap 扩展，用于处理 ProseMirror 的拖放事件。
 * 检查拖放的数据类型，只处理接受的文件类型。
 *
 * @param editor - 编辑器实例
 * @returns 返回 Tiptap 扩展
 */
export const createDropFileExtension = <BSchema extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema>(
    editor: LcwDocEditor<BSchema, I, S>
) =>
    Extension.create<{ editor: LcwDocEditor<BSchema, I, S> }, undefined>({
        name: 'dropFile',
        addProseMirrorPlugins() {
            return [
                new Plugin({
                    props: {
                        handleDOMEvents: {
                            drop(_view, event) {
                                if (!editor.isEditable) {
                                    return
                                }

                                let format: (typeof acceptedMIMETypes)[number] | null = null
                                for (const mimeType of acceptedMIMETypes) {
                                    if (event.dataTransfer!.types.includes(mimeType)) {
                                        format = mimeType
                                        break
                                    }
                                }
                                if (format === null) {
                                    return true
                                }

                                if (format === 'Files') {
                                    handleFileInsertion(event, editor)
                                    return true
                                }

                                return false
                            },
                        },
                    },
                }),
            ]
        },
    })