import { LcwDocEditor } from '@lcw-doc/core'

import { useWordCount } from '@/hooks/useWordCount'
import { formatNumber } from '@/utils/wordCount'

interface StatusBarProps {
    editor: LcwDocEditor<any, any, any> | null
}

export function StatusBar({ editor }: StatusBarProps) {
    const {
        charsWithoutSpaces,
        words,
        paragraphs,
        readingTimeText,
        hasSelection,
        selectionChars,
    } = useWordCount(editor)

    return (
        <div className="sticky bottom-0 z-10 flex items-center justify-end h-7 px-4 border-t border-zinc-100 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {hasSelection ? (
                    <span className="text-foreground font-medium">
                        已选 {formatNumber(selectionChars)} 字
                    </span>
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
