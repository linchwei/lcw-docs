/**
 * BlockContainer.ts - 块容器节点定义
 *
 * 定义文档中的块容器节点，用于包装和组织块级内容。
 * 块容器可以包含 blockContent 和可选的 blockGroup。
 */

import { Node } from '@tiptap/core'

import type { LcwDocEditor } from '../editor/LcwDocEditor'
import { LcwDocDOMAttributes } from '../schema/index'
import { mergeCSSClasses } from '../util/browser'

/**
 * 块属性映射表
 *
 * 定义 HTML 属性与节点属性之间的映射关系：
 * - blockColor: 块背景颜色
 * - blockStyle: 块样式
 * - id: 块唯一标识
 * - depth: 块深度级别
 * - depthChange: 深度变化标记
 */
const BlockAttributes: Record<string, string> = {
    blockColor: 'data-block-color',
    blockStyle: 'data-block-style',
    id: 'data-id',
    depth: 'data-depth',
    depthChange: 'data-depth-change',
}

/**
 * BlockContainer 节点
 *
 * 创建块容器节点，用于包装和组织块级内容。
 * - name: 节点名称为 'blockContainer'
 * - group: 属于 blockContainer 组
 * - content: 可以包含 blockContent 和可选的 blockGroup
 * - priority: 解析优先级为 50
 * - defining: 表示此节点是定义性节点
 */
export const BlockContainer = Node.create<{
    domAttributes?: LcwDocDOMAttributes
    editor: LcwDocEditor<any, any, any>
}>({
    name: 'blockContainer',
    group: 'blockContainer',
    content: 'blockContent blockGroup?',
    priority: 50,
    defining: true,

    /**
     * 解析 HTML
     *
     * 将 HTML 元素解析为 BlockContainer 节点。
     * 从 div 元素中提取块属性（颜色、样式、ID、深度等）。
     *
     * @returns 解析规则数组，包含标签名和属性提取函数
     */
    parseHTML() {
        return [
            {
                tag: 'div',
                getAttrs: element => {
                    if (typeof element === 'string') {
                        return false
                    }

                    const attrs: Record<string, string> = {}
                    for (const [nodeAttr, HTMLAttr] of Object.entries(BlockAttributes)) {
                        if (element.getAttribute(HTMLAttr)) {
                            attrs[nodeAttr] = element.getAttribute(HTMLAttr)!
                        }
                    }

                    if (element.getAttribute('data-node-type') === 'blockContainer') {
                        return attrs
                    }

                    return false
                },
            },
        ]
    },

    /**
     * 渲染 HTML
     *
     * 将 BlockContainer 节点渲染为 HTML 结构。
     * 创建双层 div 结构：外层为 blockOuter，内层为 block。
     * 合并默认 DOM 属性和节点属性。
     *
     * @param HTMLAttributes - 节点的 HTML 属性
     * @returns 渲染结果，包含 dom 元素和 contentDOM 元素
     */
    renderHTML({ HTMLAttributes }) {
        const blockOuter = document.createElement('div')
        blockOuter.className = 'bn-block-outer'
        blockOuter.setAttribute('data-node-type', 'blockOuter')
        for (const [attribute, value] of Object.entries(HTMLAttributes)) {
            if (attribute !== 'class') {
                blockOuter.setAttribute(attribute, value)
            }
        }

        const blockHTMLAttributes = {
            ...(this.options.domAttributes?.block || {}),
            ...HTMLAttributes,
        }
        const block = document.createElement('div')
        block.className = mergeCSSClasses('bn-block', blockHTMLAttributes.class)
        block.setAttribute('data-node-type', this.name)
        for (const [attribute, value] of Object.entries(blockHTMLAttributes)) {
            if (attribute !== 'class') {
                block.setAttribute(attribute, value)
            }
        }

        blockOuter.appendChild(block)

        return {
            dom: blockOuter,
            contentDOM: block,
        }
    },
})
