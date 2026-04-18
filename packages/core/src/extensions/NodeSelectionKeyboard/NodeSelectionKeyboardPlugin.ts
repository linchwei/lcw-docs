/**
 * 节点选择键盘插件
 *
 * 该插件处理当用户选中整个节点（而非文本选区）时的键盘输入。
 * 当使用Ctrl/Cmd+A选中图片、代码块等节点时，按下普通字符键会替换节点为新的段落。
 */

import { Plugin, PluginKey, TextSelection } from 'prosemirror-state'

const PLUGIN_KEY = new PluginKey('node-selection-keyboard')

/**
 * 节点选择键盘插件
 *
 * 该插件处理节点选择状态下的键盘事件：
 * - 当选中整个节点时，按下普通字符键会将节点替换为段落并输入字符
 * - 按下回车键会在节点后插入新段落并移动光标
 * - Ctrl/Cmd组合键正常传递，不拦截
 */
export const NodeSelectionKeyboardPlugin = () => {
    return new Plugin({
        key: PLUGIN_KEY,
        props: {
            handleKeyDown: (view, event) => {
                if ('node' in view.state.selection) {
                    if (event.ctrlKey || event.metaKey) {
                        return false
                    }
                    if (event.key.length === 1) {
                        event.preventDefault()

                        return true
                    }
                    if (event.key === 'Enter' && !event.shiftKey && !event.altKey && !event.ctrlKey && !event.metaKey) {
                        const tr = view.state.tr
                        view.dispatch(
                            tr
                                .insert(view.state.tr.selection.$to.after(), view.state.schema.nodes['paragraph'].create())
                                .setSelection(new TextSelection(tr.doc.resolve(view.state.tr.selection.$to.after() + 1)))
                        )

                        return true
                    }
                }

                return false
            },
        },
    })
}
