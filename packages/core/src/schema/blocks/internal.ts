/**
 * 块内部类型和工具函数模块
 *
 * 此文件包含块的内部类型定义和工具函数，用于块的属性转换、DOM结构包装等内部操作。
 * 这些函数主要供块规范创建时使用，不直接对外暴露。
 */

import { Attribute, Attributes, Editor, Extension, Node, NodeConfig } from '@tiptap/core'

import { defaultBlockToHTML } from '../../blocks/defaultBlockHelpers'
import { inheritedProps } from '../../blocks/defaultProps'
import type { LcwDocEditor } from '../../editor/LcwDocEditor'
import { mergeCSSClasses } from '../../util/browser'
import { camelToDataKebab } from '../../util/string'
import { InlineContentSchema } from '../inlineContent/types'
import { Props, PropSchema } from '../propTypes'
import { StyleSchema } from '../styles/types'
import {
    BlockConfig,
    BlockSchemaFromSpecs,
    BlockSchemaWithBlock,
    BlockSpec,
    BlockSpecs,
    SpecificBlock,
    TiptapBlockImplementation,
} from './types'

/**
 * 将属性模式转换为Tiptap属性
 * 根据属性模式定义创建Tiptap编辑器需要的属性配置
 * @param propSchema - 属性模式定义
 * @returns Tiptap属性配置对象
 */
export function propsToAttributes(propSchema: PropSchema): Attributes {
    const tiptapAttributes: Record<string, Attribute> = {}

    Object.entries(propSchema)
        .filter(([name]) => !inheritedProps.includes(name))
        .forEach(([name, spec]) => {
            tiptapAttributes[name] = {
                default: spec.default,
                keepOnSplit: true,
                parseHTML: element => {
                    const value = element.getAttribute(camelToDataKebab(name))

                    if (value === null) {
                        return null
                    }

                    if (typeof spec.default === 'boolean') {
                        if (value === 'true') {
                            return true
                        }

                        if (value === 'false') {
                            return false
                        }

                        return null
                    }

                    if (typeof spec.default === 'number') {
                        const asNumber = parseFloat(value)
                        const isNumeric = !Number.isNaN(asNumber) && Number.isFinite(asNumber)

                        if (isNumeric) {
                            return asNumber
                        }

                        return null
                    }

                    return value
                },
                renderHTML: attributes =>
                    attributes[name] !== spec.default
                        ? {
                              [camelToDataKebab(name)]: attributes[name],
                          }
                        : {},
            }
        })

    return tiptapAttributes
}

/**
 * 从位置获取块
 * 根据Tiptap编辑器的位置信息获取对应的块数据
 * @param getPos - 获取位置的函数或布尔值
 * @param editor - LCW文档编辑器实例
 * @param tipTapEditor - Tiptap编辑器实例
 * @param type - 期望的块类型
 * @returns 特定类型的块数据
 */
export function getBlockFromPos<
    BType extends string,
    Config extends BlockConfig,
    BSchema extends BlockSchemaWithBlock<BType, Config>,
    I extends InlineContentSchema,
    S extends StyleSchema,
>(getPos: (() => number) | boolean, editor: LcwDocEditor<BSchema, I, S>, tipTapEditor: Editor, type: BType) {
    if (typeof getPos === 'boolean') {
        throw new Error('Cannot find node position as getPos is a boolean, not a function.')
    }
    const pos = getPos()
    const blockContainer = tipTapEditor.state.doc.resolve(pos!).node()
    const blockIdentifier = blockContainer.attrs.id

    if (!blockIdentifier) {
        throw new Error("Block doesn't have id")
    }

    const block = editor.getBlock(blockIdentifier)! as SpecificBlock<BSchema, BType, I, S>
    if (block.type !== type) {
        throw new Error('Block type does not match')
    }

    return block
}

/**
 * 包装块结构
 * 将元素包装在块结构DOM中，添加必要的属性和类名
 * @param element - 要包装的元素
 * @param blockType - 块类型
 * @param blockProps - 块属性
 * @param propSchema - 属性模式
 * @param isFileBlock - 是否为文件块
 * @param domAttributes - DOM属性
 * @returns 包装后的DOM元素
 */
