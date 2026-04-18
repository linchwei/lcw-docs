/**
 * BlockGroup.ts - 块组节点定义
 *
 * 定义文档中的块组节点，用于组织多个块容器。
 * 块组可以包含一个或多个块容器节点。
 */

import { Node } from '@tiptap/core'

import { LcwDocDOMAttributes } from '../schema/index'
import { mergeCSSClasses } from '../util/browser'

/**
 * BlockGroup 节点
 *
 * 创建块组节点，用于组织和分组多个块容器。
 * - name: 节点名称为 'blockGroup'
 * - group: 属于 blockGroup 组
 * - content: 必须包含一个或多个 blockContainer
 */
export const BlockGroup = Node.create<{
    domAttributes?: LcwDocDOMAttributes
}>({
    name: 'blockGroup',
    group: 'blockGroup',
    content: 'blockContainer+',

    /**
     * 解析 HTML
     *
     * 将 HTML 元素解析为 BlockGroup 节点。
     * 通过 data-node-type 属性识别块组元素。
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

                    if (element.getAttribute('data-node-type') === 'blockGroup') {
                        return null
                    }

                    return false
                },
            },
        ]
    },

    /**
     * 渲染 HTML
     *
     * 将 BlockGroup 节点渲染为 HTML div 元素。
     * 合并默认 DOM 属性和节点属性。
     *
     * @param HTMLAttributes - 节点的 HTML 属性
     * @returns 渲染结果，包含 dom 元素和 contentDOM 元素
     */
    renderHTML({ HTMLAttributes }) {
        const blockGroupHTMLAttributes = {
            ...(this.options.domAttributes?.blockGroup || {}),
            ...HTMLAttributes,
        }
        const blockGroup = document.createElement('div')
        blockGroup.className = mergeCSSClasses('bn-block-group', blockGroupHTMLAttributes.class)
        blockGroup.setAttribute('data-node-type', 'blockGroup')
        for (const [attribute, value] of Object.entries(blockGroupHTMLAttributes)) {
            if (attribute !== 'class') {
                blockGroup.setAttribute(attribute, value)
            }
        }

        return {
            dom: blockGroup,
            contentDOM: blockGroup,
        }
    },
})
