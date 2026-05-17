import { Block } from '@lcw-doc/core'
import { Plus } from 'lucide-react'

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
    editor: any
    block: Block
    blockDragStart: (event: DragEvent) => void
    blockDragEnd: () => void
    freezeMenu: () => void
    unfreezeMenu: () => void
}

export function EditorSideMenu({ editor, block, blockDragStart, blockDragEnd, freezeMenu, unfreezeMenu }: EditorSideMenuProps) {
    const empty = isBlockEmpty(block)
    const mark = getBlockMark(block)

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

    return (
        <div className="flex items-center gap-0.5 bn-side-menu">
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
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <circle cx="4" cy="4" r="1.5"/>
                        <circle cx="12" cy="4" r="1.5"/>
                        <circle cx="4" cy="8" r="1.5"/>
                        <circle cx="12" cy="8" r="1.5"/>
                        <circle cx="4" cy="12" r="1.5"/>
                        <circle cx="12" cy="12" r="1.5"/>
                    </svg>
                </button>
            )}
        </div>
    )
}
