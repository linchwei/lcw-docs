import '@lcw-doc/shadcn/style.css'
import '@/editor-styles.css'

import {
    defaultBlockSpecs,
    defaultInlineContentSpecs,
    defaultStyleSpecs,
    filterSuggestionItems,
    LcwDocEditor,
    LcwDocSchema,
    locales,
    PartialBlock,
} from '@lcw-doc/core'
import {
    createAISlashMenuItem,
    DefaultReactSuggestionItem,
    getDefaultReactSlashMenuItems,
    SideMenuController,
    SuggestionMenuController,
    useCreateLcwDoc,
    useGhostText,
} from '@lcw-doc/react'
import { LcwDocView } from '@lcw-doc/shadcn'
import { useQuery } from '@tanstack/react-query'
import { Sparkles } from 'lucide-react'
import PubSub from 'pubsub-js'
import { useEffect, useMemo, useState } from 'react'
import { WebsocketProvider } from 'y-websocket'
import * as Y from 'yjs'

import { AI } from '@/blocks/ai'
import { Mention } from '@/blocks/mention'
import { BasicAIChat } from '@/components/BasicAIChat'
import { EditorSideMenu } from '@/components/EditorSideMenu'
import { CustomInputRules } from '@/extensions/CustomInputRules'
import { Highlight, Subscript, Superscript } from '@/extensions/HighlightSupSubMarks'
import { LinkInputRule } from '@/extensions/LinkInputRule'
import * as srv from '@/services'
import { chatWithAI } from '@/services/ai'
import { User } from '@/types/api'

import { cursorRender } from './cursorRender'

interface DocEditorProps {
    pageId: string
    initialContent?: PartialBlock[]
    doc: Y.Doc
    provider: WebsocketProvider
    onEditorReady?: (editor: LcwDocEditor<any, any, any>) => void
    editable?: boolean
}

const schema = LcwDocSchema.create({
    inlineContentSpecs: {
        ...defaultInlineContentSpecs,
        mention: Mention,
    },
    blockSpecs: {
        ...defaultBlockSpecs,
        ai: AI,
    },
    styleSpecs: {
        ...defaultStyleSpecs,
        highlight: Highlight,
        superscript: Superscript,
        subscript: Subscript,
    },
})

// Function which gets all users for the mentions menu.
const getMentionMenuItems = async (editor: typeof schema.LcwDocEditor, pageId?: string): Promise<DefaultReactSuggestionItem[]> => {
    const items: DefaultReactSuggestionItem[] = []
    // 获取远程页面
    const res = await srv.fetchPageList()
    const pages = res.data.pages

    for (const page of pages) {
        if (page.pageId !== pageId) {
            items.push({
                icon: <span>{page.emoji}</span>,
                title: page.title,
                onItemClick: () => {
                    editor.insertInlineContent([
                        {
                            type: 'mention',
                            props: {
                                id: page.pageId,
                                title: page.title,
                                icon: page.emoji,
                            },
                        },
                        ' ', // add a space after the mention
                    ])
                },
            })
        }
    }

    return items
}

// Slash menu item to insert an AI block
const aiMenuItem = (editor: typeof schema.LcwDocEditor) =>
    createAISlashMenuItem(editor, {
        onInsert: blockId => PubSub.publishSync('ai-inserted', blockId),
        icon: <Sparkles color="#6B45FF" size={18} />,
    })

export function DocEditor(props: DocEditorProps) {
    const { pageId, doc, provider, onEditorReady, editable = true } = props

    const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'))

    useEffect(() => {
        const observer = new MutationObserver(() => {
            setIsDark(document.documentElement.classList.contains('dark'))
        })
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
        return () => observer.disconnect()
    }, [])

    const { data: currentUser } = useQuery<User>({
        queryKey: ['currentUser'],
        queryFn: async () => {
            const res = await srv.currentUser()
            return res.data
        },
    })

    const randomColor = useMemo(() => {
        const storedColor = sessionStorage.getItem('lcwdoc-user-color')
        if (storedColor) {
            return storedColor
        }
        const r = Math.floor(Math.random() * 256)
        const g = Math.floor(Math.random() * 256)
        const b = Math.floor(Math.random() * 256)
        const color = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
        sessionStorage.setItem('lcwdoc-user-color', color)
        return color
    }, [])

    const editor = useCreateLcwDoc(
        {
            schema,
            dictionary: locales.zh,
            _tiptapOptions: {
                extensions: [CustomInputRules, LinkInputRule],
            },
            // initialContent,
            collaboration: {
                provider,
                fragment: doc.getXmlFragment(`document-store-${pageId}`),
                user: {
                    name: currentUser?.username ?? '',
                    color: randomColor,
                },
                renderCursor: cursorRender,
            },
            uploadFile: async (file: File) => {
                const url = await srv.uploadFile(file)
                return url
            },
            resolveFileUrl: async (url: string) => {
                return url.startsWith('http') ? url : url
            },
        },
        [pageId, provider, doc, currentUser]
    )

    useEffect(() => {
        if (editor && onEditorReady) {
            onEditorReady(editor)
        }
    }, [editor, onEditorReady])

    useGhostText(editor, chatWithAI)

    return (
        <LcwDocView editor={editor} editable={editable} theme={isDark ? 'dark' : 'light'} slashMenu={false} sideMenu={false}>
            <SideMenuController sideMenu={EditorSideMenu} />
            <SuggestionMenuController
                triggerCharacter="@"
                getItems={async query => {
                    const items = await getMentionMenuItems(editor, pageId)
                    return filterSuggestionItems(items, query)
                }}
            />
            {/* Replaces the default Slash Menu. */}
            <SuggestionMenuController
                triggerCharacter="/"
                getItems={async query => filterSuggestionItems([aiMenuItem(editor), ...getDefaultReactSlashMenuItems(editor)], query)}
            />
            <BasicAIChat editor={editor} />
        </LcwDocView>
    )
}
