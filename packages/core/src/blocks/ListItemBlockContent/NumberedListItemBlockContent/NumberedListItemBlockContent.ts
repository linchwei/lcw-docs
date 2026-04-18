/**
 * 有序列表项块内容模块
 * 定义编辑器中的有序列表项，支持自动序号
 */
import { InputRule } from '@tiptap/core'

import { updateBlockCommand } from '../../../api/blockManipulation/commands/updateBlock/updateBlock'
import { getBlockInfoFromSelection } from '../../../api/getBlockInfoFromPos'
import { createBlockSpecFromStronglyTypedTiptapNode, createStronglyTypedTiptapNode, PropSchema } from '../../../schema/index'
import { createDefaultBlockDOMOutputSpec } from '../../defaultBlockHelpers'
import { defaultProps } from '../../defaultProps'
import { handleEnter } from '../ListItemKeyboardShortcuts'
import { NumberedListIndexingPlugin } from './NumberedListIndexingPlugin'

/**
 * 有序列表项块的属性模式定义
 */
export const numberedListItemPropSchema = {
    ...defaultProps,
} satisfies PropSchema

/**
 * 有序列表项块的 TipTap 节点定义
 */
const NumberedListItemBlockContent = createStronglyTypedTiptapNode({
    name: 'numberedListItem',
    content: 'inline*',
    group: 'blockContent',
    priority: 90,

    /**
     * 定义有序列表项的属性
     * index 属性存储当前列表项的序号
     */
    addAttributes() {
        return {
            index: {
                default: null,
                parseHTML: element => element.getAttribute('data-index'),
                renderHTML: attributes => {
                    return {
                        'data-index': attributes.index,
                    }
                },
            },
        }
    },

    /**
     * 输入规则
     * 支持使用 1. + 空格快捷创建有序列表项
     */
    addInputRules() {
        return [
            new InputRule({
                find: new RegExp(`^1\\.\\s$`),
                handler: ({ state, chain, range }) => {
                    const blockInfo = getBlockInfoFromSelection(state)
                    if (blockInfo.blockContent.node.type.spec.content !== 'inline*') {
                        return
                    }

                    chain()
                        .command(
                            updateBlockCommand(this.options.editor, blockInfo.blockContainer.beforePos, {
                                type: 'numberedListItem',
                                props: {},
                            })
                        )
                        .deleteRange({ from: range.from, to: range.to })
                },
            }),
        ]
    },

    /**
     * 快捷键定义
     * Enter: 处理列表项换行
     * Mod-Shift-7: 将当前块转换为有序列表项
     */
    addKeyboardShortcuts() {
        return {
            Enter: () => handleEnter(this.options.editor),
            'Mod-Shift-7': () => {
                const blockInfo = getBlockInfoFromSelection(this.editor.state)
                if (blockInfo.blockContent.node.type.spec.content !== 'inline*') {
                    return true
                }

                return this.editor.commands.command(
                    updateBlockCommand(this.options.editor, blockInfo.blockContainer.beforePos, {
                        type: 'numberedListItem',
                        props: {},
                    })
                )
            },
        }
    },

    /**
     * 添加 ProseMirror 插件
     * 集成有序列表索引插件
     */
    addProseMirrorPlugins() {
        return [NumberedListIndexingPlugin()]
    },

    /**
     * HTML 解析规则
     * 支持从自定义 div、li 和 p 标签解析
     */
    parseHTML() {
        return [
            {
                tag: 'div[data-content-type=' + this.name + ']',
            },
            {
                tag: 'li',
                getAttrs: element => {
                    if (typeof element === 'string') {
                        return false
                    }

                    const parent = element.parentElement

                    if (parent === null) {
                        return false
                    }

                    if (parent.tagName === 'OL' || (parent.tagName === 'DIV' && parent.parentElement!.tagName === 'OL')) {
                        return {}
                    }

                    return false
                },
                node: 'numberedListItem',
            },
            {
                tag: 'p',
                getAttrs: element => {
                    if (typeof element === 'string') {
                        return false
                    }

                    const parent = element.parentElement

                    if (parent === null) {
                        return false
                    }

                    if (parent.getAttribute('data-content-type') === 'numberedListItem') {
                        return {}
                    }

                    return false
                },
                priority: 300,
                node: 'numberedListItem',
            },
        ]
    },

    /**
     * HTML 渲染规则
     */
    renderHTML({ HTMLAttributes }) {
        return createDefaultBlockDOMOutputSpec(
            this.name,
            'p',
            {
                ...(this.options.domAttributes?.blockContent || {}),
                ...HTMLAttributes,
            },
            this.options.domAttributes?.inlineContent || {}
        )
    },
})

/**
 * 有序列表项块完整定义
 */
export const NumberedListItem = createBlockSpecFromStronglyTypedTiptapNode(NumberedListItemBlockContent, numberedListItemPropSchema)
