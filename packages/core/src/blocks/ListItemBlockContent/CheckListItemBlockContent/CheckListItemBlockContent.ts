/**
 * 任务列表项块内容模块
 * 定义编辑器中的任务列表项，支持复选框和完成状态
 */
import { InputRule } from '@tiptap/core'

import { updateBlockCommand } from '../../../api/blockManipulation/commands/updateBlock/updateBlock'
import { getBlockInfoFromSelection, getNearestBlockContainerPos } from '../../../api/getBlockInfoFromPos'
import { createBlockSpecFromStronglyTypedTiptapNode, createStronglyTypedTiptapNode, PropSchema } from '../../../schema/index'
import { createDefaultBlockDOMOutputSpec } from '../../defaultBlockHelpers'
import { defaultProps } from '../../defaultProps'
import { handleEnter } from '../ListItemKeyboardShortcuts'

/**
 * 任务列表项块的属性模式定义
 * 包含 checked 属性表示完成状态
 */
export const checkListItemPropSchema = {
    ...defaultProps,
    checked: {
        default: false,
    },
} satisfies PropSchema

/**
 * 任务列表项块的 TipTap 节点定义
 */
const checkListItemBlockContent = createStronglyTypedTiptapNode({
    name: 'checkListItem',
    content: 'inline*',
    group: 'blockContent',

    /**
     * 定义任务列表项的属性
     * checked 属性控制复选框状态
     */
    addAttributes() {
        return {
            checked: {
                default: false,
                parseHTML: element => element.getAttribute('data-checked') === 'true' || undefined,
                renderHTML: attributes => {
                    return attributes.checked
                        ? {
                              'data-checked': (attributes.checked as boolean).toString(),
                          }
                        : {}
                },
            },
        }
    },

    /**
     * 输入规则
     * 支持使用 [ ] 和 [x]/[X] + 空格快捷创建任务列表项
     */
    addInputRules() {
        return [
            new InputRule({
                find: new RegExp(`\\[\\s*\\]\\s$`),
                handler: ({ state, chain, range }) => {
                    const blockInfo = getBlockInfoFromSelection(state)
                    if (blockInfo.blockContent.node.type.spec.content !== 'inline*') {
                        return
                    }

                    chain()
                        .command(
                            updateBlockCommand(this.options.editor, blockInfo.blockContainer.beforePos, {
                                type: 'checkListItem',
                                props: {
                                    checked: false as any,
                                },
                            })
                        )
                        .deleteRange({ from: range.from, to: range.to })
                },
            }),
            new InputRule({
                find: new RegExp(`\\[[Xx]\\]\\s$`),
                handler: ({ state, chain, range }) => {
                    const blockInfo = getBlockInfoFromSelection(state)

                    if (blockInfo.blockContent.node.type.spec.content !== 'inline*') {
                        return
                    }

                    chain()
                        .command(
                            updateBlockCommand(this.options.editor, blockInfo.blockContainer.beforePos, {
                                type: 'checkListItem',
                                props: {
                                    checked: true as any,
                                },
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
     * Mod-Shift-9: 将当前块转换为任务列表项
     */
    addKeyboardShortcuts() {
        return {
            Enter: () => handleEnter(this.options.editor),
            'Mod-Shift-9': () => {
                const blockInfo = getBlockInfoFromSelection(this.options.editor.state)
                if (blockInfo.blockContent.node.type.spec.content !== 'inline*') {
                    return true
                }

                return this.editor.commands.command(
                    updateBlockCommand(this.options.editor, blockInfo.blockContainer.beforePos, {
                        type: 'checkListItem',
                        props: {},
                    })
                )
            },
        }
    },

    /**
     * HTML 解析规则
     * 支持从自定义 div、input[type=checkbox] 和 li 标签解析
     */
    parseHTML() {
        return [
            {
                tag: 'div[data-content-type=' + this.name + ']',
            },
            {
                tag: 'input',
                getAttrs: element => {
                    if (typeof element === 'string') {
                        return false
                    }

                    if ((element as HTMLInputElement).type === 'checkbox') {
                        return { checked: (element as HTMLInputElement).checked }
                    }

                    return false
                },
                node: 'checkListItem',
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
                        const checkbox = (element.querySelector('input[type=checkbox]') as HTMLInputElement) || null

                        if (checkbox === null) {
                            return false
                        }

                        return { checked: checkbox.checked }
                    }

                    return false
                },
                node: 'checkListItem',
            },
        ]
    },

    /**
     * HTML 渲染规则
     * 在内容前添加复选框
     */
    renderHTML({ node, HTMLAttributes }) {
        const checkbox = document.createElement('input')
        checkbox.type = 'checkbox'
        checkbox.checked = node.attrs.checked
        if (node.attrs.checked) {
            checkbox.setAttribute('checked', '')
        }

        const { dom, contentDOM } = createDefaultBlockDOMOutputSpec(
            this.name,
            'p',
            {
                ...(this.options.domAttributes?.blockContent || {}),
                ...HTMLAttributes,
            },
            this.options.domAttributes?.inlineContent || {}
        )

        dom.insertBefore(checkbox, contentDOM)

        return { dom, contentDOM }
    },

    /**
     * 创建自定义节点视图
     * 处理复选框的交互和状态同步
     */
    addNodeView() {
        return ({ node, getPos, editor, HTMLAttributes }) => {
            const wrapper = document.createElement('div')
            const checkboxWrapper = document.createElement('div')
            checkboxWrapper.contentEditable = 'false'

            const checkbox = document.createElement('input')
            checkbox.type = 'checkbox'
            checkbox.checked = node.attrs.checked
            if (node.attrs.checked) {
                checkbox.setAttribute('checked', '')
            }

            /**
             * 复选框变化处理函数
             * 同步更新块属性
             */
            const changeHandler = () => {
                if (!editor.isEditable) {
                    checkbox.checked = !checkbox.checked
                    return
                }

                if (typeof getPos !== 'boolean') {
                    const beforeBlockContainerPos = getNearestBlockContainerPos(editor.state.doc, getPos())
                    this.editor.commands.command(
                        updateBlockCommand(this.options.editor, beforeBlockContainerPos.posBeforeNode, {
                            type: 'checkListItem',
                            props: {
                                checked: checkbox.checked as any,
                            },
                        })
                    )
                }
            }
            checkbox.addEventListener('change', changeHandler)

            const { dom, contentDOM } = createDefaultBlockDOMOutputSpec(
                this.name,
                'p',
                {
                    ...(this.options.domAttributes?.blockContent || {}),
                    ...HTMLAttributes,
                },
                this.options.domAttributes?.inlineContent || {}
            )

            if (typeof getPos !== 'boolean') {
                const blockID = this.editor.state.doc.resolve(getPos()).node().attrs.id
                const label = 'label-' + blockID
                checkbox.setAttribute('aria-labelledby', label)
                contentDOM.id = label
            }

            dom.removeChild(contentDOM)
            dom.appendChild(wrapper)
            wrapper.appendChild(checkboxWrapper)
            wrapper.appendChild(contentDOM)
            checkboxWrapper.appendChild(checkbox)

            return {
                dom,
                contentDOM,
                destroy: () => {
                    checkbox.removeEventListener('change', changeHandler)
                },
            }
        }
    },
})

/**
 * 任务列表项块完整定义
 */
export const CheckListItem = createBlockSpecFromStronglyTypedTiptapNode(checkListItemBlockContent, checkListItemPropSchema)
