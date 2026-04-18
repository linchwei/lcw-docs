import '@lcw-doc/shadcn/style.css'
import '@/editor-styles.css'

import {
    defaultBlockSpecs,
    defaultInlineContentSpecs,
    defaultStyleSpecs,
    filterSuggestionItems,
    insertOrUpdateBlock,
    LcwDocEditor,
    LcwDocSchema,
    locales,
    PartialBlock,
} from '@lcw-doc/core'
import { DefaultReactSuggestionItem, getDefaultReactSlashMenuItems, SuggestionMenuController, useCreateLcwDoc } from '@lcw-doc/react'
import { LcwDocView } from '@lcw-doc/shadcn'
import { useQuery } from '@tanstack/react-query'
import { AlertCircle, Minus, Sparkles, Table as TableIcon, TextQuote } from 'lucide-react'
import PubSub from 'pubsub-js'
import { useEffect, useMemo, useState } from 'react'
// import { yXmlFragmentToProseMirrorFragment, yXmlFragmentToProseMirrorRootNode } from 'y-prosemirror'
import { WebsocketProvider } from 'y-websocket'
import * as Y from 'yjs'

import { AI } from '@/blocks/ai'
import { Blockquote } from '@/blocks/blockquote'
import { Callout } from '@/blocks/callout'
import { Divider } from '@/blocks/divider'
import { Mention } from '@/blocks/mention'
import { BasicAIChat } from '@/components/BasicAIChat'
import { CustomInputRules } from '@/extensions/CustomInputRules'
import { Highlight, Superscript, Subscript } from '@/extensions/HighlightSupSubMarks'
import { LinkInputRule } from '@/extensions/LinkInputRule'
import { SelectionAIMenu } from '@/components/SelectionAIMenu'
import * as srv from '@/services'
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
        blockquote: Blockquote,
        divider: Divider,
        callout: Callout,
    },
    styleSpecs: {
        ...defaultStyleSpecs,
        highlight: Highlight,
        superscript: Superscript,
        subscript: Subscript,
    },
})

// Function which gets all users for the mentions menu.
const getMentionMenuItems = async (editor: LcwDocEditor, pageId?: string): Promise<DefaultReactSuggestionItem[]> => {
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
                            // @ts-expect-error mention type
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

// Slash menu item to insert an Alert block
const insertAI = (editor: typeof schema.LcwDocEditor) => ({
    title: 'AI',
    subtext: 'AI，让进取的人更具职业价值',
    onItemClick: () => {
        const aiAnchorBlock = insertOrUpdateBlock(editor, {
            type: 'paragraph',
        })
        const { id: aiAnchorBlockId } = aiAnchorBlock

        PubSub.publishSync('ai-inserted', aiAnchorBlockId)
    },
    aliases: ['alert', 'notification', 'emphasize', 'warning', 'error', 'info', 'success'],
    icon: <Sparkles color="#6B45FF" size={18} />,
})

const insertBlockquote = (editor: typeof schema.LcwDocEditor) => ({
    title: '引用',
    subtext: '引用一段文字',
    onItemClick: () => {
        insertOrUpdateBlock(editor, { type: 'blockquote' })
    },
    aliases: ['blockquote', 'quote', '引用'],
    icon: <TextQuote size={18} />,
})

const insertDivider = (editor: typeof schema.LcwDocEditor) => ({
    title: '分割线',
    subtext: '水平分割线',
    onItemClick: () => {
        insertOrUpdateBlock(editor, { type: 'divider' })
    },
    aliases: ['divider', 'hr', '分割线', '水平线'],
    icon: <Minus size={18} />,
})

const insertCallout = (editor: typeof schema.LcwDocEditor) => ({
    title: '提示框',
    subtext: '突出显示的信息提示',
    onItemClick: () => {
        insertOrUpdateBlock(editor, { type: 'callout', props: { calloutType: 'info' } })
    },
    aliases: ['callout', 'alert', 'notice', '提示框', '警告'],
    icon: <AlertCircle size={18} />,
})

const insertTable = (editor: typeof schema.LcwDocEditor) => ({
    title: '表格',
    subtext: '插入可编辑的表格',
    onItemClick: () => {
        insertOrUpdateBlock(editor, {
            type: 'table',
            content: {
                type: 'tableContent',
                rows: [{ cells: ['', '', ''] }, { cells: ['', '', ''] }],
            },
        })
    },
    aliases: ['table', '表格'],
    icon: <TableIcon size={18} />,
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

    const undoManager = useMemo(() => {
        const fragment = doc.getXmlFragment(`document-store-${pageId}`)
        return new Y.UndoManager(fragment, {
            trackedOrigins: new Set([doc.clientID]),
        })
    }, [doc, pageId])

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

    return (
        <LcwDocView editor={editor} editable={editable} theme={isDark ? 'dark' : 'light'} slashMenu={false}>
            <SuggestionMenuController
                triggerCharacter="@"
                getItems={async query => {
                    // @ts-expect-error getItems type
                    const items = await getMentionMenuItems(editor, pageId)
                    return filterSuggestionItems(items, query)
                }}
            />
            {/* Replaces the default Slash Menu. */}
            <SuggestionMenuController
                triggerCharacter="/"
                getItems={async query =>
                    filterSuggestionItems(
                        [
                            insertAI(editor),
                            insertBlockquote(editor),
                            insertDivider(editor),
                            insertCallout(editor),
                            insertTable(editor),
                            ...getDefaultReactSlashMenuItems(editor).filter(item => item.title !== '表格'),
                        ],
                        query
                    )
                }
            />
            {/* @ts-expect-error editor schema type fix */}
            <BasicAIChat editor={editor} />
            <SelectionAIMenu editor={editor} />
        </LcwDocView>
    )
}
