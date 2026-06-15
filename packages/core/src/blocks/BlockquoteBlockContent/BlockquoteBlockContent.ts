import { createBlockSpecFromStronglyTypedTiptapNode, createStronglyTypedTiptapNode } from '../../schema/index'
import { createDefaultBlockDOMOutputSpec } from '../defaultBlockHelpers'
import { defaultProps } from '../defaultProps'

export const blockquotePropSchema = {
    ...defaultProps,
}

export const BlockquoteBlockContent = createStronglyTypedTiptapNode({
    name: 'blockquote',
    content: 'inline*',
    group: 'blockContent',

    parseHTML() {
        return [
            { tag: 'div[data-content-type=' + this.name + ']' },
            { tag: 'blockquote' },
        ]
    },

    renderHTML({ HTMLAttributes }) {
        const wrapper = document.createElement('div')
        wrapper.style.borderLeft = '3px solid #e9e9e7'
        wrapper.style.paddingLeft = '12px'
        wrapper.style.paddingRight = '12px'
        wrapper.style.paddingTop = '4px'
        wrapper.style.paddingBottom = '4px'
        wrapper.style.backgroundColor = '#f7f6f3'
        wrapper.style.borderRadius = '0 4px 4px 0'
        wrapper.style.color = '#787774'
        wrapper.style.fontStyle = 'italic'

        const { dom, contentDOM } = createDefaultBlockDOMOutputSpec(
            this.name,
            'p',
            {
                ...(this.options.domAttributes?.blockContent || {}),
                ...HTMLAttributes,
            },
            this.options.domAttributes?.inlineContent || {}
        )

        dom.removeChild(contentDOM)
        dom.appendChild(wrapper)
        wrapper.appendChild(contentDOM)

        return { dom, contentDOM }
    },

    addNodeView() {
        return ({ HTMLAttributes }) => {
            const wrapper = document.createElement('div')
            wrapper.style.borderLeft = '3px solid #e9e9e7'
            wrapper.style.paddingLeft = '12px'
            wrapper.style.paddingRight = '12px'
            wrapper.style.paddingTop = '4px'
            wrapper.style.paddingBottom = '4px'
            wrapper.style.backgroundColor = '#f7f6f3'
            wrapper.style.borderRadius = '0 4px 4px 0'
            wrapper.style.color = '#787774'
            wrapper.style.fontStyle = 'italic'

            const { dom, contentDOM } = createDefaultBlockDOMOutputSpec(
                this.name,
                'p',
                {
                    ...(this.options.domAttributes?.blockContent || {}),
                    ...HTMLAttributes,
                },
                this.options.domAttributes?.inlineContent || {}
            )

            dom.removeChild(contentDOM)
            dom.appendChild(wrapper)
            wrapper.appendChild(contentDOM)

            return {
                dom,
                contentDOM,
            }
        }
    },
})

export const Blockquote = createBlockSpecFromStronglyTypedTiptapNode(BlockquoteBlockContent, blockquotePropSchema)
