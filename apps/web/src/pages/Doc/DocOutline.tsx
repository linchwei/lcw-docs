import { LcwDocEditor, useDocOutline } from '@lcw-doc/react'
import { ChevronLeft, FileText, List } from 'lucide-react'

interface DocOutlineProps {
    editor: LcwDocEditor
    collapsed: boolean
    onToggleCollapse: () => void
}

export function DocOutline({ editor, collapsed, onToggleCollapse }: DocOutlineProps) {
    const { headings, activeHeadingId, scrollToHeading } = useDocOutline(editor)

    if (collapsed) {
        return (
            <div className="shrink-0 hidden lg:flex flex-col items-start pt-3 w-[220px] border-r border-zinc-100">
                <button
                    onClick={onToggleCollapse}
                    className="inline-flex items-center justify-center rounded-md h-7 w-7 ml-3 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    title="展开目录"
                >
                    <List size={16} />
                </button>
            </div>
        )
    }

    if (headings.length === 0) {
        return (
            <div className="shrink-0 hidden lg:flex flex-col items-start pt-3 w-[220px] border-r border-zinc-100">
                <button
                    onClick={onToggleCollapse}
                    className="inline-flex items-center justify-center rounded-md h-7 w-7 ml-3 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    title="展开目录"
                >
                    <List size={16} />
                </button>
            </div>
        )
    }

    const getIndentClass = (level: number) => {
        switch (level) {
            case 1:
                return ''
            case 2:
                return 'pl-4'
            case 3:
                return 'pl-8'
            case 4:
                return 'pl-12'
            case 5:
                return 'pl-16'
            case 6:
                return 'pl-20'
            default:
                return ''
        }
    }

    return (
        <div className="w-[220px] shrink-0 hidden lg:block border-r border-zinc-100">
            <div className="sticky top-[52px] max-h-[calc(100vh-68px)] overflow-y-auto">
                <div className="flex items-center justify-between px-3 pt-3 pb-2">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                        <FileText size={12} />
                        <span>目录</span>
                    </div>
                    <button
                        onClick={onToggleCollapse}
                        className="inline-flex items-center justify-center rounded-md h-5 w-5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                        title="折叠目录"
                    >
                        <ChevronLeft size={14} />
                    </button>
                </div>
                <nav className="px-2 pb-4">
                    <ul className="space-y-0.5">
                        {headings.map(heading => {
                            const isActive = heading.id === activeHeadingId

                            return (
                                <li key={heading.id}>
                                    <button
                                        type="button"
                                        onClick={() => scrollToHeading(heading.id)}
                                        className={`
                                            block w-full text-left text-[13px] leading-relaxed py-1 px-2 rounded-md
                                            transition-colors duration-150 truncate
                                            ${heading.level === 1 ? 'font-medium' : ''}
                                            ${getIndentClass(heading.level)}
                                            ${isActive ? 'text-blue-600 bg-blue-50' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'}
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
