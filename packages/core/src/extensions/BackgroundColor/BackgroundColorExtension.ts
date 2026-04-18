/**
 * 背景颜色扩展（块级）
 *
 * 该扩展为块级容器节点提供背景颜色属性支持。
 * 通过全局属性配置，使blockContainer节点能够存储和渲染背景颜色。
 */

import { Extension } from '@tiptap/core'

import { defaultProps } from '../../blocks/defaultProps'

/**
 * 背景颜色扩展（块级）
 *
 * 该扩展负责：
 * - 为 blockContainer 节点类型添加 backgroundColor 全局属性
 * - 定义属性的默认值、HTML解析和渲染逻辑
 * - 通过 data-background-color 属性在HTML中存储颜色值
 */
export const BackgroundColorExtension = Extension.create({
    name: 'blockBackgroundColor',

    /**
     * 添加全局属性配置
     *
     * 配置说明：
     * - types: 应用于 blockContainer 节点类型
     * - attributes.backgroundColor: 背景颜色属性
     *   - default: 默认颜色值（继承自 defaultProps）
     *   - parseHTML: 从DOM元素解析颜色值
     *   - renderHTML: 将颜色值渲染为 data-background-color 属性
     */
    addGlobalAttributes() {
        return [
            {
                types: ['blockContainer'],
                attributes: {
                    backgroundColor: {
                        default: defaultProps.backgroundColor.default,
                        parseHTML: element =>
                            element.hasAttribute('data-background-color')
                                ? element.getAttribute('data-background-color')
                                : defaultProps.backgroundColor.default,
                        renderHTML: attributes => {
                            if (attributes.backgroundColor === defaultProps.backgroundColor.default) {
                                return {}
                            }
                            return {
                                'data-background-color': attributes.backgroundColor,
                            }
                        },
                    },
                },
            },
        ]
    },
})
