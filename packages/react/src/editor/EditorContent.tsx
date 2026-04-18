import { LcwDocEditor } from '@lcw-doc/core'
import { ReactRenderer } from '@tiptap/react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface PortalsProps {
    renderers: Record<string, ReactRenderer>
}

function Portals({ renderers }: PortalsProps) {
    return (
        <>
            {Object.entries(renderers).map(([key, renderer]) => {
                return createPortal(renderer.reactElement, renderer.element, key)
            })}
        </>
    )
}

export function EditorContent(props: { editor: LcwDocEditor<any, any, any>; children: any }) {
    const [renderers, setRenderers] = useState<Record<string, ReactRenderer>>({})

    useEffect(() => {
        props.editor._tiptapEditor.contentComponent = {
            setRenderer(id: string, renderer: ReactRenderer) {
                setRenderers(renderers => ({ ...renderers, [id]: renderer }))
            },

            removeRenderer(id: string) {
                setRenderers(renderers => {
                    const nextRenderers = { ...renderers }

                    delete nextRenderers[id]

                    return nextRenderers
                })
            },
        }

        queueMicrotask(() => {
            props.editor._tiptapEditor.createNodeViews()
        })
        return () => {
            props.editor._tiptapEditor.contentComponent = null
        }
    }, [props.editor._tiptapEditor])

    return (
        <>
            <Portals renderers={renderers} />
            {props.children}
        </>
    )
}
