<script setup lang="ts">
import {
    defaultBlockSpecs,
    defaultInlineContentSpecs,
    defaultStyleSpecs,
    filterSuggestionItems,
    LcwDocEditor,
    LcwDocSchema,
    locales,
} from '@lcw-doc/core'
import { LcwDocView } from '@lcw-doc/vue'
import { useQuery } from '@tanstack/vue-query'
import { WebsocketProvider } from 'y-websocket'
import * as Y from 'yjs'
import { onBeforeUnmount, watch, shallowRef } from 'vue'

import * as srv from '@/services'
import type { User } from '@/types/api'

import { Blockquote } from '@/blocks/blockquote'
import { Divider } from '@/blocks/divider'
import { Callout } from '@/blocks/callout'
import { AI } from '@/blocks/ai'
import { Mention } from '@/blocks/mention'
import { CustomInputRules } from '@/extensions/CustomInputRules'
import { LinkInputRule } from '@/extensions/LinkInputRule'
import { Highlight, Superscript, Subscript } from '@/extensions/HighlightSupSubMarks'
import SuggestionMenuManager from './SuggestionMenuManager.vue'

interface Props {
    pageId: string
    editable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    editable: true,
})

const emit = defineEmits<{
    editorReady: [editor: LcwDocEditor<any, any, any>]
}>()

const schema = LcwDocSchema.create({
    inlineContentSpecs: {
        ...defaultInlineContentSpecs,
        mention: Mention,
    },
    blockSpecs: {
        ...defaultBlockSpecs,
        blockquote: Blockquote,
        divider: Divider,
        callout: Callout,
        ai: AI,
    },
    styleSpecs: {
        ...defaultStyleSpecs,
        highlight: Highlight,
        superscript: Superscript,
        subscript: Subscript,
    },
})

const doc = new Y.Doc()
const wsUrl = (window as any).__WS_URL__ || 'ws://localhost:8082'
const lsToken = localStorage.getItem('token')
const wsParams = lsToken ? { connect: false, params: { token: lsToken } } : { connect: false }
const provider = new WebsocketProvider(wsUrl, `doc-yjs-${props.pageId}`, doc, wsParams)

const randomColor = (() => {
    const stored = sessionStorage.getItem('lcwdoc-user-color')
    if (stored) return stored
    const r = Math.floor(Math.random() * 256)
    const g = Math.floor(Math.random() * 256)
    const b = Math.floor(Math.random() * 256)
    const color = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
    sessionStorage.setItem('lcwdoc-user-color', color)
    return color
})()

const { data: currentUser } = useQuery<User>({
    queryKey: ['currentUser'],
    queryFn: async () => {
        const res = await srv.currentUser()
        return res.data
    },
})

const editor = shallowRef<LcwDocEditor<any, any, any>>()

const e = LcwDocEditor.create({
    schema,
    dictionary: locales.zh,
    _tiptapOptions: {
        extensions: [CustomInputRules, LinkInputRule],
    },
    collaboration: {
        provider,
        fragment: doc.getXmlFragment(`document-store-${props.pageId}`),
        user: {
            name: currentUser.value?.username ?? '',
            color: randomColor,
        },
    },
    uploadFile: async (file: File) => srv.uploadFile(file),
    resolveFileUrl: async (url: string) => url.startsWith('http') ? url : url,
})
editor.value = e
emit('editorReady', e)

e.suggestionMenus.addTriggerCharacter('/')
e.suggestionMenus.addTriggerCharacter('@')

watch(currentUser, (user) => {
    if (user) {
        provider.awareness.setLocalStateField('user', {
            name: user.username,
            color: randomColor,
        })
    }
})

onBeforeUnmount(() => {
    provider.disconnect()
    doc.destroy()
    editor.value?._tiptapEditor?.destroy()
})

async function handleMentionQuery(query: string): Promise<any[]> {
    const res = await srv.fetchPageList()
    const pages = res.data.pages
    const items = pages
        .filter((p: any) => !query || p.title.includes(query))
        .map((page: any) => ({
            title: page.title,
            icon: page.emoji || '📄',
            onItemClick: () => {
                if (!editor.value) return
                editor.value.insertInlineContent([
                    {
                        type: 'mention' as const,
                        props: {
                            id: page.pageId,
                            title: page.title,
                            icon: page.emoji,
                        },
                    },
                    ' ',
                ])
            },
        }))
    return filterSuggestionItems(items, query)
}
</script>

<template>
    <div class="doc-editor-inner">
        <LcwDocView
            v-if="editor"
            :editor="editor"
            :editable="editable"
        >
            <SuggestionMenuManager
                :editor="editor"
                :mention-query="handleMentionQuery"
            />
        </LcwDocView>
    </div>
</template>

<style scoped>
.doc-editor-inner {
    min-height: 300px;
}
</style>
