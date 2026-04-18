/**
 * 背景颜色标记（行内级）
 *
 * 该扩展为行内文本提供背景颜色样式支持。
 * 通过创建 TipTap Mark 实现，允许对选中的文本片段设置背景颜色。
 */

import { Mark } from '@tiptap/core'

import { createStyleSpecFromTipTapMark } from '../../schema/index'

/**
 * 背景颜色标记
 *
 * 该标记允许对文档中的特定文本设置背景颜色。
 * 主要功能：
 * - 存储颜色值到 stringValue 属性
 * - 通过 data-background-color 属性在HTML中渲染
 * - 支持从HTML解析颜色值
 */
const BackgroundColorMark = Mark.create({
    name: 'backgroundColor',

    /**
     * 添加标记属性
     *
     * @returns 属性配置对象，包含：
     * - stringValue: 存储颜色的字符串值，从 data-background-color 属性解析
     */
    addAttributes() {
        return {
            stringValue: {
                default: undefined,
                parseHTML: element => element.getAttribute('data-background-color'),
                renderHTML: attributes => ({
                    'data-background-color': attributes.stringValue,
                }),
            },
        }
    },

    /**
     * 解析HTML配置
     *
     * 定义如何从HTML元素解析标记：
     * - 匹配 <span> 标签
     * - 检查是否存在 data-background-color 属性
     * - 返回属性值作为 stringValue
     */
    parseHTML() {
        return [
            {
                tag: 'span',
                getAttrs: element => {
                    if (typeof element === 'string') {
                        return false
                    }

                    if (element.hasAttribute('data-background-color')) {
                        return {
                            stringValue: element.getAttribute('data-background-color'),
                        }
                    }

                    return false
                },
            },
        ]
    },

    /**
     * 渲染HTML
     *
     * 将标记渲染为带有相应属性的 <span> 元素
     *
     * @param HTMLAttributes - 包含 data-background-color 属性的对象
     * @returns 渲染后的HTML数组
     */
    renderHTML({ HTMLAttributes }) {
        return ['span', HTMLAttributes, 0]
    },
})

/**
 * 背景颜色样式规范
 *
 * 通过 createStyleSpecFromTipTapMark 从 BackgroundColorMark 创建，
 * 用于样式schema注册和管理
 */
export const BackgroundColor = createStyleSpecFromTipTapMark(BackgroundColorMark, 'string')
