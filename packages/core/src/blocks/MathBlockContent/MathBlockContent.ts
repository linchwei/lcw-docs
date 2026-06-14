import katex from 'katex'
import { InputRule } from '@tiptap/core'
import { TextSelection } from '@tiptap/pm/state'

import { createBlockSpecFromStronglyTypedTiptapNode, createStronglyTypedTiptapNode, PropSchema } from '../../schema/index'
import { defaultProps } from '../defaultProps'

export const mathBlockPropSchema = {
    backgroundColor: defaultProps.backgroundColor,
    latex: {
        default: '' as const,
    },
} satisfies PropSchema

const MathBlockContent = createStronglyTypedTiptapNode({
    name: 'mathBlock',
    content: '',
    group: 'blockContent',
    defining: true,
    selectable: true,

    addAttributes() {
        return {
            latex: {
                default: '',
                parseHTML: element => {
                    let el = element as HTMLElement | null

                    if (el?.tagName === 'DIV' && el?.dataset?.contentType === 'mathBlock') {
                        el = el.querySelector('.bn-math-block-preview') as HTMLElement | null
                    }

                    return el?.getAttribute('data-latex') || ''
                },
                renderHTML: attributes => {
                    if (!attributes.latex) {
                        return {}
                    }
                    return {
                        'data-latex': attributes.latex,
                    }
                },
            },
        }
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-content-type=mathBlock]',
            },
        ]
    },

    renderHTML({ HTMLAttributes }) {
        const container = document.createElement('div')
        container.className = 'bn-math-block-preview'
        container.setAttribute('data-latex', HTMLAttributes['data-latex'] || '')

        if (HTMLAttributes['data-latex']) {
            try {
                katex.render(HTMLAttributes['data-latex'], container, {
                    displayMode: true,
                    throwOnError: false,
                })
            } catch {
                container.textContent = HTMLAttributes['data-latex']
            }
        }

        return {
            dom: container,
        }
    },

    addNodeView() {
        return ({ editor, node, getPos }) => {
            const wrapper = document.createElement('div')
            wrapper.className = 'bn-math-block-wrapper'

            const preview = document.createElement('div')
            preview.className = 'bn-math-block-preview'

            const textarea = document.createElement('textarea')
            textarea.className = 'bn-math-block-textarea'
            textarea.value = node.attrs.latex || ''

            let isEditing = false

            function renderPreview() {
                preview.innerHTML = ''
                const latex = node.attrs.latex as string
                if (latex) {
                    try {
                        katex.render(latex, preview, {
                            displayMode: true,
                            throwOnError: false,
                        })
                    } catch {
                        preview.textContent = latex
                    }
                } else {
                    preview.textContent = '点击输入 LaTeX 公式'
                    preview.classList.add('bn-math-block-placeholder')
                }
            }

            renderPreview()

            function switchToEdit() {
                if (isEditing) return
                isEditing = true
                preview.style.display = 'none'
                textarea.style.display = 'block'
                textarea.value = node.attrs.latex || ''
                textarea.focus()
            }

            function switchToPreview() {
                if (!isEditing) return
                isEditing = false
                const newLatex = textarea.value
                const pos = getPos()
                if (pos !== undefined) {
                    editor.commands.command(({ tr }) => {
                        tr.setNodeAttribute(pos, 'latex', newLatex)
                        return true
                    })
                }
                textarea.style.display = 'none'
                preview.style.display = 'block'
                preview.classList.remove('bn-math-block-placeholder')
                const latex = newLatex
                preview.innerHTML = ''
                if (latex) {
                    try {
                        katex.render(latex, preview, {
                            displayMode: true,
                            throwOnError: false,
                        })
                    } catch {
                        preview.textContent = latex
                    }
                } else {
                    preview.textContent = '点击输入 LaTeX 公式'
                    preview.classList.add('bn-math-block-placeholder')
                }
            }

            preview.addEventListener('click', switchToEdit)
            textarea.addEventListener('blur', switchToPreview)
            textarea.addEventListener('keydown', e => {
                if (e.key === 'Escape') {
                    e.preventDefault()
                    textarea.blur()
                }
            })

            textarea.style.display = 'none'

            wrapper.appendChild(preview)
            wrapper.appendChild(textarea)

            return {
                dom: wrapper,
                update: newNode => {
                    if (newNode.type !== this.type) {
                        return false
                    }
                    if (!isEditing) {
                        renderPreview()
                    }
                    return true
                },
                destroy: () => {
                    preview.removeEventListener('click', switchToEdit)
                    textarea.removeEventListener('blur', switchToPreview)
                },
            }
        }
    },

    addInputRules() {
        return [
            new InputRule({
                find: /^\$\$\s$/,
                handler: ({ state, range }) => {
                    const $start = state.doc.resolve(range.from)

                    if (!$start.node(-1).canReplaceWith($start.index(-1), $start.indexAfter(-1), this.type)) {
                        return null
                    }

                    state.tr
                        .delete(range.from, range.to)
                        .setBlockType(range.from, range.from, this.type, { latex: '' })
                        .setSelection(TextSelection.create(state.tr.doc, range.from))

                    return
                },
            }),
        ]
    },

    addKeyboardShortcuts() {
        return {
            Enter: ({ editor }) => {
                if (!editor.isActive(this.name)) {
                    return false
                }

                const { $from } = editor.state.selection
                const parentOffset = $from.parentOffset
                const parentEnd = $from.parent.nodeSize - 1

                if (parentOffset < parentEnd) {
                    return false
                }

                editor.chain().exitCode().run()
                return true
            },
        }
    },
})

export const MathBlock = createBlockSpecFromStronglyTypedTiptapNode(MathBlockContent, mathBlockPropSchema)
