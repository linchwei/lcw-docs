import { createBlockSpecFromStronglyTypedTiptapNode, createStronglyTypedTiptapNode, PropSchema } from '../../schema/index'
import { createDefaultBlockDOMOutputSpec } from '../defaultBlockHelpers'

const CALLOUT_CONFIG: Record<string, { icon: string; bg: string; color: string; label: string }> = {
    info: { icon: '💡', bg: '#eef4fc', color: '#097fe8', label: '信息' },
    warning: { icon: '⚠️', bg: '#fbf3db', color: '#cb912f', label: '警告' },
    error: { icon: '❌', bg: '#fbe4e4', color: '#eb5757', label: '错误' },
    success: { icon: '✅', bg: '#dbeddb', color: '#4dab6f', label: '成功' },
}

export const calloutPropSchema = {
    calloutType: {
        default: 'info',
        values: ['info', 'warning', 'error', 'success'],
    },
} satisfies PropSchema

const CalloutBlockContent = createStronglyTypedTiptapNode({
    name: 'callout',
    content: 'inline*',
    group: 'blockContent',

    addAttributes() {
        return {
            calloutType: {
                default: 'info',
                parseHTML: (element: HTMLElement) => {
                    return element.getAttribute('data-callout-type') || 'info'
                },
                renderHTML: (attributes) => {
                    return {
                        'data-callout-type': attributes.calloutType,
                    }
                },
            },
        }
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-content-type=callout]',
            },
        ]
    },

    renderHTML({ HTMLAttributes }) {
        const { dom, contentDOM } = createDefaultBlockDOMOutputSpec(
            this.name,
            'p',
            {
                ...(this.options.domAttributes?.blockContent || {}),
                ...HTMLAttributes,
            },
            this.options.domAttributes?.inlineContent || {}
        )

        const config = CALLOUT_CONFIG[HTMLAttributes.calloutType || 'info'] || CALLOUT_CONFIG.info

        const wrapper = document.createElement('div')
        wrapper.style.display = 'flex'
        wrapper.style.alignItems = 'flex-start'
        wrapper.style.gap = '8px'
        wrapper.style.padding = '8px 12px'
        wrapper.style.backgroundColor = config.bg
        wrapper.style.borderRadius = '4px'
        wrapper.style.border = `1px solid ${config.color}22`
        wrapper.style.width = '100%'

        const iconSpan = document.createElement('span')
        iconSpan.textContent = config.icon
        iconSpan.style.fontSize = '18px'
        iconSpan.style.lineHeight = '24px'
        iconSpan.style.flexShrink = '0'

        dom.removeChild(contentDOM)
        wrapper.appendChild(iconSpan)
        wrapper.appendChild(contentDOM)
        dom.appendChild(wrapper)

        return {
            dom,
            contentDOM,
        }
    },

    addNodeView() {
        return ({ editor, node, getPos, HTMLAttributes }) => {
            const { dom, contentDOM } = createDefaultBlockDOMOutputSpec(
                this.name,
                'p',
                {
                    ...(this.options.domAttributes?.blockContent || {}),
                    ...HTMLAttributes,
                },
                this.options.domAttributes?.inlineContent || {}
            )

            const currentType = node.attrs.calloutType || 'info'
            const config = CALLOUT_CONFIG[currentType] || CALLOUT_CONFIG.info

            const wrapper = document.createElement('div')
            wrapper.style.display = 'flex'
            wrapper.style.alignItems = 'flex-start'
            wrapper.style.gap = '8px'
            wrapper.style.padding = '8px 12px'
            wrapper.style.backgroundColor = config.bg
            wrapper.style.borderRadius = '4px'
            wrapper.style.border = `1px solid ${config.color}22`
            wrapper.style.position = 'relative'
            wrapper.style.width = '100%'

            const iconSpan = document.createElement('span')
            iconSpan.textContent = config.icon
            iconSpan.style.fontSize = '18px'
            iconSpan.style.lineHeight = '24px'
            iconSpan.style.flexShrink = '0'
            iconSpan.style.cursor = 'pointer'
            iconSpan.style.userSelect = 'none'

            const contentDiv = document.createElement('div')
            contentDiv.style.flex = '1'
            contentDiv.style.outline = 'none'

            const menu = document.createElement('div')
            menu.style.position = 'absolute'
            menu.style.top = '100%'
            menu.style.left = '12px'
            menu.style.zIndex = '100'
            menu.style.backgroundColor = '#fff'
            menu.style.borderRadius = '6px'
            menu.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
            menu.style.border = '1px solid #e0e0e0'
            menu.style.padding = '4px'
            menu.style.minWidth = '120px'
            menu.style.display = 'none'

            const menuOptions: HTMLElement[] = []
            for (const [typeKey, typeConfig] of Object.entries(CALLOUT_CONFIG)) {
                const option = document.createElement('div')
                option.style.display = 'flex'
                option.style.alignItems = 'center'
                option.style.gap = '8px'
                option.style.padding = '6px 8px'
                option.style.borderRadius = '4px'
                option.style.cursor = 'pointer'
                option.style.fontSize = '13px'

                const optionIcon = document.createElement('span')
                optionIcon.textContent = typeConfig.icon
                option.appendChild(optionIcon)

                const optionLabel = document.createElement('span')
                optionLabel.textContent = typeConfig.label
                option.appendChild(optionLabel)

                if (typeKey === currentType) {
                    option.style.backgroundColor = typeConfig.bg
                    option.style.color = typeConfig.color
                    option.style.fontWeight = '600'
                }

                const handleOptionClick = (e: MouseEvent) => {
                    e.stopPropagation()
                    const pos = getPos()
                    if (pos === undefined) return
                    editor.commands.command(({ tr }) => {
                        tr.setNodeAttribute(pos, 'calloutType', typeKey)
                        return true
                    })
                    menu.style.display = 'none'
                }
                option.addEventListener('click', handleOptionClick)

                menu.appendChild(option)
                menuOptions.push(option)
            }

            let menuVisible = false
            const handleIconClick = (e: MouseEvent) => {
                e.stopPropagation()
                menuVisible = !menuVisible
                menu.style.display = menuVisible ? 'block' : 'none'
            }
            iconSpan.addEventListener('click', handleIconClick)

            const handleDocumentClick = (e: MouseEvent) => {
                if (menuVisible && !menu.contains(e.target as Node) && e.target !== iconSpan) {
                    menuVisible = false
                    menu.style.display = 'none'
                }
            }
            document.addEventListener('click', handleDocumentClick)

            dom.removeChild(contentDOM)
            wrapper.appendChild(iconSpan)
            contentDiv.appendChild(contentDOM)
            wrapper.appendChild(contentDiv)
            wrapper.appendChild(menu)
            dom.appendChild(wrapper)

            return {
                dom,
                contentDOM,
                update: (newNode) => {
                    if (newNode.type !== this.type) {
                        return false
                    }
                    const newType = newNode.attrs.calloutType || 'info'
                    const newConfig = CALLOUT_CONFIG[newType] || CALLOUT_CONFIG.info
                    iconSpan.textContent = newConfig.icon
                    wrapper.style.backgroundColor = newConfig.bg
                    wrapper.style.border = `1px solid ${newConfig.color}22`
                    menu.innerHTML = ''
                    for (const [typeKey, typeConfig] of Object.entries(CALLOUT_CONFIG)) {
                        const option = document.createElement('div')
                        option.style.display = 'flex'
                        option.style.alignItems = 'center'
                        option.style.gap = '8px'
                        option.style.padding = '6px 8px'
                        option.style.borderRadius = '4px'
                        option.style.cursor = 'pointer'
                        option.style.fontSize = '13px'

                        const optionIcon = document.createElement('span')
                        optionIcon.textContent = typeConfig.icon
                        option.appendChild(optionIcon)

                        const optionLabel = document.createElement('span')
                        optionLabel.textContent = typeConfig.label
                        option.appendChild(optionLabel)

                        if (typeKey === newType) {
                            option.style.backgroundColor = typeConfig.bg
                            option.style.color = typeConfig.color
                            option.style.fontWeight = '600'
                        }

                        const handleOptionClick = (e: MouseEvent) => {
                            e.stopPropagation()
                            const pos = getPos()
                            if (pos === undefined) return
                            editor.commands.command(({ tr }) => {
                                tr.setNodeAttribute(pos, 'calloutType', typeKey)
                                return true
                            })
                            menuVisible = false
                            menu.style.display = 'none'
                        }
                        option.addEventListener('click', handleOptionClick)

                        menu.appendChild(option)
                    }
                    return true
                },
                destroy: () => {
                    iconSpan.removeEventListener('click', handleIconClick)
                    document.removeEventListener('click', handleDocumentClick)
                },
            }
        }
    },
})

export const Callout = createBlockSpecFromStronglyTypedTiptapNode(CalloutBlockContent, calloutPropSchema)
