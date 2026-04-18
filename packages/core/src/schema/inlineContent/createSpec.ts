/**
 * 内联内容规范创建模块
 *
 * 此文件提供了创建内联内容规范的工厂函数，用于将内联内容配置和实现转换为完整的规范对象。
 * 内联内容是块内的文本内容，支持文本样式和链接等。
 */

import { Node } from '@tiptap/core'
import { TagParseRule } from '@tiptap/pm/model'

import { inlineContentToNodes } from '../../api/nodeConversions/blockToNode'
import { nodeToCustomInlineContent } from '../../api/nodeConversions/nodeToBlock'
import type { LcwDocEditor } from '../../editor/LcwDocEditor'
import { propsToAttributes } from '../blocks/internal'
import { Props } from '../propTypes'
import { StyleSchema } from '../styles/types'
import { addInlineContentAttributes, addInlineContentKeyboardShortcuts, createInlineContentSpecFromTipTapNode } from './internal'
import { CustomInlineContentConfig, InlineContentFromConfig, InlineContentSpec, PartialCustomInlineContentFromConfig } from './types'

/**
 * 自定义内联内容实现
 * 定义内联内容的渲染逻辑
 */
export type CustomInlineContentImplementation<T extends CustomInlineContentConfig, S extends StyleSchema> = {
    /**
     * 渲染内联内容
     * @param inlineContent - 内联内容数据
     * @param updateInlineContent - 更新内联内容的回调函数
     * @param editor - 编辑器实例
     * @returns DOM元素和可选的内容DOM
     */
    render: (
        inlineContent: InlineContentFromConfig<T, S>,
        updateInlineContent: (update: PartialCustomInlineContentFromConfig<T, S>) => void,
        editor: LcwDocEditor<any, any, S>
    ) => {
        dom: HTMLElement
        contentDOM?: HTMLElement
    }
}

/**
 * 获取内联内容解析规则
 * 生成Tiptap解析HTML时使用的规则
 * @param config - 内联内容配置
 * @returns Tiptap标签解析规则数组
 */
export function getInlineContentParseRules(config: CustomInlineContentConfig): TagParseRule[] {
    return [
        {
            tag: `[data-inline-content-type="${config.type}"]`,
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
 * 创建内联内容规范
 * 将内联内容配置和实现转换为完整的内联内容规范对象
 * @param inlineContentConfig - 内联内容配置
 * @param inlineContentImplementation - 内联内容实现
 * @returns 内联内容规范对象
 */
export function createInlineContentSpec<T extends CustomInlineContentConfig, S extends StyleSchema>(
    inlineContentConfig: T,
    inlineContentImplementation: CustomInlineContentImplementation<T, S>
): InlineContentSpec<T> {
    const node = Node.create({
        name: inlineContentConfig.type,
        inline: true,
        group: 'inline',
        selectable: inlineContentConfig.content === 'styled',
        atom: inlineContentConfig.content === 'none',
        content: (inlineContentConfig.content === 'styled' ? 'inline*' : '') as T['content'] extends 'styled' ? 'inline*' : '',

        addAttributes() {
            return propsToAttributes(inlineContentConfig.propSchema)
        },

        addKeyboardShortcuts() {
            return addInlineContentKeyboardShortcuts(inlineContentConfig)
        },

        parseHTML() {
            return getInlineContentParseRules(inlineContentConfig)
        },

        renderHTML({ node }) {
            const editor = this.options.editor

            const output = inlineContentImplementation.render(
                nodeToCustomInlineContent(
                    node,
                    editor.schema.inlineContentSchema,
                    editor.schema.styleSchema
                ) as any as InlineContentFromConfig<T, S>,
                () => {
                },
                editor
            )

            return addInlineContentAttributes(
                output,
                inlineContentConfig.type,
                node.attrs as Props<T['propSchema']>,
                inlineContentConfig.propSchema
            )
        },

        addNodeView() {
            return ({ node, getPos }) => {
                const editor = this.options.editor

                const output = inlineContentImplementation.render(
                    nodeToCustomInlineContent(
                        node,
                        editor.schema.inlineContentSchema,
                        editor.schema.styleSchema
                    ) as any as InlineContentFromConfig<T, S>,
                    update => {
                        if (typeof getPos === 'boolean') {
                            return
                        }

                        const content = inlineContentToNodes([update], editor._tiptapEditor.schema, editor.schema.styleSchema)

                        editor._tiptapEditor.view.dispatch(
                            editor._tiptapEditor.view.state.tr.replaceWith(getPos(), getPos() + node.nodeSize, content)
                        )
                    },
                    editor
                )

                return addInlineContentAttributes(
                    output,
                    inlineContentConfig.type,
                    node.attrs as Props<T['propSchema']>,
                    inlineContentConfig.propSchema
                )
            }
        },
    })

    return createInlineContentSpecFromTipTapNode(node, inlineContentConfig.propSchema) as InlineContentSpec<T>
}
