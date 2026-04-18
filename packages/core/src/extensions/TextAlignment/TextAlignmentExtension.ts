/**
 * 文本对齐扩展
 *
 * 该扩展为多种文本块类型提供文本对齐功能支持。
 * 支持左对齐、居中对齐、右对齐和两端对齐。
 */

import { Extension } from '@tiptap/core'

/**
 * 文本对齐扩展
 *
 * 该扩展为以下节点类型添加文本对齐属性：
 * - paragraph (段落)
 * - heading (标题)
 * - bulletListItem (无序列表项)
 * - numberedListItem (有序列表项)
 * - checkListItem (任务列表项)
 *
 * 对齐方式通过 data-text-alignment 属性存储。
 */
export const TextAlignmentExtension = Extension.create({
    name: 'textAlignment',

    /**
     * 添加全局属性配置
     *
     * 配置说明：
     * - types: 应用于多种文本块类型
     * - attributes.textAlignment: 文本对齐属性
     *   - default: 默认值为 'left' (左对齐)
     *   - parseHTML: 从DOM元素的 data-text-alignment 属性解析
     *   - renderHTML: 渲染对齐属性到HTML，非左对齐时输出属性
     */
    addGlobalAttributes() {
        return [
            {
                types: ['paragraph', 'heading', 'bulletListItem', 'numberedListItem', 'checkListItem'],
                attributes: {
                    textAlignment: {
                        default: 'left',
                        parseHTML: element => {
                            return element.getAttribute('data-text-alignment')
                        },
                        renderHTML: attributes => {
                            if (attributes.textAlignment === 'left') {
                                return {}
                            }
                            return {
                                'data-text-alignment': attributes.textAlignment,
                            }
                        },
                    },
                },
            },
        ]
    },
})
