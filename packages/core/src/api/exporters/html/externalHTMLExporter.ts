/**
 * 外部 HTML 导出器
 *
 * 该文件提供将块导出为外部可用的 HTML 功能。
 * 外部 HTML 用于在编辑器外部使用，格式更加通用。
 */
import { DOMSerializer, Schema } from 'prosemirror-model'

import { PartialBlock } from '../../../blocks/defaultBlocks'
import type { LcwDocEditor } from '../../../editor/LcwDocEditor'
import { BlockSchema, InlineContent, InlineContentSchema, StyleSchema } from '../../../schema/index'
import { serializeBlocksExternalHTML, serializeInlineContentExternalHTML } from './util/serializeBlocksExternalHTML'

/**
 * 创建外部 HTML 导出器
 *
 * 返回一个对象，包含导出块和内联内容为外部 HTML 的方法。
 *
 * @param schema - ProseMirror schema
 * @param editor - 编辑器实例
 * @returns 返回导出器对象
 */
export const createExternalHTMLExporter = <BSchema extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema>(
    schema: Schema,
    editor: LcwDocEditor<BSchema, I, S>
) => {
    const serializer = DOMSerializer.fromSchema(schema)

    return {
        /**
         * 导出块为外部 HTML
         *
         * 将块数组转换为可在编辑器外部使用的 HTML 字符串。
         *
         * @param blocks - 要导出的块数组
         * @param options - 选项配置，可指定 document
         * @returns 返回 HTML 字符串
         */
        exportBlocks: (blocks: PartialBlock<BSchema, I, S>[], options: { document?: Document }) => {
            const html = serializeBlocksExternalHTML(
                editor,
                blocks,
                serializer,
                new Set<string>(['numberedListItem']),
                new Set<string>(['bulletListItem', 'checkListItem']),
                options
            )
            const div = document.createElement('div')
            div.append(html)
            return div.innerHTML
        },

        /**
         * 导出内联内容为外部 HTML
         *
         * 将内联内容数组转换为可在编辑器外部使用的 HTML 字符串。
         *
         * @param inlineContent - 要导出的内联内容数组
         * @param options - 选项配置，可指定 document
         * @returns 返回 HTML 字符串
         */
        exportInlineContent: (inlineContent: InlineContent<I, S>[], options: { document?: Document }) => {
            const domFragment = serializeInlineContentExternalHTML(editor, inlineContent as any, serializer, options)

            const parent = document.createElement('div')
            parent.append(domFragment.cloneNode(true))

            return parent.innerHTML
        },
    }
}