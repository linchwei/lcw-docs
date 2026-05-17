import { Block, LcwDocEditor } from '@lcw-doc/core'
import { Copy, GripVertical, Plus, Scissors, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

const blockTypeMarks: Record<string, string | ((block: Block) => string)> = {
    heading: (block: Block) => {
        const level = (block.props as any).level || 1
        return '#'.repeat(level)
    },
    bulletListItem: '-',
    numberedListItem: '1.',
    checkListItem: '[]',
    codeBlock: '```',
    blockquote: '>',
}

function getBlockMark(block: Block): string | null {
    const mark = blockTypeMarks[block.type]
    if (typeof mark === 'function') {
        return mark(block)
    }
    return mark || null
}

function isBlockEmpty(block: Block): boolean {
    if (!block.content) return true
    if (Array.isArray(block.content) && block.content.length === 0) return true
    if (Array.isArray(block.content) && block.content.length === 1) {
        const item = block.content[0]
        if (item.type === 'text' && item.text === '') return true
    }
    return false
}

interface EditorSideMenuProps {
    editor: LcwDocEditor
    block: Block
    blockDragStart: (event: { dataTransfer: DataTransfer | null; clientY: number }) => void
    blockDragEnd: () => void
    freezeMenu: () => void
    unfreezeMenu: () => void
}

export function EditorSideMenu({ editor, block, blockDragStart, blockDragEnd, freezeMenu, unfreezeMenu }: EditorSideMenuProps) {
    const empty = isBlockEmpty(block)
    const mark = getBlockMark(block)
    const [menuOpen, setMenuOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    const handleAddClick = () => {
        if (empty) {
            editor.setTextCursorPosition(block)
            editor.openSuggestionMenu('/')
        } else {
            const insertedBlock = editor.insertBlocks([{ type: 'paragraph' }], block, 'after')[0]
            editor.setTextCursorPosition(insertedBlock)
            editor.openSuggestionMenu('/')
        }
    }

    const handleCopy = useCallback(async () => {
        setMenuOpen(false)
        const text = extractBlockText(block)
        try {
            await navigator.clipboard.writeText(text)
        } catch {
            const textarea = document.createElement('textarea')
            textarea.value = text
            document.body.appendChild(textarea)
            textarea.select()
            document.execCommand('copy')
            document.body.removeChild(textarea)
        }
    }, [editor, block])

    const handleCut = useCallback(async () => {
        setMenuOpen(false)
        const text = extractBlockText(block)
        try {
            await navigator.clipboard.writeText(text)
        } catch {
            const textarea = document.createElement('textarea')
            textarea.value = text
            document.body.appendChild(textarea)
            textarea.select()
            document.execCommand('copy')
            document.body.removeChild(textarea)
        }
        editor.removeBlocks([block])
    }, [editor, block])

    const handleDelete = useCallback(() => {
        setMenuOpen(false)
        editor.removeBlocks([block])
    }, [editor, block])

    const handleAddBelow = useCallback(() => {
        setMenuOpen(false)
        const insertedBlock = editor.insertBlocks([{ type: 'paragraph' }], block, 'after')[0]
        editor.setTextCursorPosition(insertedBlock)
        editor.openSuggestionMenu('/')
    }, [editor, block])

    useEffect(() => {
        if (!menuOpen) return
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false)
            }
        }
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setMenuOpen(false)
        }
        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('keydown', handleEscape)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('keydown', handleEscape)
        }
    }, [menuOpen])

    return (
        <div className="flex items-center gap-0.5 bn-side-menu relative">
            {empty ? (
                <button
                    onClick={handleAddClick}
                    className="flex items-center justify-center w-6 h-6 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
                    title="添加块"
                >
                    <Plus size={16} />
                </button>
            ) : mark ? (
                <button
                    draggable={true}
                    onDragStart={blockDragStart}
                    onDragEnd={blockDragEnd}
                    onMouseDown={freezeMenu}
                    className="flex items-center justify-center min-w-[24px] h-6 px-1 rounded-md text-[11px] font-mono text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors cursor-grab select-none"
                    title="拖拽移动"
                >
                    {mark}
                </button>
            ) : (
                <button
                    draggable={true}
                    onDragStart={blockDragStart}
                    onDragEnd={blockDragEnd}
                    onMouseDown={freezeMenu}
                    className="flex items-center justify-center w-6 h-6 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors cursor-grab"
                    title="拖拽移动"
                >
                    <GripVertical size={16} />
                </button>
            )}
            {!empty && (
                <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex items-center justify-center w-5 h-6 rounded-md text-zinc-300 hover:text-zinc-500 hover:bg-zinc-100 transition-colors"
                    title="更多操作"
                >
                    <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor">
                        <circle cx="6" cy="3" r="1.5"/>
                        <circle cx="6" cy="8" r="1.5"/>
                        <circle cx="6" cy="13" r="1.5"/>
                    </svg>
                </button>
            )}
            {menuOpen && (
                <div
                    ref={menuRef}
                    className="absolute left-0 top-8 z-50 min-w-[160px] bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 py-1 animate-in fade-in-0 zoom-in-95"
                >
                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-2.5 w-full px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                    >
                        <Copy size={14} className="text-zinc-400" />
                        复制
                    </button>
                    <button
                        onClick={handleCut}
                        className="flex items-center gap-2.5 w-full px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                    >
                        <Scissors size={14} className="text-zinc-400" />
                        剪切
                    </button>
                    <button
                        onClick={handleDelete}
                        className="flex items-center gap-2.5 w-full px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                        <Trash2 size={14} className="text-red-400" />
                        删除
                    </button>
                    <div className="my-1 border-t border-zinc-100 dark:border-zinc-700" />
                    <button
                        onClick={handleAddBelow}
                        className="flex items-center gap-2.5 w-full px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                    >
                        <Plus size={14} className="text-zinc-400" />
                        在下方添加
                    </button>
                </div>
            )}
        </div>
    )
}

function extractBlockText(block: Block): string {
    if (!block.content) return ''
    if (Array.isArray(block.content)) {
        return block.content
            .map(item => {
                if (typeof item === 'string') return item
                if (item && typeof item === 'object' && 'text' in item) return item.text as string
                return ''
            })
            .join('')
    }
    return ''
}
