/**
 * 内部 HTML 序列化器
 *
 * 该文件提供将块序列化为内部 HTML 的功能。
 * 内部 HTML 用于在编辑器内部使用，包含编辑所需的特殊属性和结构。
 */
import { DOMSerializer, Schema } from 'prosemirror-model'

import { PartialBlock } from '../../../blocks/defaultBlocks'
import type { LcwDocEditor } from '../../../editor/LcwDocEditor'
import { BlockSchema, InlineContentSchema, StyleSchema } from '../../../schema/index'
import { serializeBlocksInternalHTML } from './util/serializeBlocksInternalHTML'

/**
 * 创建内部 HTML 序列化器
 *
 * 返回一个对象，包含序列化块为内部 HTML 的方法。
 * 内部 HTML 包含编辑器所需的特殊属性。
 *
 * @param schema - ProseMirror schema
 * @param editor - 编辑器实例
 * @returns 返回序列化器对象
 */
export const createInternalHTMLSerializer = <BSchema extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema>(
    schema: Schema,
    editor: LcwDocEditor<BSchema, I, S>
) => {
    const serializer = DOMSerializer.fromSchema(schema)

    return {
        /**
         * 序列化块为内部 HTML
         *
         * 将块数组序列化为编辑器内部使用的 HTML 字符串。
         *
         * @param blocks - 要序列化的块数组
         * @param options - 选项配置，可指定 document
         * @returns 返回 HTML 字符串
         */
        serializeBlocks: (blocks: PartialBlock<BSchema, I, S>[], options: { document?: Document }) => {
            return serializeBlocksInternalHTML(editor, blocks, serializer, options).outerHTML
        },
    }
}