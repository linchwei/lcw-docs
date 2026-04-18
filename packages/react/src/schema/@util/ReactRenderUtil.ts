import { LcwDocEditor } from '@Lcw-doc/core'
import { flushSync } from 'react-dom'
import { createRoot, Root } from 'react-dom/client'

export function renderToDOMSpec(
    fc: (refCB: (ref: HTMLElement | null) => void) => React.ReactNode,
    editor: LcwDocEditor<any, any, any> | undefined
) {
    let contentDOM: HTMLElement | undefined
    const div = document.createElement('div')

    let root: Root | undefined

    if (editor?.elementRenderer) {
        editor.elementRenderer(
            fc(el => (contentDOM = el || undefined)),
            div
        )
    } else {
        root = createRoot(div)
        flushSync(() => {
            root!.render(fc(el => (contentDOM = el || undefined)))
        })
    }

    if (!div.childElementCount) {
        console.warn('ReactInlineContentSpec: renderHTML() failed')
        return {
            dom: document.createElement('span'),
        }
    }

    contentDOM?.setAttribute('data-tmp-find', 'true')
    const cloneRoot = div.cloneNode(true) as HTMLElement
    const dom = cloneRoot.firstElementChild! as HTMLElement
    const contentDOMClone = cloneRoot.querySelector('[data-tmp-find]') as HTMLElement | null
    contentDOMClone?.removeAttribute('data-tmp-find')

    root?.unmount()

    return {
        dom,
        contentDOM: contentDOMClone || undefined,
    }
}
