/**
 * 无序列表项块内容模块
 * 定义编辑器中的无序列表项，支持使用 -、+、* 创建列表项
 */
import { InputRule } from '@tiptap/core'

import { updateBlockCommand } from '../../../api/blockManipulation/commands/updateBlock/updateBlock'
import { getBlockInfoFromSelection } from '../../../api/getBlockInfoFromPos'
import { createBlockSpecFromStronglyTypedTiptapNode, createStronglyTypedTiptapNode, PropSchema } from '../../../schema/index'
import { createDefaultBlockDOMOutputSpec } from '../../defaultBlockHelpers'
import { defaultProps } from '../../defaultProps'
import { handleEnter } from '../ListItemKeyboardShortcuts'

/**
 * 无序列表项块的属性模式定义
 */
export const bulletListItemPropSchema = {
    ...defaultProps,
} satisfies PropSchema

/**
 * 无序列表项块的 TipTap 节点定义
 */
const BulletListItemBlockContent = createStronglyTypedTiptapNode({
    name: 'bulletListItem',
    content: 'inline*',
    group: 'blockContent',
    priority: 90,

    /**
     * 输入规则
     * 支持使用 -、+、* + 空格快捷创建无序列表项
     */
    addInputRules() {
        return [
            new InputRule({
                find: new RegExp(`^[-+*]\\s$`),
                handler: ({ state, chain, range }) => {
                    const blockInfo = getBlockInfoFromSelection(state)
                    if (blockInfo.blockContent.node.type.spec.content !== 'inline*') {
                        return
                    }

                    chain()
                        .command(
                            updateBlockCommand(this.options.editor, blockInfo.blockContainer.beforePos, {
                                type: 'bulletListItem',
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
     * Mod-Shift-8: 将当前块转换为无序列表项
     */
    addKeyboardShortcuts() {
        return {
            Enter: () => handleEnter(this.options.editor),
            'Mod-Shift-8': () => {
                const blockInfo = getBlockInfoFromSelection(this.editor.state)
                if (blockInfo.blockContent.node.type.spec.content !== 'inline*') {
                    return true
                }

                return this.options.editor.commands.command(
                    updateBlockCommand(this.options.editor, blockInfo.blockContainer.beforePos, {
                        type: 'bulletListItem',
                        props: {},
                    })
                )
            },
        }
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

                    if (parent.tagName === 'UL' || (parent.tagName === 'DIV' && parent.parentElement!.tagName === 'UL')) {
                        return {}
                    }

                    return false
                },
                node: 'bulletListItem',
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

                    if (parent.getAttribute('data-content-type') === 'bulletListItem') {
                        return {}
                    }

                    return false
                },
                priority: 300,
                node: 'bulletListItem',
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
 * 无序列表项块完整定义
 */
export const BulletListItem = createBlockSpecFromStronglyTypedTiptapNode(BulletListItemBlockContent, bulletListItemPropSchema)
