/**
 * 处理 VSCode 粘贴
 *
 * 该文件提供处理从 VSCode 编辑器粘贴内容的功能。
 * 识别 VSCode 的特殊剪贴板数据格式，保留代码语言信息。
 */
import { LcwDocEditor } from '../../../editor/LcwDocEditor'
import { BlockSchema, InlineContentSchema, StyleSchema } from '../../../schema/index'

/**
 * 处理 VSCode 粘贴事件
 *
 * 从剪贴板数据中提取 VSCode 编辑器信息，
 * 识别代码语言并以带语言标记的代码块形式粘贴。
 *
 * @param event - 剪贴板事件
 * @param editor - 编辑器实例
 * @returns 返回是否成功处理
 */
export async function handleVSCodePaste<BSchema extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema>(
    event: ClipboardEvent,
    editor: LcwDocEditor<BSchema, I, S>
) {
    const view = editor.prosemirrorView
    const { schema } = view.state

    if (!event.clipboardData) {
        return false
    }

    const text = event.clipboardData!.getData('text/plain')
    const vscode = event.clipboardData!.getData('vscode-editor-data')
    const vscodeData = vscode ? JSON.parse(vscode) : undefined
    const language = vscodeData?.mode

    if (!text) {
        return false
    }

    if (!schema.nodes.codeBlock) {
        view.pasteText(text)

        return true
    }

    if (!language) {
        return false
    }

    editor._tiptapEditor.view.pasteHTML(`<pre><code class="language-${language}">${text.replace(/\r\n?/g, '\n')}</code></pre>`)

    return true
}