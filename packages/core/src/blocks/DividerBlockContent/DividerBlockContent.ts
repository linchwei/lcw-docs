import { createBlockSpecFromStronglyTypedTiptapNode, createStronglyTypedTiptapNode } from '../../schema/index'
import { mergeCSSClasses } from '../../util/browser'
import { defaultProps } from '../defaultProps'

export const dividerPropSchema = {
    ...defaultProps,
}

export const DividerBlockContent = createStronglyTypedTiptapNode({
    name: 'divider',
    content: '',
    group: 'blockContent',

    parseHTML() {
        return [
            { tag: 'div[data-content-type=' + this.name + ']' },
            { tag: 'hr' },
        ]
    },

    renderHTML({ HTMLAttributes }) {
        const blockContentAttrs: Record<string, string> = {
            ...(this.options.domAttributes?.blockContent || {}),
            ...HTMLAttributes,
        }
        const blockContent = document.createElement('div')
        blockContent.className = mergeCSSClasses('bn-block-content', blockContentAttrs.class)
        blockContent.setAttribute('data-content-type', this.name)
        for (const [attribute, value] of Object.entries(blockContentAttrs)) {
            if (attribute !== 'class') {
                blockContent.setAttribute(attribute, value)
            }
        }

        const inner = document.createElement('div')
        inner.style.padding = '8px 0'

        const hr = document.createElement('hr')
        hr.style.border = 'none'
        hr.style.borderTop = '1px solid #e9e9e7'
        hr.style.margin = '0'

        inner.appendChild(hr)
        blockContent.appendChild(inner)

        return { dom: blockContent }
    },

    addNodeView() {
        return ({ HTMLAttributes }) => {
            const blockContentAttrs: Record<string, string> = {
                ...(this.options.domAttributes?.blockContent || {}),
                ...HTMLAttributes,
            }
            const blockContent = document.createElement('div')
            blockContent.className = mergeCSSClasses('bn-block-content', blockContentAttrs.class)
            blockContent.setAttribute('data-content-type', this.name)
            for (const [attribute, value] of Object.entries(blockContentAttrs)) {
                if (attribute !== 'class') {
                    blockContent.setAttribute(attribute, value)
                }
            }

            const inner = document.createElement('div')
            inner.style.padding = '8px 0'

            const hr = document.createElement('hr')
            hr.style.border = 'none'
            hr.style.borderTop = '1px solid #e9e9e7'
            hr.style.margin = '0'

            inner.appendChild(hr)
            blockContent.appendChild(inner)

            return { dom: blockContent }
        }
    },
})

export const Divider = createBlockSpecFromStronglyTypedTiptapNode(DividerBlockContent, dividerPropSchema)
