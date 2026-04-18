/**
 * 标题块内容模块
 * 定义编辑器中的标题块，支持 h1、h2、h3 三个级别
 */
import { InputRule } from '@tiptap/core'

import { updateBlockCommand } from '../../api/blockManipulation/commands/updateBlock/updateBlock'
import { getBlockInfoFromSelection } from '../../api/getBlockInfoFromPos'
import { createBlockSpecFromStronglyTypedTiptapNode, createStronglyTypedTiptapNode, PropSchema } from '../../schema/index'
import { createDefaultBlockDOMOutputSpec } from '../defaultBlockHelpers'
import { defaultProps } from '../defaultProps'

/**
 * 标题块的属性模式定义
 * 包含级别（level）属性，支持 1、2、3 三个级别
 */
export const headingPropSchema = {
    ...defaultProps,
    level: { default: 1, values: [1, 2, 3, 4, 5, 6] as const },
} satisfies PropSchema

/**
 * 标题块的 TipTap 节点定义
 * 支持内联内容，通过 level 属性控制标题级别
 */
const HeadingBlockContent = createStronglyTypedTiptapNode({
    name: 'heading',
    content: 'inline*',
    group: 'blockContent',

    /**
     * 定义标题块的属性
     * level 属性控制标题的级别（1、2、3）
     */
    addAttributes() {
        return {
            level: {
                default: 1,
                parseHTML: element => {
                    const attr = element.getAttribute('data-level')!
                    const parsed = parseInt(attr)
                    if (isFinite(parsed)) {
                        return parsed
                    }
                    return undefined
                },
                renderHTML: attributes => {
                    return {
                        'data-level': (attributes.level as number).toString(),
                    }
                },
            },
        }
    },

    /**
     * 输入规则
     * 支持使用 #、##、### + 空格快捷创建对应级别的标题
     */
    addInputRules() {
        return [
            ...[1, 2, 3, 4, 5, 6].map(level => {
                return new InputRule({
                    find: new RegExp(`^(#{${level}})\\s$`),
                    handler: ({ state, chain, range }) => {
                        const blockInfo = getBlockInfoFromSelection(state)
                        if (blockInfo.blockContent.node.type.spec.content !== 'inline*') {
                            return
                        }

                        chain()
                            .command(
                                updateBlockCommand(this.options.editor, blockInfo.blockContainer.beforePos, {
                                    type: 'heading',
                                    props: {
                                        level: level as any,
                                    },
                                })
                            )
                            .deleteRange({ from: range.from, to: range.to })
                            .run()
                    },
                })
            }),
        ]
    },

    /**
     * 快捷键定义
     * Mod-Alt-1/2/3: 切换到对应级别的标题
     */
    addKeyboardShortcuts() {
        return {
            'Mod-Alt-1': () => {
                const blockInfo = getBlockInfoFromSelection(this.editor.state)
                if (blockInfo.blockContent.node.type.spec.content !== 'inline*') {
                    return true
                }

                return this.editor.commands.command(
                    updateBlockCommand(this.options.editor, blockInfo.blockContainer.beforePos, {
                        type: 'heading',
                        props: {
                            level: 1 as any,
                        },
                    })
                )
            },
            'Mod-Alt-2': () => {
                const blockInfo = getBlockInfoFromSelection(this.editor.state)
                if (blockInfo.blockContent.node.type.spec.content !== 'inline*') {
                    return true
                }

                return this.editor.commands.command(
                    updateBlockCommand(this.options.editor, blockInfo.blockContainer.beforePos, {
                        type: 'heading',
                        props: {
                            level: 2 as any,
                        },
                    })
                )
            },
            'Mod-Alt-3': () => {
                const blockInfo = getBlockInfoFromSelection(this.editor.state)
                if (blockInfo.blockContent.node.type.spec.content !== 'inline*') {
                    return true
                }

                return this.editor.commands.command(
                    updateBlockCommand(this.options.editor, blockInfo.blockContainer.beforePos, {
                        type: 'heading',
                        props: {
                            level: 3 as any,
                        },
                    })
                )
            },
            'Mod-Alt-4': () => {
                const blockInfo = getBlockInfoFromSelection(this.editor.state)
                if (blockInfo.blockContent.node.type.spec.content !== 'inline*') {
                    return true
                }

                return this.editor.commands.command(
                    updateBlockCommand(this.options.editor, blockInfo.blockContainer.beforePos, {
                        type: 'heading',
                        props: {
                            level: 4 as any,
                        },
                    })
                )
            },
            'Mod-Alt-5': () => {
                const blockInfo = getBlockInfoFromSelection(this.editor.state)
                if (blockInfo.blockContent.node.type.spec.content !== 'inline*') {
                    return true
                }

                return this.editor.commands.command(
                    updateBlockCommand(this.options.editor, blockInfo.blockContainer.beforePos, {
                        type: 'heading',
                        props: {
                            level: 5 as any,
                        },
                    })
                )
            },
            'Mod-Alt-6': () => {
                const blockInfo = getBlockInfoFromSelection(this.editor.state)
                if (blockInfo.blockContent.node.type.spec.content !== 'inline*') {
                    return true
                }

                return this.editor.commands.command(
                    updateBlockCommand(this.options.editor, blockInfo.blockContainer.beforePos, {
                        type: 'heading',
                        props: {
                            level: 6 as any,
                        },
                    })
                )
            },
        }
    },

    /**
     * HTML 解析规则
     * 支持从自定义 div 和标准 h1/h2/h3 标签解析
     */
    parseHTML() {
        return [
            {
                tag: 'div[data-content-type=' + this.name + ']',
                getAttrs: element => {
                    if (typeof element === 'string') {
                        return false
                    }

                    return {
                        level: element.getAttribute('data-level'),
                    }
                },
            },
            {
                tag: 'h1',
                attrs: { level: 1 },
                node: 'heading',
            },
            {
                tag: 'h2',
                attrs: { level: 2 },
                node: 'heading',
            },
            {
                tag: 'h3',
                attrs: { level: 3 },
                node: 'heading',
            },
            {
                tag: 'h4',
                attrs: { level: 4 },
                node: 'heading',
            },
            {
                tag: 'h5',
                attrs: { level: 5 },
                node: 'heading',
            },
            {
                tag: 'h6',
                attrs: { level: 6 },
                node: 'heading',
            },
        ]
    },

    /**
     * HTML 渲染规则
     * 根据 level 属性渲染为对应的 h1/h2/h3 标签
     */
    renderHTML({ node, HTMLAttributes }) {
        return createDefaultBlockDOMOutputSpec(
            this.name,
            `h${node.attrs.level}`,
            {
                ...(this.options.domAttributes?.blockContent || {}),
                ...HTMLAttributes,
            },
            this.options.domAttributes?.inlineContent || {}
        )
    },
})

/**
 * 标题块完整定义
 */
export const Heading = createBlockSpecFromStronglyTypedTiptapNode(HeadingBlockContent, headingPropSchema)
