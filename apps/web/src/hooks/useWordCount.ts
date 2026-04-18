import { LcwDocEditor } from '@lcw-doc/core'
import { useCallback, useEffect, useRef, useState } from 'react'

import { WordCountResult, calculateSelectionWordCount, calculateWordCount } from '@/utils/wordCount'

export interface WordCountState {
    charsWithSpaces: number
    charsWithoutSpaces: number
    words: number
    paragraphs: number
    sentences: number
    readingTimeText: string
    hasSelection: boolean
    selectionChars: number
    selectionWords: number
}

const initialState: WordCountState = {
    charsWithSpaces: 0,
    charsWithoutSpaces: 0,
    words: 0,
    paragraphs: 0,
    sentences: 0,
    readingTimeText: '不足1分钟',
    hasSelection: false,
    selectionChars: 0,
    selectionWords: 0,
}

export function useWordCount(editor: LcwDocEditor<any, any, any> | null): WordCountState {
    const [state, setState] = useState<WordCountState>(initialState)
    const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

    const updateWordCount = useCallback(() => {
        if (!editor) return

        try {
            const tiptapEditor = editor._tiptapEditor
            const { state: editorState } = tiptapEditor
            const text = editorState.doc.textContent || ''

            let paragraphs = 0
            editorState.doc.descendants(node => {
                if (node.isBlock && node.textContent.trim().length > 0) {
                    paragraphs++
                }
            })

            const result: WordCountResult = calculateWordCount(text)
            result.paragraphs = paragraphs

            const { from, to, empty } = editorState.selection
            let hasSelection = false
            let selectionChars = 0
            let selectionWords = 0

            if (!empty && from !== undefined && to !== undefined) {
                try {
                    const selectedText = editorState.doc.textBetween(from, to, '\n')
                    if (selectedText && selectedText.trim().length > 0) {
                        const selResult = calculateSelectionWordCount(selectedText)
                        hasSelection = true
                        selectionChars = selResult.charsWithoutSpaces
                        selectionWords = selResult.words
                    }
                } catch {
                    hasSelection = false
                }
            }

            setState({
                charsWithSpaces: result.charsWithSpaces,
                charsWithoutSpaces: result.charsWithoutSpaces,
                words: result.words,
                paragraphs: result.paragraphs,
                sentences: result.sentences,
                readingTimeText: result.readingTimeText,
                hasSelection,
                selectionChars,
                selectionWords,
            })
        } catch {
            // ignore errors during calculation
        }
    }, [editor])

    useEffect(() => {
        if (!editor) return

        updateWordCount()

        const unsubChange = editor.onChange(() => {
            clearTimeout(timerRef.current)
            timerRef.current = setTimeout(updateWordCount, 300)
        })
        const unsubSelection = editor.onSelectionChange(() => {
            clearTimeout(timerRef.current)
            timerRef.current = setTimeout(updateWordCount, 100)
        })

        return () => {
            clearTimeout(timerRef.current)
            if (typeof unsubChange === 'function') unsubChange()
            if (typeof unsubSelection === 'function') unsubSelection()
        }
    }, [editor, updateWordCount])

    return state
}
