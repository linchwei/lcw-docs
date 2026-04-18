/**
 * 块规范创建模块
 *
 * 此文件提供了创建块规范的工厂函数，用于将块配置和实现转换为完整的块规范。
 * 块规范是编辑器中定义块行为和渲染逻辑的核心接口。
 */

import { Editor } from '@tiptap/core'
import { TagParseRule } from '@tiptap/pm/model'
import { NodeView } from '@tiptap/pm/view'

import type { LcwDocEditor } from '../../editor/LcwDocEditor'
import { InlineContentSchema } from '../inlineContent/types'
import { StyleSchema } from '../styles/types'
import {
    createInternalBlockSpec,
    createStronglyTypedTiptapNode,
    getBlockFromPos,
    propsToAttributes,
    wrapInBlockStructure,
} from './internal'
import { BlockConfig, BlockFromConfig, BlockSchemaWithBlock, PartialBlockFromConfig } from './types'

/**
 * 自定义块配置
 * 仅支持内联内容或无内容的块类型
 */
export type CustomBlockConfig = BlockConfig & {
    content: 'inline' | 'none'
}

/**
 * 自定义块实现
 * 定义块的渲染和解析逻辑
 */
export type CustomBlockImplementation<T extends CustomBlockConfig, I extends InlineContentSchema, S extends StyleSchema> = {
    /**
     * 渲染块内容
     * @param block - 完整的块数据
     * @param editor - 编辑器实例
     * @returns DOM元素和可选的内容DOM
     */
    render: (
        block: BlockFromConfig<T, I, S>,
        editor: LcwDocEditor<BlockSchemaWithBlock<T['type'], T>, I, S>
    ) => {
        dom: HTMLElement
        contentDOM?: HTMLElement
        destroy?: () => void
    }
    /**
     * 转换为外部HTML（用于复制/粘贴）
     * @param block - 完整的块数据
     * @param editor - 编辑器实例
     * @returns DOM元素和可选的内容DOM
     */
    toExternalHTML?: (
        block: BlockFromConfig<T, I, S>,
        editor: LcwDocEditor<BlockSchemaWithBlock<T['type'], T>, I, S>
    ) => {
        dom: HTMLElement
        contentDOM?: HTMLElement
    }
    /**
     * 从DOM元素解析块属性
     * @param el - DOM元素
     * @returns 解析后的部分块属性
     */
    parse?: (el: HTMLElement) => PartialBlockFromConfig<T, I, S>['props'] | undefined
}

/**
 * 应用不可选中块修复
 * 当块的isSelectable设置为false时，防止块被选中
 * @param nodeView - Tiptap节点视图
 * @param editor - Tiptap编辑器实例
 */
export function applyNonSelectableBlockFix(nodeView: NodeView, editor: Editor) {
    nodeView.stopEvent = event => {
        if (event.type === 'mousedown') {
            setTimeout(() => {
                editor.view.dom.blur()
            }, 10)
        }

        return true
    }
}

/**
 * 获取解析规则
 * 生成Tiptap解析HTML时使用的规则
 * @param config - 块配置
 * @param customParseFunction - 自定义解析函数
 * @returns Tiptap标签解析规则数组
 */
export function getParseRules(config: BlockConfig, customParseFunction: CustomBlockImplementation<any, any, any>['parse']) {
    const rules: TagParseRule[] = [
        {
            tag: '[data-content-type=' + config.type + ']',
            contentElement: '[data-editable]',
        },
    ]

    if (customParseFunction) {
        rules.push({
            tag: '*',
            getAttrs(node: string | HTMLElement) {
                if (typeof node === 'string') {
                    return false
                }

                const props = customParseFunction?.(node)

                if (props === undefined) {
                    return false
                }

                return props
            },
        })
    }

    return rules
}

/**
 * 创建块规范
 * 将块配置和实现转换为完整的块规范对象
 * @param blockConfig - 块配置
 * @param blockImplementation - 块实现
 * @returns 块规范对象
 */
export function createBlockSpec<T extends CustomBlockConfig, I extends InlineContentSchema, S extends StyleSchema>(
    blockConfig: T,
    blockImplementation: CustomBlockImplementation<T, I, S>
) {
    const node = createStronglyTypedTiptapNode({
        name: blockConfig.type as T['type'],
        content: (blockConfig.content === 'inline' ? 'inline*' : '') as T['content'] extends 'inline' ? 'inline*' : '',
        group: 'blockContent',
        selectable: blockConfig.isSelectable ?? true,

        addAttributes() {
            return propsToAttributes(blockConfig.propSchema)
        },

        parseHTML() {
            return getParseRules(blockConfig, blockImplementation.parse)
        },

        renderHTML({ HTMLAttributes }) {
            const div = document.createElement('div')
            return wrapInBlockStructure(
                {
                    dom: div,
                    contentDOM: blockConfig.content === 'inline' ? div : undefined,
                },
                blockConfig.type,
                {},
                blockConfig.propSchema,
                blockConfig.isFileBlock,
                HTMLAttributes
            )
        },

        addNodeView() {
            return ({ getPos }) => {
                const editor = this.options.editor
                const block = getBlockFromPos(getPos, editor, this.editor, blockConfig.type)
                const blockContentDOMAttributes = this.options.domAttributes?.blockContent || {}

                const output = blockImplementation.render(block as any, editor)

                const nodeView: NodeView = wrapInBlockStructure(
                    output,
                    block.type,
                    block.props,
                    blockConfig.propSchema,
                    blockContentDOMAttributes
                )

                if (blockConfig.isSelectable === false) {
                    applyNonSelectableBlockFix(nodeView, this.editor)
                }

                return nodeView
            }
        },
    })

    if (node.name !== blockConfig.type) {
        throw new Error('Node name does not match block type. This is a bug in LcwDoc.')
    }

    return createInternalBlockSpec(blockConfig, {
        node,
        toInternalHTML: (block, editor) => {
            const blockContentDOMAttributes = node.options.domAttributes?.blockContent || {}

            const output = blockImplementation.render(block as any, editor as any)

            return wrapInBlockStructure(
                output,
                block.type,
                block.props,
                blockConfig.propSchema,
                blockConfig.isFileBlock,
                blockContentDOMAttributes
            )
        },
        toExternalHTML: (block, editor) => {
            const blockContentDOMAttributes = node.options.domAttributes?.blockContent || {}

            let output = blockImplementation.toExternalHTML?.(block as any, editor as any)
            if (output === undefined) {
                output = blockImplementation.render(block as any, editor as any)
            }
            return wrapInBlockStructure(output, block.type, block.props, blockConfig.propSchema, blockContentDOMAttributes)
        },
    })
}
