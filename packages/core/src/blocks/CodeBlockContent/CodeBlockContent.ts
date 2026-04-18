/**
 * 代码块内容模块
 * 定义编辑器中的代码块，支持语法高亮和多语言切换
 * 使用 Shiki 作为语法高亮引擎
 */
import { InputRule, isTextSelection } from '@tiptap/core'
import { TextSelection } from '@tiptap/pm/state'
import { createHighlightPlugin, Parser } from 'prosemirror-highlight'
import { createParser } from 'prosemirror-highlight/shiki'
import { BundledLanguage, bundledLanguagesInfo, createHighlighter, Highlighter } from 'shiki'

import { createBlockSpecFromStronglyTypedTiptapNode, createStronglyTypedTiptapNode, PropSchema } from '../../schema/index'
import { createDefaultBlockDOMOutputSpec } from '../defaultBlockHelpers'
import { defaultSupportedLanguages, SupportedLanguageConfig } from './defaultSupportedLanguages'

/**
 * 代码块配置选项接口
 */
interface CodeBlockOptions {
    defaultLanguage: string
    indentLineWithTab: boolean
    supportedLanguages: SupportedLanguageConfig[]
}

/**
 * 代码块的属性模式定义
 * language 属性指定代码语言，支持从默认支持的语言列表中选择
 */
export const defaultCodeBlockPropSchema = {
    language: {
        default: 'javascript',
        values: [...defaultSupportedLanguages.map(lang => lang.id)],
    },
} satisfies PropSchema

/**
 * 代码块的 TipTap 节点定义
 * 禁用 marks（不允许内联格式），支持代码内容
 */
const CodeBlockContent = createStronglyTypedTiptapNode({
    name: 'codeBlock',
    content: 'inline*',
    group: 'blockContent',
    marks: '',
    code: true,
    defining: true,

    /**
     * 代码块配置选项
     * 支持设置默认语言、Tab 缩进和可选语言列表
     */
    addOptions() {
        return {
            defaultLanguage: 'javascript',
            indentLineWithTab: true,
            supportedLanguages: defaultSupportedLanguages,
        }
    },

    /**
     * 定义代码块属性
     * language 属性存储代码语言标识符
     */
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

    /**
     * HTML 解析规则
     * 支持从自定义 div 和 pre 标签解析
     */
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

    /**
     * HTML 渲染规则
     * 创建包含 pre 和 code 标签的 DOM 结构
     */
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

    /**
     * 创建自定义节点视图
     * 添加语言选择下拉框
     */
    addNodeView() {
        const supportedLanguages = this.options.supportedLanguages as SupportedLanguageConfig[]

        return ({ editor, node, getPos, HTMLAttributes }) => {
            const pre = document.createElement('pre')
            const select = document.createElement('select')
            const selectWrapper = document.createElement('div')
            const { dom, contentDOM } = createDefaultBlockDOMOutputSpec(
                this.name,
                'code',
                {
                    ...(this.options.domAttributes?.blockContent || {}),
                    ...HTMLAttributes,
                },
                this.options.domAttributes?.inlineContent || {}
            )

            /**
             * 语言切换处理函数
             * 更新节点的语言属性
             */
            const handleLanguageChange = (event: Event) => {
                const language = (event.target as HTMLSelectElement).value

                editor.commands.command(({ tr }) => {
                    tr.setNodeAttribute(getPos(), 'language', language)

                    return true
                })
            }

            supportedLanguages.forEach(({ id, name }) => {
                const option = document.createElement('option')

                option.value = id
                option.text = name
                select.appendChild(option)
            })

            selectWrapper.contentEditable = 'false'
            select.value = node.attrs.language || this.options.defaultLanguage
            dom.removeChild(contentDOM)
            dom.appendChild(selectWrapper)
            dom.appendChild(pre)
            pre.appendChild(contentDOM)
            selectWrapper.appendChild(select)
            select.addEventListener('change', handleLanguageChange)

            return {
                dom,
                contentDOM,
                update: newNode => {
                    if (newNode.type !== this.type) {
                        return false
                    }

                    return true
                },
                destroy: () => {
                    select.removeEventListener('change', handleLanguageChange)
                },
            }
        }
    },

    /**
     * 添加 ProseMirror 插件
     * 使用 Shiki 实现语法高亮
     */
    addProseMirrorPlugins() {
        let highlighter: Highlighter | undefined
        let parser: Parser | undefined

        const supportedLanguages = this.options.supportedLanguages as SupportedLanguageConfig[]

        /**
         * 懒加载语法解析器
         * 按需加载语言高亮支持
         */
        const lazyParser: Parser = options => {
            if (!highlighter) {
                return createHighlighter({
                    themes: ['github-dark'],
                    langs: [],
                }).then(createdHighlighter => {
                    highlighter = createdHighlighter
                })
            }

            const language = options.language

            if (
                language &&
                language !== 'text' &&
                !highlighter.getLoadedLanguages().includes(language) &&
                supportedLanguages.find(({ id }) => id === language) &&
                bundledLanguagesInfo.find(({ id }) => id === language)
            ) {
                return highlighter.loadLanguage(language as BundledLanguage)
            }

            if (!parser) {
                parser = createParser(highlighter)
            }

            return parser(options)
        }

        const shikiLazyPlugin = createHighlightPlugin({
            parser: lazyParser,
            languageExtractor: node => node.attrs.language,
            nodeTypes: [this.name],
        })

        return [shikiLazyPlugin]
    },

    /**
     * 输入规则
     * 支持使用 ``` 语言名 + 空格快捷创建代码块
     */
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

    /**
     * 快捷键定义
     * Delete: 删除空代码块
     * Tab: 插入两个空格
     * Enter: 在代码块内换行或退出代码块
     * Shift-Enter: 在代码块后创建新段落
     */
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

/**
 * 代码块完整定义
 */
export const CodeBlock = createBlockSpecFromStronglyTypedTiptapNode(CodeBlockContent, defaultCodeBlockPropSchema)

/**
 * 自定义代码块工厂函数
 * 允许创建支持不同默认语言和语言列表的代码块
 */
export function customizeCodeBlock(options: Partial<CodeBlockOptions>) {
    return createBlockSpecFromStronglyTypedTiptapNode(CodeBlockContent.configure(options), {
        language: {
            default: options.defaultLanguage || defaultCodeBlockPropSchema.language.default,
            values: options.supportedLanguages?.map(lang => lang.id) || defaultCodeBlockPropSchema.language.values,
        },
    })
}
