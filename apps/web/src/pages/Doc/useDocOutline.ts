import { LcwDocEditor } from '@lcw-doc/core'
import { useEditorChange, useEditorSelectionChange } from '@lcw-doc/react'
import { useCallback, useEffect, useRef, useState } from 'react'

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
    const scrollContainerRef = useRef<HTMLElement | null>(null)

    const updateOutline = () => {
        const newHeadings = getHeadingsFromBlocks(editor)
        setHeadings(newHeadings)
        setActiveHeadingId(getActiveHeadingId(editor, newHeadings))
    }

    const updateActiveHeadingByScroll = useCallback(() => {
        if (!scrollContainerRef.current) return
        const container = scrollContainerRef.current
        const scrollTop = container.scrollTop
        const containerRect = container.getBoundingClientRect()
        const viewportTop = scrollTop + 80

        let activeId: string | null = null
        for (const heading of headings) {
            const el = document.querySelector(`[data-id="${heading.id}"]`)
            if (!el) continue
            const rect = el.getBoundingClientRect()
            const elementTop = rect.top - containerRect.top + scrollTop
            if (elementTop <= viewportTop) {
                activeId = heading.id
            }
        }
        if (activeId) {
            setActiveHeadingId(activeId)
        }
    }, [headings])

    useEffect(() => {
        const editorEl = document.querySelector('.bn-editor')
        if (!editorEl) return
        const scrollEl = editorEl.closest('.overflow-auto')
        if (!scrollEl) return
        scrollContainerRef.current = scrollEl as HTMLElement

        const handleScroll = () => {
            requestAnimationFrame(updateActiveHeadingByScroll)
        }
        scrollEl.addEventListener('scroll', handleScroll, { passive: true })
        return () => {
            scrollEl.removeEventListener('scroll', handleScroll)
        }
    }, [updateActiveHeadingByScroll])

    useEditorChange(updateOutline, editor)
    useEditorSelectionChange(updateOutline, editor)

    return { headings, activeHeadingId }
}
