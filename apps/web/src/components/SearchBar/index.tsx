import { LcwDocEditor } from '@lcw-doc/core'
import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { ArrowDown, ArrowUp, Replace, Search, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

const searchHighlightKey = new PluginKey('searchHighlight')

interface SearchBarProps {
    editor: LcwDocEditor | null
    open: boolean
    onClose: () => void
    replaceMode?: boolean
}

function findMatches(doc: any, searchText: string): { from: number; to: number }[] {
    const matches: { from: number; to: number }[] = []
    const searchLower = searchText.toLowerCase()
    doc.descendants((node: any, pos: number) => {
        if (!node.isText) return
        const text = node.text!.toLowerCase()
        let index = 0
        while ((index = text.indexOf(searchLower, index)) !== -1) {
            matches.push({ from: pos + index, to: pos + index + searchText.length })
            index += 1
        }
    })
    return matches
}

export function SearchBar({ editor, open, onClose, replaceMode: initialReplaceMode }: SearchBarProps) {
    const [searchText, setSearchText] = useState('')
    const [replaceText, setReplaceText] = useState('')
    const [replaceMode, setReplaceMode] = useState(initialReplaceMode || false)
    const [matchCount, setMatchCount] = useState(0)
    const [currentMatch, setCurrentMatch] = useState(0)
    const searchInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (open && searchInputRef.current) {
            searchInputRef.current.focus()
        }
    }, [open])

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!open) return
            if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
                e.preventDefault()
                searchInputRef.current?.focus()
            }
            if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'h') {
                e.preventDefault()
                setReplaceMode(true)
            }
            if (e.key === 'Escape') {
                clearDecorations()
                onClose()
            }
            if (e.key === 'Enter') {
                e.preventDefault()
                if (e.shiftKey) {
                    findPrev()
                } else {
                    findNext()
                }
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    })

    const performSearch = useCallback(() => {
        if (!editor || !searchText) {
            setMatchCount(0)
            setCurrentMatch(0)
            clearDecorations()
            return
        }
        const view = editor._tiptapEditor.view
        const matches = findMatches(view.state.doc, searchText)
        setMatchCount(matches.length)
        setCurrentMatch(matches.length > 0 ? 1 : 0)
        clearDecorations()
        if (matches.length > 0) {
            highlightMatches(matches)
        }
    }, [editor, searchText])

    const highlightMatches = useCallback((matches: { from: number; to: number }[]) => {
        if (!editor) return
        const view = editor._tiptapEditor.view
        const activeIndex = Math.max(0, currentMatch - 1)

        const decorations = matches.map((match, i) =>
            Decoration.inline(match.from, match.to, {
                class: i === activeIndex ? 'search-match search-match-active' : 'search-match',
            })
        )

        const decSet = DecorationSet.create(view.state.doc, decorations)
        const existingPlugin = searchHighlightKey.get(view.state)

        if (!existingPlugin) {
            const plugin = new Plugin({
                key: searchHighlightKey,
                props: {
                    decorations: () => decSet,
                },
            })
            view.updateState(view.state.reconfigure({ plugins: [...view.state.plugins, plugin] }))
        } else {
            const tr = view.state.tr.setMeta('searchHighlight', { decorations: decSet })
            view.dispatch(tr)
        }
    }, [editor, currentMatch])

    const clearDecorations = useCallback(() => {
        if (!editor) return
        const view = editor._tiptapEditor.view
        const existingPlugin = searchHighlightKey.get(view.state)
        if (existingPlugin) {
            const plugins = view.state.plugins.filter((p: any) => p !== existingPlugin)
            view.updateState(view.state.reconfigure({ plugins }))
        }
    }, [editor])

    useEffect(() => {
        const timer = setTimeout(performSearch, 200)
        return () => clearTimeout(timer)
    }, [performSearch])

    const findNext = useCallback(() => {
        if (!editor || matchCount === 0) return
        const next = currentMatch >= matchCount ? 1 : currentMatch + 1
        setCurrentMatch(next)
        scrollToMatch(next - 1)
    }, [editor, currentMatch, matchCount])

    const findPrev = useCallback(() => {
        if (!editor || matchCount === 0) return
        const prev = currentMatch <= 1 ? matchCount : currentMatch - 1
        setCurrentMatch(prev)
        scrollToMatch(prev - 1)
    }, [editor, currentMatch, matchCount])

    const scrollToMatch = useCallback((index: number) => {
        if (!editor || !searchText) return
        const view = editor._tiptapEditor.view
        const matches = findMatches(view.state.doc, searchText)
        if (matches[index]) {
            view.dispatch(
                view.state.tr.setSelection(
                    TextSelection.create(view.state.doc, matches[index].from, matches[index].to)
                )
            )
            view.focus()
        }
    }, [editor, searchText])

    const handleReplace = useCallback(() => {
        if (!editor || !searchText || matchCount === 0) return
        const view = editor._tiptapEditor.view
        const searchLower = searchText.toLowerCase()
        let replaced = false

        view.state.doc.descendants((node: any, pos: number) => {
            if (replaced || !node.isText) return
            const text = node.text!.toLowerCase()
            const index = text.indexOf(searchLower)
            if (index !== -1) {
                const from = pos + index
                const to = pos + index + searchText.length
                const tr = view.state.tr.replaceWith(from, to, view.state.schema.text(replaceText))
                view.dispatch(tr)
                replaced = true
            }
        })

        if (replaced) {
            setTimeout(performSearch, 50)
        }
    }, [editor, searchText, replaceText, matchCount, performSearch])

    const handleReplaceAll = useCallback(() => {
        if (!editor || !searchText || matchCount === 0) return
        const view = editor._tiptapEditor.view
        const matches = findMatches(view.state.doc, searchText)
        if (matches.length === 0) return

        let tr = view.state.tr
        let offset = 0
        for (const match of matches) {
            tr = tr.replaceWith(match.from + offset, match.to + offset, view.state.schema.text(replaceText))
            offset += replaceText.length - (match.to - match.from)
        }
        view.dispatch(tr)
        setTimeout(performSearch, 50)
    }, [editor, searchText, replaceText, matchCount, performSearch])

    if (!open) return null

    return (
        <div className="sticky top-[52px] z-20 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700 px-4 py-2 flex items-center gap-2">
            <Search size={14} className="text-zinc-400 shrink-0" />
            <input
                ref={searchInputRef}
                type="text"
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                placeholder="查找..."
                className="flex-1 min-w-0 text-sm bg-transparent outline-none placeholder:text-zinc-400"
            />
            {matchCount > 0 && (
                <span className="text-xs text-zinc-500 shrink-0 whitespace-nowrap">
                    {currentMatch}/{matchCount}
                </span>
            )}
            <button
                onClick={findPrev}
                disabled={matchCount === 0}
                className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 transition-colors"
                title="上一个 (Shift+Enter)"
            >
                <ArrowUp size={14} />
            </button>
            <button
                onClick={findNext}
                disabled={matchCount === 0}
                className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 transition-colors"
                title="下一个 (Enter)"
            >
                <ArrowDown size={14} />
            </button>
            <button
                onClick={() => setReplaceMode(!replaceMode)}
                className={`p-1 rounded transition-colors ${replaceMode ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400'}`}
                title="替换 (Ctrl+Shift+H)"
            >
                <Replace size={14} />
            </button>
            <button
                onClick={() => { clearDecorations(); onClose() }}
                className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 transition-colors"
                title="关闭 (Esc)"
            >
                <X size={14} />
            </button>
            {replaceMode && (
                <>
                    <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700" />
                    <input
                        type="text"
                        value={replaceText}
                        onChange={e => setReplaceText(e.target.value)}
                        placeholder="替换为..."
                        className="flex-1 min-w-0 text-sm bg-transparent outline-none placeholder:text-zinc-400"
                        onKeyDown={e => {
                            if (e.key === 'Enter') {
                                e.preventDefault()
                                handleReplace()
                            }
                        }}
                    />
                    <button
                        onClick={handleReplace}
                        disabled={matchCount === 0}
                        className="px-2 py-0.5 text-xs rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-30 transition-colors"
                    >
                        替换
                    </button>
                    <button
                        onClick={handleReplaceAll}
                        disabled={matchCount === 0}
                        className="px-2 py-0.5 text-xs rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-30 transition-colors"
                    >
                        全部替换
                    </button>
                </>
            )}
        </div>
    )
}
