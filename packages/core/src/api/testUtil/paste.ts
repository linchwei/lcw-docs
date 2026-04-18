/**
 * 粘贴测试工具
 *
 * 该文件提供在测试环境中模拟粘贴功能的工具。
 * 复制了 ProseMirror 的 doPaste 函数，使其能在 JSDOM 环境中工作。
 */
import { Slice } from '@tiptap/pm/model'
import { EditorView } from '@tiptap/pm/view'
import * as pmView from '@tiptap/pm/view'

/**
 * 从切片中获取单个节点
 *
 * @param slice - 切片
 * @returns 如果切片只包含一个节点则返回该节点，否则返回 null
 */
function sliceSingleNode(slice: Slice) {
    return slice.openStart === 0 && slice.openEnd === 0 && slice.content.childCount === 1 ? slice.content.firstChild : null
}

/**
 * 执行粘贴操作
 *
 * 该函数是 ProseMirror doPaste 函数的副本，
 * 移除了 tr.scrollIntoView 调用以适应 JSDOM 环境。
 *
 * @param view - 编辑器视图
 * @param text - 纯文本
 * @param html - HTML 字符串
 * @param preferPlain - 是否优先纯文本
 * @param event - 剪贴板事件
 * @returns 返回是否成功处理
 */
export function doPaste(view: EditorView, text: string, html: string | null, preferPlain: boolean, event: ClipboardEvent) {
    const slice = (pmView as any).__parseFromClipboard(view, text, html, preferPlain, view.state.selection.$from)
    if (view.someProp('handlePaste', f => f(view, event, slice || Slice.empty))) {
        return true
    }
    if (!slice) {
        return false
    }

    const singleNode = sliceSingleNode(slice)
    const tr = singleNode ? view.state.tr.replaceSelectionWith(singleNode, preferPlain) : view.state.tr.replaceSelection(slice)
    view.dispatch(tr.setMeta('paste', true).setMeta('uiEvent', 'paste'))
    return true
}