/**
 * Doc.ts - 文档根节点定义
 *
 * 定义文档的根节点，是整个文档结构的最顶层节点。
 * 文档节点只能包含 blockGroup 类型的子节点。
 */

import { Node } from '@tiptap/core'

/**
 * Doc 节点
 *
 * 创建文档的根节点，作为 TipTap 编辑器的顶级节点。
 * - name: 节点名称为 'doc'
 * - topNode: 表示这是顶级节点
 * - content: 指定只能包含 blockGroup 类型的子节点
 */
export const Doc = Node.create({
    name: 'doc',
    topNode: true,
    content: 'blockGroup',
})
