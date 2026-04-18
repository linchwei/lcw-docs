/**
 * 在指定位置插入内容
 *
 * 该函数用于在编辑器的指定位置插入内容节点。
 * 支持插入文本内容和块级内容，自动处理选择更新。
 */
import { selectionToInsertionEnd } from '@tiptap/core'
import { Node } from 'prosemirror-model'

import type { LcwDocEditor } from '../../editor/LcwDocEditor'
import { BlockSchema, InlineContentSchema, StyleSchema } from '../../schema/index'

/**
 * 在指定位置插入内容
 *
 * 将节点插入到编辑器的指定位置。
 * 如果插入纯文本内容，使用 insertText 方法；
 * 如果包含块级内容，使用 replaceWith 方法。
 *
 * @param position - 插入位置，可以是数字（位置）或包含 from/to 的对象
 * @param nodes - 要插入的节点数组
 * @param editor - 编辑器实例
 * @param options - 选项配置，默认 { updateSelection: true }
 * @returns 返回是否插入成功
 */
export function insertContentAt<BSchema extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema>(
    position: any,
    nodes: Node[],
    editor: LcwDocEditor<BSchema, I, S>,
    options: {
        updateSelection: boolean
    } = { updateSelection: true }
) {
    const tr = editor._tiptapEditor.state.tr

    let { from, to } = typeof position === 'number' ? { from: position, to: position } : { from: position.from, to: position.to }

    let isOnlyTextContent = true
    let isOnlyBlockContent = true

    let text = ''

    nodes.forEach(node => {
        node.check()

        if (isOnlyTextContent && node.isText && node.marks.length === 0) {
            text += node.text
        } else {
            isOnlyTextContent = false
        }

        isOnlyBlockContent = isOnlyBlockContent ? node.isBlock : false
    })

    if (from === to && isOnlyBlockContent) {
        const { parent } = tr.doc.resolve(from)
        const isEmptyTextBlock = parent.isTextblock && !parent.type.spec.code && !parent.childCount

        if (isEmptyTextBlock) {
            from -= 1
            to += 1
        }
    }

    if (isOnlyTextContent) {
        tr.insertText(text, from, to)
    } else {
        tr.replaceWith(from, to, nodes)
    }

    if (options.updateSelection) {
        selectionToInsertionEnd(tr, tr.steps.length - 1, -1)
    }

    editor.dispatch(tr)

    return true
}