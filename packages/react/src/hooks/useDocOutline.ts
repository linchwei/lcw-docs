import { HeadingItem, LcwDocEditor } from '@lcw-doc/core'
import { useCallback, useEffect, useRef, useState } from 'react'

import { useEditorChange } from './useEditorChange'
import { useEditorSelectionChange } from './useEditorSelectionChange'

export function useDocOutline(editor: LcwDocEditor<any, any, any>) {
    const [headings, setHeadings] = useState<HeadingItem[]>([])
    const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null)
    const scrollContainerRef = useRef<HTMLElement | null>(null)
    const isScrollingRef = useRef(false)

    const updateFromStorage = useCallback(() => {
        const outlineStorage = (editor._tiptapEditor.storage as any).outline
        if (outlineStorage) {
            setHeadings([...outlineStorage.headings])
            if (!isScrollingRef.current) {
                setActiveHeadingId(outlineStorage.activeHeadingId)
            }
        }
    }, [editor])

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
            isScrollingRef.current = true
            setActiveHeadingId(activeId)
            setTimeout(() => {
                isScrollingRef.current = false
            }, 150)
        }
    }, [headings])

    useEffect(() => {
        const editorDom = editor._tiptapEditor.view.dom as HTMLElement
        if (!editorDom) return
        const scrollEl = editorDom.closest('[class*="overflow"]') as HTMLElement | null
        if (!scrollEl) return
        scrollContainerRef.current = scrollEl

        const handleScroll = () => {
            requestAnimationFrame(updateActiveHeadingByScroll)
        }
        scrollEl.addEventListener('scroll', handleScroll, { passive: true })
        return () => {
            scrollEl.removeEventListener('scroll', handleScroll)
        }
    }, [editor, updateActiveHeadingByScroll])

    useEditorChange(updateFromStorage, editor)
    useEditorSelectionChange(updateFromStorage, editor)

    useEffect(() => {
        updateFromStorage()
    }, [updateFromStorage])

    const scrollToHeading = useCallback(
        (blockId: string) => {
            const container = scrollContainerRef.current
            if (!container) return

            const el = document.querySelector(`[data-id="${blockId}"]`)
            if (!el) return

            const containerRect = container.getBoundingClientRect()
            const elRect = el.getBoundingClientRect()
            const scrollTop = container.scrollTop
            const targetTop = elRect.top - containerRect.top + scrollTop - 100

            container.scrollTo({ top: targetTop, behavior: 'smooth' })

            const highlightEl = document.createElement('div')
            highlightEl.className = 'bn-heading-highlight-overlay'
            highlightEl.style.top = `${elRect.top - containerRect.top + scrollTop}px`
            highlightEl.style.height = `${elRect.height}px`
            container.appendChild(highlightEl)

            setTimeout(() => {
                highlightEl.remove()
            }, 2000)

            editor.focus()
        },
        [editor]
    )

    return { headings, activeHeadingId, scrollToHeading }
}
