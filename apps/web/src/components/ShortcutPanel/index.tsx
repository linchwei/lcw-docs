import { X } from 'lucide-react'
import { useEffect } from 'react'

interface ShortcutPanelProps {
    open: boolean
    onClose: () => void
}

const shortcutGroups = [
    {
        title: '文本格式',
        items: [
            { keys: ['⌘', 'B'], label: '加粗' },
            { keys: ['⌘', 'I'], label: '斜体' },
            { keys: ['⌘', 'U'], label: '下划线' },
            { keys: ['⌘', '⇧', 'X'], label: '删除线' },
            { keys: ['⌘', 'K'], label: '插入链接' },
        ],
    },
    {
        title: '段落格式',
        items: [
            { keys: ['⌘', '⌥', '1'], label: '一级标题' },
            { keys: ['⌘', '⌥', '2'], label: '二级标题' },
            { keys: ['⌘', '⌥', '3'], label: '三级标题' },
            { keys: ['⌘', '⌥', '0'], label: '正文' },
            { keys: ['⌘', '⇧', '7'], label: '有序列表' },
            { keys: ['⌘', '⇧', '8'], label: '无序列表' },
            { keys: ['⌘', '⇧', '9'], label: '待办列表' },
            { keys: ['⌘', '⌥', 'C'], label: '代码块' },
        ],
    },
    {
        title: '编辑操作',
        items: [
            { keys: ['⌘', 'Z'], label: '撤销' },
            { keys: ['⌘', '⇧', 'Z'], label: '重做' },
            { keys: ['Tab'], label: '缩进' },
            { keys: ['⇧', 'Tab'], label: '取消缩进' },
            { keys: ['⌘', '⇧', '↑'], label: '上移块' },
            { keys: ['⌘', '⇧', '↓'], label: '下移块' },
        ],
    },
    {
        title: '插入',
        items: [
            { keys: ['/'], label: '快速插入' },
            { keys: ['@'], label: '提及页面' },
            { keys: [':'], label: '插入表情' },
        ],
    },
    {
        title: '导航',
        items: [
            { keys: ['⌘', 'F'], label: '查找' },
            { keys: ['⌘', '⇧', 'H'], label: '替换' },
            { keys: ['E'], label: '进入编辑模式' },
            { keys: ['Esc'], label: '退出/关闭' },
        ],
    },
]

export function ShortcutPanel({ open, onClose }: ShortcutPanelProps) {
    useEffect(() => {
        if (!open) return
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [open, onClose])

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30" onClick={onClose} />
            <div className="relative bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-700 w-[560px] max-h-[80vh] overflow-auto">
                <div className="sticky top-0 bg-white dark:bg-zinc-900 flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                    <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">快捷键</h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>
                <div className="px-6 py-4 space-y-6">
                    {shortcutGroups.map(group => (
                        <div key={group.title}>
                            <h3 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                                {group.title}
                            </h3>
                            <div className="space-y-1">
                                {group.items.map(item => (
                                    <div key={item.label} className="flex items-center justify-between py-1.5">
                                        <span className="text-sm text-zinc-700 dark:text-zinc-300">{item.label}</span>
                                        <div className="flex items-center gap-1">
                                            {item.keys.map((key, i) => (
                                                <span
                                                    key={i}
                                                    className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded"
                                                >
                                                    {key}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
