/**
 * 默认块辅助函数模块
 * 提供块到 DOM 和 HTML 的转换辅助函数
 */
import { blockToNode } from '../api/nodeConversions/blockToNode'
import type { LcwDocEditor } from '../editor/LcwDocEditor'
import type { BlockNoDefaults, BlockSchema, InlineContentSchema, StyleSchema } from '../schema/index'
import { mergeCSSClasses } from '../util/browser'

/**
 * 创建默认的块 DOM 输出规范
 * 生成块的 DOM 结构和内容 DOM 元素
 * @param blockName - 块类型名称
 * @param htmlTag - 内联内容的 HTML 标签
 * @param blockContentHTMLAttributes - 块内容层的 HTML 属性
 * @param inlineContentHTMLAttributes - 内联内容层的 HTML 属性
 * @returns 包含 dom 和 contentDOM 的对象
 */
export function createDefaultBlockDOMOutputSpec(
    blockName: string,
    htmlTag: string,
    blockContentHTMLAttributes: Record<string, string>,
    inlineContentHTMLAttributes: Record<string, string>
) {
    const blockContent = document.createElement('div')
    blockContent.className = mergeCSSClasses('bn-block-content', blockContentHTMLAttributes.class)
    blockContent.setAttribute('data-content-type', blockName)
    for (const [attribute, value] of Object.entries(blockContentHTMLAttributes)) {
        if (attribute !== 'class') {
            blockContent.setAttribute(attribute, value)
        }
    }

    const inlineContent = document.createElement(htmlTag)
    inlineContent.className = mergeCSSClasses('bn-inline-content', inlineContentHTMLAttributes.class)
    for (const [attribute, value] of Object.entries(inlineContentHTMLAttributes)) {
        if (attribute !== 'class') {
            inlineContent.setAttribute(attribute, value)
        }
    }

    blockContent.appendChild(inlineContent)

    return {
        dom: blockContent,
        contentDOM: inlineContent,
    }
}

/**
 * 将块转换为默认 HTML 表示
 * 使用 TipTap 节点的 toDOM 方法进行转换
 * @param block - 要转换的块
 * @param editor - 编辑器实例
 * @returns 包含 dom 和可选 contentDOM 的对象
 */
export const defaultBlockToHTML = <BSchema extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema>(
    block: BlockNoDefaults<BSchema, I, S>,
    editor: LcwDocEditor<BSchema, I, S>
): {
    dom: HTMLElement
    contentDOM?: HTMLElement
} => {
    const node = blockToNode(block, editor.pmSchema, editor.schema.styleSchema).firstChild!
    const toDOM = editor.pmSchema.nodes[node.type.name].spec.toDOM

    if (toDOM === undefined) {
        throw new Error("This block has no default HTML serialization as its corresponding TipTap node doesn't implement `renderHTML`.")
    }

    const renderSpec = toDOM(node)

    if (typeof renderSpec !== 'object' || !('dom' in renderSpec)) {
        throw new Error(
            "Cannot use this block's default HTML serialization as its corresponding TipTap node's `renderHTML` function does not return an object with the `dom` property."
        )
    }

    return renderSpec as {
        dom: HTMLElement
        contentDOM?: HTMLElement
    }
}
