/**
 * 样式内部工具函数模块
 *
 * 此文件包含样式的内部工具函数，用于属性转换、DOM属性添加等内部操作。
 * 这些函数主要供样式规范创建时使用。
 */

import { Attributes, Mark } from '@tiptap/core'

import { StyleConfig, StyleImplementation, StylePropSchema, StyleSchemaFromSpecs, StyleSpec, StyleSpecs } from './types'

/**
 * 将样式属性模式转换为Tiptap属性
 * 根据样式属性模式创建Tiptap需要的属性配置
 * @param propSchema - 样式属性模式
 * @returns Tiptap属性配置对象
 */
export function stylePropsToAttributes(propSchema: StylePropSchema): Attributes {
    if (propSchema === 'boolean') {
        return {}
    }
    return {
        stringValue: {
            default: undefined,
            keepOnSplit: true,
            parseHTML: element => element.getAttribute('data-value'),
            renderHTML: attributes =>
                attributes.stringValue !== undefined
                    ? {
                          'data-value': attributes.stringValue,
                      }
                    : {},
        },
    }
}

/**
 * 添加样式属性
 * 为DOM元素添加样式类型标识和值
 * @param element - DOM元素
 * @param styleType - 样式类型
 * @param styleValue - 样式值
 * @param propSchema - 属性模式
 * @returns 添加属性后的DOM元素
 */
export function addStyleAttributes<SType extends string, PSchema extends StylePropSchema>(
    element: {
        dom: HTMLElement
        contentDOM?: HTMLElement
    },
    styleType: SType,
    styleValue: PSchema extends 'boolean' ? undefined : string,
    propSchema: PSchema
): {
    dom: HTMLElement
    contentDOM?: HTMLElement
} {
    element.dom.setAttribute('data-style-type', styleType)
    if (propSchema === 'string') {
        element.dom.setAttribute('data-value', styleValue as string)
    }

    if (element.contentDOM !== undefined) {
        element.contentDOM.setAttribute('data-editable', '')
    }

    return element
}

/**
 * 创建内部样式规范
 * 将配置和实现组合为内部样式规范对象
 * @param config - 样式配置
 * @param implementation - 样式实现
 * @returns 样式规范对象
 */
export function createInternalStyleSpec<T extends StyleConfig>(config: T, implementation: StyleImplementation) {
    return {
        config,
        implementation,
    } satisfies StyleSpec<T>
}

/**
 * 从Tiptap Mark创建样式规范
 * @param mark - Tiptap Mark实例
 * @param propSchema - 属性模式
 * @returns 样式规范对象
 */
export function createStyleSpecFromTipTapMark<T extends Mark, P extends StylePropSchema>(mark: T, propSchema: P) {
    return createInternalStyleSpec(
        {
            type: mark.name as T['name'],
            propSchema,
        },
        {
            mark,
        }
    )
}

/**
 * 从样式规范集合提取样式模式
 * @param specs - 样式规范集合
 * @returns 样式模式对象
 */
export function getStyleSchemaFromSpecs<T extends StyleSpecs>(specs: T) {
    return Object.fromEntries(Object.entries(specs).map(([key, value]) => [key, value.config])) as StyleSchemaFromSpecs<T>
}
