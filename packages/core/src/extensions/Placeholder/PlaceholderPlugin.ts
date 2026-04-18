/**
 * 占位符插件
 *
 * 该插件在编辑器的空块中显示占位符文本。
 * 当块获得焦点且内容为空时，显示占位符提示用户输入内容。
 */

import { Plugin, PluginKey } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'

import type { LcwDocEditor } from '../../editor/LcwDocEditor'

const PLUGIN_KEY = new PluginKey(`lcwdoc-placeholder`)

/**
 * 占位符插件
 *
 * 该插件通过以下方式实现占位符功能：
 * 1. 动态创建<style>标签，注入CSS规则来显示占位符
 * 2. 使用ProseMirror装饰器标记空且获得焦点的节点
 * 3. 支持不同块类型的占位符配置
 *
 * @param editor - 编辑器实例
 * @param placeholders - 占位符配置，键为块类型，值为占位符文本
 * @returns ProseMirror插件实例
 */
export const PlaceholderPlugin = (editor: LcwDocEditor<any, any, any>, placeholders: Record<string | 'default', string>) => {
    return new Plugin({
        key: PLUGIN_KEY,
        view: () => {
            const styleEl = document.createElement('style')
            const nonce = editor._tiptapEditor.options.injectNonce
            if (nonce) {
                styleEl.setAttribute('nonce', nonce)
            }
            if (editor._tiptapEditor.view.root instanceof ShadowRoot) {
                editor._tiptapEditor.view.root.append(styleEl)
            } else {
                editor._tiptapEditor.view.root.head.appendChild(styleEl)
            }

            const styleSheet = styleEl.sheet!

            /**
             * 获取基础CSS选择器
             *
             * 选择器匹配包含单个trailingBreak的inline-content元素
             */
            const getBaseSelector = (additionalSelectors = '') =>
                `.bn-block-content${additionalSelectors} .bn-inline-content:has(> .ProseMirror-trailingBreak:only-child):before`

            /**
             * 获取特定块类型的占位符选择器
             *
             * @param blockType - 块类型名称
             * @param mustBeFocused - 是否必须在获得焦点状态
             * @returns 完整的CSS选择器
             */
            const getSelector = (blockType: string | 'default', mustBeFocused = true) => {
                const mustBeFocusedSelector = mustBeFocused ? `[data-is-empty-and-focused]` : ``

                if (blockType === 'default') {
                    return getBaseSelector(mustBeFocusedSelector)
                }

                const blockTypeSelector = `[data-content-type="${blockType}"]`
                return getBaseSelector(mustBeFocusedSelector + blockTypeSelector)
            }

            for (const [blockType, placeholder] of Object.entries(placeholders)) {
                const mustBeFocused = blockType === 'default'

                styleSheet.insertRule(`${getSelector(blockType, mustBeFocused)}{ content: ${JSON.stringify(placeholder)}; }`)

                if (!mustBeFocused) {
                    styleSheet.insertRule(`${getSelector(blockType, true)}{ content: ${JSON.stringify(placeholder)}; }`)
                }
            }

            return {
                destroy: () => {
                    if (editor._tiptapEditor.view.root instanceof ShadowRoot) {
                        editor._tiptapEditor.view.root.removeChild(styleEl)
                    } else {
                        editor._tiptapEditor.view.root.head.removeChild(styleEl)
                    }
                },
            }
        },
        props: {
            /**
             * 提供装饰器
             *
             * 当节点内容为空且获得焦点时，添加data-is-empty-and-focused属性
             * 这会触发CSS规则显示占位符文本
             */
            decorations: state => {
                const { doc, selection } = state

                if (!editor.isEditable) {
                    return
                }

                if (!selection.empty) {
                    return
                }

                if (selection.$from.parent.type.spec.code) {
                    return
                }

                const $pos = selection.$anchor
                const node = $pos.parent

                if (node.content.size > 0) {
                    return null
                }

                const before = $pos.before()

                const dec = Decoration.node(before, before + node.nodeSize, {
                    'data-is-empty-and-focused': 'true',
                })

                return DecorationSet.create(doc, [dec])
            },
        },
    })
}
