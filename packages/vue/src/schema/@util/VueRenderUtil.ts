import { LcwDocEditor } from '@lcw-doc/core'
import { render, type VNode } from 'vue'

/**
 * Vue 版本的 renderToDOMSpec
 *
 * 将 Vue VNode 同步渲染到临时 DIV 中，提取 DOM 结构后返回。
 * Vue 的 render() 函数本身就是同步的，无需 flushSync 模式。
 */
export function renderToDOMSpec(fc: (refCB: (ref: HTMLElement | null) => void) => VNode, editor?: LcwDocEditor<any, any, any>) {
    const div = document.createElement('div')
    let contentDOM: HTMLElement | undefined

    const vnode = fc(el => (contentDOM = el || undefined))

    // 如果 editor 有 appContext，挂载到 vnode 上以便子组件获取 provide/inject
    const tiptapEditor = editor?._tiptapEditor as any
    if (tiptapEditor?.appContext) {
        vnode.appContext = tiptapEditor.appContext
    }

    render(vnode, div)

    if (!div.childElementCount) {
        console.warn('VueRenderUtil: renderHTML() failed')
        return {
            dom: document.createElement('span'),
        }
    }

    contentDOM?.setAttribute('data-tmp-find', 'true')
    const cloneRoot = div.cloneNode(true) as HTMLElement
    const dom = cloneRoot.firstElementChild! as HTMLElement
    const contentDOMClone = cloneRoot.querySelector('[data-tmp-find]') as HTMLElement | null
    contentDOMClone?.removeAttribute('data-tmp-find')

    render(null, div)

    return {
        dom,
        contentDOM: contentDOMClone || undefined,
    }
}
