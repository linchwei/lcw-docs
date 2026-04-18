import { LcwDocEditor } from '@lcw-doc/core'
import { useEditorChange, useEditorSelectionChange } from '@lcw-doc/react'
import { useCallback, useState } from 'react'

interface HeadingItem {
    id: string
    level: number
    text: string
}

function extractTextFromContent(content: any[] | undefined): string {
    if (!content) return ''
    return content
        .map(item => {
            if (typeof item === 'string') return item
            if (item && typeof item === 'object' && 'text' in item) return item.text
            if (item && typeof item === 'object' && 'content' in item && Array.isArray(item.content)) {
                return extractTextFromContent(item.content)
            }
            return ''
        })
        .join('')
}

function getHeadingsFromBlocks(editor: LcwDocEditor): HeadingItem[] {
    const blocks = editor.document
    const headings: HeadingItem[] = []

    for (const block of blocks) {
        if (block.type === 'heading') {
            const level = (block.props as any).level ?? 1
            const text = extractTextFromContent(block.content as any[] | undefined)
            headings.push({
                id: block.id,
                level,
                text,
            })
        }
    }

    return headings
}

function getActiveHeadingId(editor: LcwDocEditor, headings: HeadingItem[]): string | null {
    if (headings.length === 0) return null

    try {
        const currentBlock = editor.getTextCursorPosition().block
        const blocks = editor.document
        const currentIndex = blocks.findIndex(b => b.id === currentBlock.id)

        if (currentIndex === -1) return headings.length > 0 ? headings[0].id : null

        let activeHeadingId: string | null = null
        for (const heading of headings) {
            const headingIndex = blocks.findIndex(b => b.id === heading.id)
            if (headingIndex !== -1 && headingIndex <= currentIndex) {
                activeHeadingId = heading.id
            }
        }

        return activeHeadingId
    } catch {
        return headings.length > 0 ? headings[0].id : null
    }
}

export function useDocOutline(editor: LcwDocEditor) {
    const [headings, setHeadings] = useState<HeadingItem[]>(() => getHeadingsFromBlocks(editor))
    const [activeHeadingId, setActiveHeadingId] = useState<string | null>(() =>
        getActiveHeadingId(editor, getHeadingsFromBlocks(editor))
    )

    const updateOutline = useCallback(() => {
        const newHeadings = getHeadingsFromBlocks(editor)
        setHeadings(newHeadings)
        setActiveHeadingId(getActiveHeadingId(editor, newHeadings))
    }, [editor])

    useEditorChange(updateOutline, editor)
    useEditorSelectionChange(updateOutline, editor)

    return { headings, activeHeadingId }
}
