import { LcwDocEditor } from '@lcw-doc/core'
import { FileText } from 'lucide-react'

import { useDocOutline } from './useDocOutline'

interface DocOutlineProps {
    editor: LcwDocEditor
}

export function DocOutline({ editor }: DocOutlineProps) {
    const { headings, activeHeadingId } = useDocOutline(editor)

    if (headings.length === 0) {
        return null
    }

    const handleClick = (blockId: string) => {
        editor.setTextCursorPosition(blockId, 'start')
        editor.focus()
    }

    return (
        <div className="w-[200px] shrink-0 hidden lg:block">
            <div className="sticky top-[68px] max-h-[calc(100vh-84px)] overflow-y-auto pl-4 border-l border-zinc-100">
                <div className="flex items-center gap-1.5 mb-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    <FileText size={12} />
                    <span>目录</span>
                </div>
                <nav>
                    <ul className="space-y-0.5">
                        {headings.map(heading => {
                            const isActive = heading.id === activeHeadingId
                            const indentLevel = heading.level - 1

                            return (
                                <li key={heading.id}>
                                    <button
                                        type="button"
                                        onClick={() => handleClick(heading.id)}
                                        className={`
                                            block w-full text-left text-[13px] leading-relaxed py-1 px-2 rounded-md
                                            transition-colors duration-150 truncate
                                            ${indentLevel === 0 ? 'font-medium' : ''}
                                            ${indentLevel === 1 ? 'pl-6' : ''}
                                            ${indentLevel === 2 ? 'pl-10' : ''}
                                            ${isActive
                                                ? 'text-blue-600 bg-blue-50'
                                                : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
                                            }
                                        `}
                                        title={heading.text}
                                    >
                                        {heading.text || '无标题'}
                                    </button>
                                </li>
                            )
                        })}
                    </ul>
                </nav>
            </div>
        </div>
    )
}
