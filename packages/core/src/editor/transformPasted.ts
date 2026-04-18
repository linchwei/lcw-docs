/**
 * transformPasted.ts
 *
 * 粘贴转换处理模块。
 * 负责处理从外部粘贴内容时的转换逻辑，包括：
 * - 表格行的自动包装
 * - 列表项与区块容器的正确嵌套
 * - 确保粘贴内容符合编辑器的 Schema 规范
 */

import { Fragment, Schema, Slice } from '@tiptap/pm/model'
import { EditorView } from '@tiptap/pm/view'

/**
 * 从 Fragment 中移除指定位置的子节点
 *
 * @param node - 父 Fragment
 * @param n - 要移除的子节点索引
 * @returns 移除指定节点后的新 Fragment
 */
function removeChild(node: Fragment, n: number) {
    const children: any[] = []
    node.forEach((child, _, i) => {
        if (i !== n) {
            children.push(child)
        }
    })
    return Fragment.from(children)
}

/**
 * 包装游离的表格行
 *
 * 当粘贴的表格行不在表格内时，此函数会将它们包装成完整的表格。
 * 逻辑：如果一个表格行前面有表格，则将其添加到前一个表格；
 * 否则创建一个新的表格包含该行。
 *
 * @param f - Fragment
 * @param schema - ProseMirror Schema
 * @returns 转换后的 Fragment
 */
export function wrapTableRows(f: Fragment, schema: Schema) {
    const newItems: any[] = []

    for (let i = 0; i < f.childCount; i++) {
        const child = f.child(i)

        if (child.type.name === 'tableRow') {
            if (newItems.length > 0 && newItems[newItems.length - 1].type.name === 'table') {
                // 前一个元素是表格，将当前行添加到该表格
                const prevTable = newItems[newItems.length - 1]
                const newTable = prevTable.copy(prevTable.content.addToEnd(child))
                newItems[newItems.length - 1] = newTable
            } else {
                // 创建一个新表格包含当前行
                const newTable = schema.nodes.table.create(undefined, child)
                newItems.push(newTable)
            }
        } else {
            // 非表格行，直接添加
            newItems.push(child)
        }
    }

    f = Fragment.from(newItems)
    return f
}

/**
 * 转换粘贴内容
 *
 * 处理外部粘贴的 Fragment，转换为符合编辑器 Schema 的内容。
 * 主要处理：
 * 1. 游离的表格行包装成表格
 * 2. 列表项（bulletListItem、numberedListItem、checkListItem）与相邻的 blockGroup 合并
 * 3. 将内容包裹在 blockContainer 中
 *
 * @param slice - 要转换的粘贴切片
 * @param view - 编辑器视图
 * @returns 转换后的新切片
 */
export function transformPasted(slice: Slice, view: EditorView) {
    let f = Fragment.from(slice.content)

    // 处理游离的表格行
    f = wrapTableRows(f, view.state.schema)

    // 遍历片段，处理列表项和区块容器
    for (let i = 0; i < f.childCount; i++) {
        // 检查是否是块内容节点
        if (f.child(i).type.spec.group === 'blockContent') {
            const content = [f.child(i)]

            // 检查下一个元素是否是 blockGroup
            if (i + 1 < f.childCount && f.child(i + 1).type.spec.group === 'blockGroup') {
                const nestedChild = f
                    .child(i + 1)
                    .child(0)
                    .child(0)

                // 如果 blockGroup 内的第一个区块是列表项，则合并
                if (
                    nestedChild.type.name === 'bulletListItem' ||
                    nestedChild.type.name === 'numberedListItem' ||
                    nestedChild.type.name === 'checkListItem'
                ) {
                    content.push(f.child(i + 1))
                    // 从 Fragment 中移除已合并的 blockGroup
                    f = removeChild(f, i + 1)
                }
            }

            // 将内容包裹在 blockContainer 中
            const container = view.state.schema.nodes.blockContainer.create(undefined, content)
            f = f.replaceChild(i, container)
        }
    }

    return new Slice(f, slice.openStart, slice.openEnd)
}
