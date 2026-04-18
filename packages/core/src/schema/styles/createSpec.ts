/**
 * 样式规范创建模块
 *
 * 此文件提供了创建样式规范的工厂函数，用于将样式配置和实现转换为完整的样式规范对象。
 * 样式用于内联内容的格式化，如加粗、斜体、颜色等。
 */

import { Mark } from '@tiptap/core'
import { ParseRule } from '@tiptap/pm/model'

import { UnreachableCaseError } from '../../util/typescript'
import { addStyleAttributes, createInternalStyleSpec, stylePropsToAttributes } from './internal'
import { StyleConfig, StyleSpec } from './types'

/**
 * 渲染函数类型定义
 */
interface BaseStyleRender {
    dom: HTMLElement
    contentDOM?: HTMLElement
}

/**
 * 自定义样式实现
 * 根据属性模式类型决定渲染函数的签名
 */
export type CustomStyleImplementation<T extends StyleConfig> = {
    /**
     * 渲染函数
     * 布尔类型样式不需要参数，字符串类型需要值参数
     */
    render: T['propSchema'] extends 'boolean' ? () => BaseStyleRender : (value: string) => BaseStyleRender
}

/**
 * 获取样式解析规则
 * 生成Tiptap解析HTML时使用的规则
 * @param config - 样式配置
 * @returns Tiptap解析规则数组
 */
export function getStyleParseRules(config: StyleConfig): ParseRule[] {
    return [
        {
            tag: `[data-style-type="${config.type}"]`,
            contentElement: element => {
                const htmlElement = element as HTMLElement

                if (htmlElement.matches('[data-editable]')) {
                    return htmlElement
                }

                return htmlElement.querySelector('[data-editable]') || htmlElement
            },
        },
    ]
}

/**
 * 创建样式规范
 * 将样式配置和实现转换为完整的样式规范对象
 * @param styleConfig - 样式配置
 * @param styleImplementation - 样式实现
 * @returns 样式规范对象
 */
export function createStyleSpec<T extends StyleConfig>(styleConfig: T, styleImplementation: CustomStyleImplementation<T>): StyleSpec<T> {
    const mark = Mark.create({
        name: styleConfig.type,

        addAttributes() {
            return stylePropsToAttributes(styleConfig.propSchema)
        },

        parseHTML() {
            return getStyleParseRules(styleConfig)
        },

        renderHTML({ mark }) {
            let renderResult: {
                dom: HTMLElement
                contentDOM?: HTMLElement
            }

            if (styleConfig.propSchema === 'boolean') {
                renderResult = (styleImplementation.render as () => BaseStyleRender)()
            } else if (styleConfig.propSchema === 'string') {
                renderResult = (styleImplementation.render as (value: string) => BaseStyleRender)(mark.attrs.stringValue)
            } else {
                throw new UnreachableCaseError(styleConfig.propSchema)
            }

            return addStyleAttributes(renderResult, styleConfig.type, mark.attrs.stringValue, styleConfig.propSchema)
        },
    })

    return createInternalStyleSpec(styleConfig, {
        mark,
    })
}
