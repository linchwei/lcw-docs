import { InputRule, isTextSelection } from '@tiptap/core'
import { TextSelection } from '@tiptap/pm/state'
import { createHighlightPlugin, withLineNumbers } from 'prosemirror-highlight'
import { createParser } from 'prosemirror-highlight/refractor'
import { refractor } from 'refractor'

import { createBlockSpecFromStronglyTypedTiptapNode, createStronglyTypedTiptapNode, PropSchema } from '../../schema/index'
import { createDefaultBlockDOMOutputSpec } from '../defaultBlockHelpers'
import { defaultSupportedLanguages, SupportedLanguageConfig } from './defaultSupportedLanguages'

interface CodeBlockOptions {
    defaultLanguage: string
    indentLineWithTab: boolean
    supportedLanguages: SupportedLanguageConfig[]
}

export const defaultCodeBlockPropSchema = {
    language: {
        default: 'javascript',
        values: [...defaultSupportedLanguages.map(lang => lang.id)],
    },
} satisfies PropSchema

const CodeBlockContent = createStronglyTypedTiptapNode({
    name: 'codeBlock',
    content: 'inline*',
    group: 'blockContent',
    marks: '',
    code: true,
    defining: true,

    addOptions() {
        return {
            defaultLanguage: 'javascript',
            indentLineWithTab: true,
            supportedLanguages: defaultSupportedLanguages,
        }
    },

    addAttributes() {
        return {
            language: {
                default: this.options.defaultLanguage,
                parseHTML: inputElement => {
                    let element = inputElement as HTMLElement | null

                    if (element?.tagName === 'DIV' && element?.dataset.contentType === 'codeBlock') {
                        element = element.children[0] as HTMLElement | null
                    }

                    if (element?.tagName === 'PRE') {
                        element = element?.children[0] as HTMLElement | null
                    }

                    const dataLanguage = element?.getAttribute('data-language')

                    if (dataLanguage) {
                        return dataLanguage.toLowerCase()
                    }

                    const classNames = [...(element?.className.split(' ') || [])]
                    const languages = classNames
                        .filter(className => className.startsWith('language-'))
                        .map(className => className.replace('language-', ''))
                    const [language] = languages

                    if (!language) {
                        return null
                    }

                    return language.toLowerCase()
                },
                renderHTML: attributes => {
                    return attributes.language && attributes.language !== 'text'
                        ? {
                              class: `language-${attributes.language}`,
                          }
                        : {}
                },
            },
        }
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-content-type=' + this.name + ']',
            },
            {
                tag: 'pre',
                preserveWhitespace: 'full',
            },
        ]
    },

    renderHTML({ HTMLAttributes }) {
        const pre = document.createElement('pre')
        const { dom, contentDOM } = createDefaultBlockDOMOutputSpec(this.name, 'code', this.options.domAttributes?.blockContent || {}, {
            ...(this.options.domAttributes?.inlineContent || {}),
            ...HTMLAttributes,
        })

        dom.removeChild(contentDOM)
        dom.appendChild(pre)
        pre.appendChild(contentDOM)

        return {
            dom,
            contentDOM,
        }
    },

    addNodeView() {
        const supportedLanguages = this.options.supportedLanguages as SupportedLanguageConfig[]

        return ({ editor, node, getPos, HTMLAttributes }) => {
            const pre = document.createElement('pre')
            const { dom, contentDOM } = createDefaultBlockDOMOutputSpec(
                this.name,
                'code',
                {
                    ...(this.options.domAttributes?.blockContent || {}),
                    ...HTMLAttributes,
                },
                this.options.domAttributes?.inlineContent || {}
            )

            const header = document.createElement('div')
            header.className = 'bn-code-block-header'

            const select = document.createElement('select')
            select.className = 'bn-code-block-lang-select'
            supportedLanguages.forEach(({ id, name }) => {
                const option = document.createElement('option')
                option.value = id
                option.text = name
                select.appendChild(option)
            })
            select.value = node.attrs.language || this.options.defaultLanguage

            const handleLanguageChange = (event: Event) => {
                const language = (event.target as HTMLSelectElement).value
                editor.commands.command(({ tr }) => {
                    tr.setNodeAttribute(getPos(), 'language', language)
                    return true
                })
            }
            select.addEventListener('change', handleLanguageChange)

            const actions = document.createElement('div')
            actions.className = 'bn-code-block-actions'

            const wrapBtn = document.createElement('button')
            wrapBtn.className = 'bn-code-block-wrap-btn'
            wrapBtn.textContent = '自动换行'
            let isWrapped = false
            const handleWrapToggle = () => {
                isWrapped = !isWrapped
                pre.style.whiteSpace = isWrapped ? 'pre-wrap' : 'pre'
                wrapBtn.textContent = isWrapped ? '取消换行' : '自动换行'
            }
            wrapBtn.addEventListener('click', handleWrapToggle)

            const copyBtn = document.createElement('button')
            copyBtn.className = 'bn-code-block-copy-btn'
            copyBtn.textContent = '复制'
            const handleCopy = async () => {
                const text = contentDOM.textContent || ''
                try {
                    await navigator.clipboard.writeText(text)
                    copyBtn.textContent = '已复制'
                    setTimeout(() => {
                        copyBtn.textContent = '复制'
                    }, 2000)
                } catch {
                    /* empty */
                }
            }
            copyBtn.addEventListener('click', handleCopy)

            actions.appendChild(wrapBtn)
            actions.appendChild(copyBtn)
            header.appendChild(select)
            header.appendChild(actions)

            dom.removeChild(contentDOM)
            dom.appendChild(header)
            dom.appendChild(pre)
            pre.appendChild(contentDOM)

            return {
                dom,
                contentDOM,
                update: newNode => {
                    if (newNode.type !== this.type) {
                        return false
                    }
                    select.value = newNode.attrs.language || this.options.defaultLanguage
                    return true
                },
                destroy: () => {
                    select.removeEventListener('change', handleLanguageChange)
                    wrapBtn.removeEventListener('click', handleWrapToggle)
                    copyBtn.removeEventListener('click', handleCopy)
                },
            }
        }
    },

    addProseMirrorPlugins() {
        const baseParser = createParser(refractor)

        const safeParser = (options: Parameters<typeof baseParser>[0]) => {
            const lang = options.language
            if (!lang || lang === 'text' || !refractor.registered(lang)) {
                return []
            }
            try {
                return baseParser(options)
            } catch {
                return []
            }
        }

        const parserWithLineNumbers = withLineNumbers(safeParser)

        const refractorPlugin = createHighlightPlugin({
            parser: parserWithLineNumbers,
            languageExtractor: node => node.attrs.language,
            nodeTypes: [this.name],
        })

        return [refractorPlugin]
    },

    addInputRules() {
        const supportedLanguages = this.options.supportedLanguages as SupportedLanguageConfig[]

        return [
            new InputRule({
                find: /^```(.*?)\s$/,
                handler: ({ state, range, match }) => {
                    const $start = state.doc.resolve(range.from)
                    const languageName = match[1].trim()
                    const attributes = {
                        language:
                            supportedLanguages.find(({ match }) => {
                                return match.includes(languageName)
                            })?.id || this.options.defaultLanguage,
                    }

                    if (!$start.node(-1).canReplaceWith($start.index(-1), $start.indexAfter(-1), this.type)) {
                        return null
                    }

                    state.tr
                        .delete(range.from, range.to)
                        .setBlockType(range.from, range.from, this.type, attributes)
                        .setSelection(TextSelection.create(state.tr.doc, range.from))

                    return
                },
            }),
        ]
    },

    addKeyboardShortcuts() {
        return {
            Delete: ({ editor }) => {
                const { selection } = editor.state
                const { $from } = selection

                if (editor.isActive(this.name) && !$from.parent.textContent && isTextSelection(selection)) {
                    const from = $from.pos - $from.parentOffset - 2

                    editor.chain().setNodeSelection(from).deleteSelection().run()

                    return true
                }

                return false
            },
            Tab: ({ editor }) => {
                if (!this.options.indentLineWithTab) {
                    return false
                }
                if (editor.isActive(this.name)) {
                    editor.commands.insertContent('  ')
                    return true
                }

                return false
            },
            Enter: ({ editor }) => {
                const { $from } = editor.state.selection

                if (!editor.isActive(this.name)) {
                    return false
                }

                const isAtEnd = $from.parentOffset === $from.parent.nodeSize - 2
                const endsWithDoubleNewline = $from.parent.textContent.endsWith('\n\n')

                if (!isAtEnd || !endsWithDoubleNewline) {
                    editor.commands.insertContent('\n')
                    return true
                }

                return editor
                    .chain()
                    .command(({ tr }) => {
                        tr.delete($from.pos - 2, $from.pos)

                        return true
                    })
                    .exitCode()
                    .run()
            },
            'Shift-Enter': ({ editor }) => {
                const { $from } = editor.state.selection

                if (!editor.isActive(this.name)) {
                    return false
                }

                editor
                    .chain()
                    .insertContentAt($from.pos - $from.parentOffset + $from.parent.nodeSize, {
                        type: 'paragraph',
                    })
                    .run()

                return true
            },
        }
    },
})

export const CodeBlock = createBlockSpecFromStronglyTypedTiptapNode(CodeBlockContent, defaultCodeBlockPropSchema)

export function customizeCodeBlock(options: Partial<CodeBlockOptions>) {
    return createBlockSpecFromStronglyTypedTiptapNode(CodeBlockContent.configure(options), {
        language: {
            default: options.defaultLanguage || defaultCodeBlockPropSchema.language.default,
            values: options.supportedLanguages?.map(lang => lang.id) || defaultCodeBlockPropSchema.language.values,
        },
    })
}
