import { LcwDocEditor } from '@lcw-doc/core'
import { cn } from '@lcw-doc/shadcn-shared-ui/lib/utils'
import { BookOpen, Sparkles } from 'lucide-react'

import { useWordCount } from '@/hooks/useWordCount'
import { formatNumber } from '@/utils/wordCount'

interface StatusBarProps {
    editor: LcwDocEditor<any, any, any> | null
    onAIReadingToggle?: () => void
    onKnowledgePanelToggle?: () => void
    aiReadingOpen?: boolean
    knowledgePanelOpen?: boolean
}

export function StatusBar({ editor, onAIReadingToggle, onKnowledgePanelToggle, aiReadingOpen, knowledgePanelOpen }: StatusBarProps) {
    const { charsWithoutSpaces, words, paragraphs, readingTimeText, hasSelection, selectionChars } = useWordCount(editor)

    return (
        <div className="sticky bottom-0 z-10 flex items-center justify-between h-8 px-4 border-t border-zinc-100 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80">
            {/* 左侧：AI 功能入口 */}
            <div className="flex items-center gap-1">
                {onAIReadingToggle && (
                    <button
                        onClick={onAIReadingToggle}
                        className={cn(
                            'relative flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors duration-150 cursor-pointer',
                            aiReadingOpen ? 'text-brand' : 'text-muted-foreground hover:text-foreground'
                        )}
                    >
                        <Sparkles size={13} />
                        <span>AI 阅读</span>
                        {aiReadingOpen && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-brand rounded-full" />}
                    </button>
                )}
                {onKnowledgePanelToggle && (
                    <button
                        onClick={onKnowledgePanelToggle}
                        className={cn(
                            'relative flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors duration-150 cursor-pointer',
                            knowledgePanelOpen ? 'text-brand' : 'text-muted-foreground hover:text-foreground'
                        )}
                    >
                        <BookOpen size={13} />
                        <span>知识库</span>
                        {knowledgePanelOpen && (
                            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-brand rounded-full" />
                        )}
                    </button>
                )}
            </div>

            {/* 右侧：字数统计 */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {hasSelection ? (
                    <span className="text-foreground font-medium">已选 {formatNumber(selectionChars)} 字</span>
                ) : (
                    <>
                        <span>字数 {formatNumber(charsWithoutSpaces)}</span>
                        <span className="text-zinc-300 dark:text-zinc-700">|</span>
                        <span>词数 {formatNumber(words)}</span>
                        <span className="text-zinc-300 dark:text-zinc-700">|</span>
                        <span>段落 {formatNumber(paragraphs)}</span>
                        <span className="text-zinc-300 dark:text-zinc-700">|</span>
                        <span>{readingTimeText}</span>
                    </>
                )}
            </div>
        </div>
    )
}