export function wrapInBlockStructure<BType extends string, PSchema extends PropSchema>(
    element: {
        dom: HTMLElement
        contentDOM?: HTMLElement
        destroy?: () => void
    },
    blockType: BType,
    blockProps: Props<PSchema>,
    propSchema: PSchema,
    isFileBlock = false,
    domAttributes?: Record<string, string>
): {
    dom: HTMLElement
    contentDOM?: HTMLElement
    destroy?: () => void
} {
    const blockContent = document.createElement('div')

    if (domAttributes !== undefined) {
        for (const [attr, value] of Object.entries(domAttributes)) {
            if (attr !== 'class') {
                blockContent.setAttribute(attr, value)
            }
        }
    }

    blockContent.className = mergeCSSClasses('bn-block-content', domAttributes?.class || '')

    blockContent.setAttribute('data-content-type', blockType)

    for (const [prop, value] of Object.entries(blockProps)) {
        if (!inheritedProps.includes(prop) && value !== propSchema[prop].default) {
            blockContent.setAttribute(camelToDataKebab(prop), value)
        }
    }

    if (isFileBlock) {
        blockContent.setAttribute('data-file-block', '')
    }

    blockContent.appendChild(element.dom)

    if (element.contentDOM !== undefined) {
        element.contentDOM.className = mergeCSSClasses('bn-inline-content', element.contentDOM.className)
        element.contentDOM.setAttribute('data-editable', '')
    }

    return {
        ...element,
        dom: blockContent,
    }
}

/**
 * 强类型Tiptap节点
 * 具有确定类型信息的Tiptap节点
 */
type StronglyTypedTipTapNode<Name extends string, Content extends 'inline*' | 'tableRow+' | ''> = Node & {
    name: Name
    config: { content: Content }
}

/**
 * 创建强类型Tiptap节点
 * @param config - 节点配置
 * @returns 具有确定类型的Tiptap节点
 */
export function createStronglyTypedTiptapNode<Name extends string, Content extends 'inline*' | 'tableRow+' | ''>(
    config: NodeConfig & { name: Name; content: Content }
) {
    return Node.create(config) as StronglyTypedTipTapNode<Name, Content>
}

/**
 * 创建内部块规范
 * 将配置和实现组合为内部块规范对象
 * @param config - 块配置
 * @param implementation - 块实现
 * @returns 块规范对象
 */
export function createInternalBlockSpec<T extends BlockConfig>(
    config: T,
    implementation: TiptapBlockImplementation<T, any, InlineContentSchema, StyleSchema>
) {
    return {
        config,
        implementation,
    } satisfies BlockSpec<T, any, InlineContentSchema, StyleSchema>
}

/**
 * 从强类型Tiptap节点创建块规范
 * @param node - Tiptap节点
 * @param propSchema - 属性模式
 * @param requiredExtensions - 需要的扩展
 * @returns 块规范对象
 */
export function createBlockSpecFromStronglyTypedTiptapNode<T extends Node, P extends PropSchema>(
    node: T,
    propSchema: P,
    requiredExtensions?: Array<Extension | Node>
) {
    return createInternalBlockSpec(
        {
            type: node.name as T['name'],
            content: (node.config.content === 'inline*'
                ? 'inline'
                : node.config.content === 'tableRow+'
                  ? 'table'
                  : 'none') as T['config']['content'] extends 'inline*'
                ? 'inline'
                : T['config']['content'] extends 'tableRow+'
                  ? 'table'
                  : 'none',
            propSchema,
        },
        {
            node,
            requiredExtensions,
            toInternalHTML: defaultBlockToHTML,
            toExternalHTML: defaultBlockToHTML,
        }
    )
}

/**
 * 从块规范集合提取块模式
 * @param specs - 块规范集合
 * @returns 块模式对象
 */
export function getBlockSchemaFromSpecs<T extends BlockSpecs>(specs: T) {
    return Object.fromEntries(Object.entries(specs).map(([key, value]) => [key, value.config])) as BlockSchemaFromSpecs<T>
}
