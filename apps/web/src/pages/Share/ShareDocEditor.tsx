import '@lcw-doc/shadcn/style.css'
import '@/editor-styles.css'

import { defaultBlockSpecs, defaultInlineContentSpecs, LcwDocSchema } from '@lcw-doc/core'
import { useCreateLcwDoc } from '@lcw-doc/react'
import { LcwDocView } from '@lcw-doc/shadcn'
import { useEffect, useMemo, useState } from 'react'
import { WebsocketProvider } from 'y-websocket'
import * as Y from 'yjs'

import { AI } from '@/blocks/ai'
import { Blockquote } from '@/blocks/blockquote'
import { Callout } from '@/blocks/callout'
import { Divider } from '@/blocks/divider'
import { Mention } from '@/blocks/mention'

const schema = LcwDocSchema.create({
    inlineContentSpecs: {
        ...defaultInlineContentSpecs,
        mention: Mention,
    },
    blockSpecs: {
        ...defaultBlockSpecs,
        ai: AI,
        blockquote: Blockquote,
        divider: Divider,
        callout: Callout,
    },
})

interface ShareDocEditorProps {
    pageId: string
    shareId: string
    password?: string
    permission?: string
}

export function ShareDocEditor({ pageId, shareId, password, permission }: ShareDocEditorProps) {
    const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'))

    useEffect(() => {
        const observer = new MutationObserver(() => {
            setIsDark(document.documentElement.classList.contains('dark'))
        })
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
        return () => observer.disconnect()
    }, [])

    const visitorInfo = useMemo(() => {
        let stored = sessionStorage.getItem('lcwdoc-visitor-info')
        if (!stored) {
            const id = Math.floor(Math.random() * 9000 + 1000)
            stored = JSON.stringify({ name: `访客${id}`, color: `hsl(${Math.floor(Math.random() * 360)}, 60%, 65%)` })
            sessionStorage.setItem('lcwdoc-visitor-info', stored)
        }
        return JSON.parse(stored)
    }, [])

    const doc = useMemo(() => new Y.Doc(), [pageId])
    const wsUrl = import.meta.env.VITE_WS_HOST ? `wss://${import.meta.env.VITE_WS_HOST}` : 'ws://localhost:8082'
    const provider = useMemo(() => {
        const wsParams: any = {
            connect: false,
            params: { shareId, ...(password ? { password } : {}) },
        }
        return new WebsocketProvider(wsUrl, `doc-yjs-${pageId}`, doc, wsParams)
    }, [pageId, doc, wsUrl, shareId, password])

    useEffect(() => {
        provider.connect()
        return () => {
            provider.disconnect()
            doc.destroy()
        }
    }, [provider, doc])

    const editor = useCreateLcwDoc(
        {
            schema,
            _tiptapOptions: {},
            collaboration: {
                provider,
                fragment: doc.getXmlFragment(`document-store-${pageId}`),
                user: visitorInfo,
            },
        },
        [pageId, provider, doc]
    )

    return <LcwDocView editor={editor} editable={permission === 'edit'} theme={isDark ? 'dark' : 'light'} />
}
