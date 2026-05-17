import { LcwDocEditor } from '@lcw-doc/core'
import { FileText, X } from 'lucide-react'
import { useEffect, useState } from 'react'

interface DocInfoPanelProps {
    editor: LcwDocEditor | null
    open: boolean
    onClose: () => void
}

interface DocStats {
    charCount: number
    wordCount: number
    blockCount: number
    paragraphCount: number
    headingCount: number
    imageCount: number
}

function computeStats(editor: LcwDocEditor): DocStats {
    const doc = editor.document
    let charCount = 0
    let blockCount = 0
    let paragraphCount = 0
    let headingCount = 0
    let imageCount = 0

    for (const block of doc) {
        blockCount++
        if (block.type === 'paragraph') paragraphCount++
        if (block.type === 'heading') headingCount++
        if (block.type === 'image') imageCount++

        if (block.content && Array.isArray(block.content)) {
            for (const item of block.content) {
                if (typeof item === 'object' && 'text' in item) {
                    charCount += (item.text as string).length
                }
            }
        }
    }

    const text = editor._tiptapEditor?.getText() || ''
    const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0

    return { charCount, wordCount, blockCount, paragraphCount, headingCount, imageCount }
}

export function DocInfoPanel({ editor, open, onClose }: DocInfoPanelProps) {
    const [stats, setStats] = useState<DocStats>({
        charCount: 0,
        wordCount: 0,
        blockCount: 0,
        paragraphCount: 0,
        headingCount: 0,
        imageCount: 0,
    })

    useEffect(() => {
        if (!editor || !open) return
        setStats(computeStats(editor))
        const unsubscribe = editor.onChange(() => {
            setStats(computeStats(editor!))
        })
        return unsubscribe
    }, [editor, open])

    useEffect(() => {
        if (!open) return
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [open, onClose])

    if (!open) return null

    const statItems = [
        { label: '字符数', value: stats.charCount.toLocaleString() },
        { label: '词数', value: stats.wordCount.toLocaleString() },
        { label: '总块数', value: stats.blockCount.toLocaleString() },
        { label: '段落数', value: stats.paragraphCount.toLocaleString() },
        { label: '标题数', value: stats.headingCount.toLocaleString() },
        { label: '图片数', value: stats.imageCount.toLocaleString() },
    ]

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30" onClick={onClose} />
            <div className="relative bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-700 w-[400px]">
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                        <FileText size={16} className="text-zinc-500" />
                        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">文档信息</h2>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 transition-colors">
                        <X size={16} />
                    </button>
                </div>
                <div className="px-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        {statItems.map(item => (
                            <div key={item.label} className="flex flex-col">
                                <span className="text-xs text-zinc-500 dark:text-zinc-400">{item.label}</span>
                                <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
