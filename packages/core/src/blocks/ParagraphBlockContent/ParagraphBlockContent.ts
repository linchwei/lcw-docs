/**
 * 段落块内容模块
 * 定义编辑器中的段落块，支持文本内容和基本快捷键
 */
import { updateBlockCommand } from '../../api/blockManipulation/commands/updateBlock/updateBlock'
import { getBlockInfoFromSelection } from '../../api/getBlockInfoFromPos'
import { createBlockSpecFromStronglyTypedTiptapNode, createStronglyTypedTiptapNode } from '../../schema/index'
import { createDefaultBlockDOMOutputSpec } from '../defaultBlockHelpers'
import { defaultProps } from '../defaultProps'

/**
 * 段落块的属性模式定义
 */
export const paragraphPropSchema = {
    ...defaultProps,
}

/**
 * 段落块的 TipTap 节点定义
 * 支持内联内容，使用 p 标签渲染
 */
export const ParagraphBlockContent = createStronglyTypedTiptapNode({
    name: 'paragraph',
    content: 'inline*',
    group: 'blockContent',

    /**
     * 定义段落块的快捷键
     * Mod-Alt-0: 将当前块转换为段落块
     */
    addKeyboardShortcuts() {
        return {
            'Mod-Alt-0': () => {
                const blockInfo = getBlockInfoFromSelection(this.editor.state)
                if (blockInfo.blockContent.node.type.spec.content !== 'inline*') {
                    return true
                }

                return this.editor.commands.command(
                    updateBlockCommand(this.options.editor, blockInfo.blockContainer.beforePos, {
                        type: 'paragraph',
                        props: {},
                    })
                )
            },
        }
    },

    /**
     * HTML 解析规则
     * 支持从 div[data-content-type=paragraph] 和 p 标签解析
     */
    parseHTML() {
        return [
            { tag: 'div[data-content-type=' + this.name + ']' },
            {
                tag: 'p',
                priority: 200,
                getAttrs: element => {
                    if (typeof element === 'string' || !element.textContent?.trim()) {
                        return false
                    }

                    return {}
                },
                node: 'paragraph',
            },
        ]
    },

    /**
     * HTML 渲染规则
     * 创建包含块内容和内联内容的 DOM 结构
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
 * 段落块完整定义
 */
export const Paragraph = createBlockSpecFromStronglyTypedTiptapNode(ParagraphBlockContent, paragraphPropSchema)
