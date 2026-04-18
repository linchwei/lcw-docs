/**
 * 内联内容内部工具函数模块
 *
 * 此文件包含内联内容的内部工具函数，用于属性转换、DOM属性添加等内部操作。
 * 这些函数主要供内联内容规范创建时使用。
 */

import { KeyboardShortcutCommand, Node } from '@tiptap/core'

import { camelToDataKebab } from '../../util/string'
import { Props, PropSchema } from '../propTypes'
import {
    CustomInlineContentConfig,
    InlineContentConfig,
    InlineContentImplementation,
    InlineContentSchemaFromSpecs,
    InlineContentSpec,
    InlineContentSpecs,
} from './types'

/**
 * 添加内联内容属性
 * 为DOM元素添加内联内容类型标识和属性
 * @param element - DOM元素
 * @param inlineContentType - 内联内容类型
 * @param inlineContentProps - 内联内容属性
 * @param propSchema - 属性模式
 * @returns 添加属性后的DOM元素
 */
export function addInlineContentAttributes<IType extends string, PSchema extends PropSchema>(
    element: {
        dom: HTMLElement
        contentDOM?: HTMLElement
    },
    inlineContentType: IType,
    inlineContentProps: Props<PSchema>,
    propSchema: PSchema
): {
    dom: HTMLElement
    contentDOM?: HTMLElement
} {
    element.dom.setAttribute('data-inline-content-type', inlineContentType)
    Object.entries(inlineContentProps)
        .filter(([prop, value]) => value !== propSchema[prop].default)
        .map(([prop, value]) => {
            return [camelToDataKebab(prop), value]
        })
        .forEach(([prop, value]) => element.dom.setAttribute(prop, value))

    if (element.contentDOM !== undefined) {
        element.contentDOM.setAttribute('data-editable', '')
    }

    return element
}

/**
 * 添加内联内容键盘快捷键
 * 为内联内容添加退格键删除支持
 * @param config - 内联内容配置
 * @returns 键盘快捷键映射
 */
export function addInlineContentKeyboardShortcuts<T extends CustomInlineContentConfig>(
    config: T
): {
    [p: string]: KeyboardShortcutCommand
} {
    return {
        Backspace: ({ editor }) => {
            const resolvedPos = editor.state.selection.$from

            return editor.state.selection.empty && resolvedPos.node().type.name === config.type && resolvedPos.parentOffset === 0
        },
    }
}

/**
 * 创建内部内联内容规范
 * 将配置和实现组合为内部内联内容规范对象
 * @param config - 内联内容配置
 * @param implementation - 内联内容实现
 * @returns 内联内容规范对象
 */
export function createInternalInlineContentSpec<T extends InlineContentConfig>(config: T, implementation: InlineContentImplementation<T>) {
    return {
        config,
        implementation,
    } satisfies InlineContentSpec<T>
}

/**
 * 从Tiptap节点创建内联内容规范
 * @param node - Tiptap节点
 * @param propSchema - 属性模式
 * @returns 内联内容规范对象
 */
export function createInlineContentSpecFromTipTapNode<T extends Node, P extends PropSchema>(node: T, propSchema: P) {
    return createInternalInlineContentSpec(
        {
            type: node.name as T['name'],
            propSchema,
            content: node.config.content === 'inline*' ? 'styled' : 'none',
        },
        {
            node,
        }
    )
}

/**
 * 从内联内容规范集合提取内联内容模式
 * @param specs - 内联内容规范集合
 * @returns 内联内容模式对象
 */
export function getInlineContentSchemaFromSpecs<T extends InlineContentSpecs>(specs: T) {
    return Object.fromEntries(Object.entries(specs).map(([key, value]) => [key, value.config])) as InlineContentSchemaFromSpecs<T>
}
