import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@lcw-doc/shadcn-shared-ui/components/ui/dialog'

interface KeyboardShortcutsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

const shortcuts = [
    { category: '通用', items: [
        { keys: ['⌘', 'K'], description: '搜索文档' },
        { keys: ['⌘', 'B'], description: '切换侧边栏' },
        { keys: ['⌘', '/'], description: '快捷键帮助' },
    ]},
    { category: '编辑', items: [
        { keys: ['⌘', 'Z'], description: '撤销' },
        { keys: ['⌘', '⇧', 'Z'], description: '重做' },
        { keys: ['⌘', 'B'], description: '加粗' },
        { keys: ['⌘', 'I'], description: '斜体' },
        { keys: ['⌘', 'U'], description: '下划线' },
        { keys: ['⌘', 'K'], description: '插入链接' },
    ]},
    { category: 'Markdown 快捷格式', items: [
        { keys: ['#', 'Space'], description: '一级标题' },
        { keys: ['##', 'Space'], description: '二级标题' },
        { keys: ['###', 'Space'], description: '三级标题' },
        { keys: ['####', 'Space'], description: '四级标题' },
        { keys: ['#####', 'Space'], description: '五级标题' },
        { keys: ['######', 'Space'], description: '六级标题' },
        { keys: ['**text**'], description: '粗体' },
        { keys: ['*text*'], description: '斜体' },
        { keys: ['~~text~~'], description: '删除线' },
        { keys: ['`text`'], description: '行内代码' },
        { keys: ['==text=='], description: '高亮标记' },
        { keys: ['^text^'], description: '上标' },
        { keys: ['~text~'], description: '下标' },
        { keys: ['[text](url)'], description: '超链接' },
        { keys: ['![alt](url)'], description: '图片' },
    ]},
    { category: '块级快捷格式', items: [
        { keys: ['-', 'Space'], description: '无序列表' },
        { keys: ['1.', 'Space'], description: '有序列表' },
        { keys: ['[]', 'Space'], description: '任务列表' },
        { keys: ['>', 'Space'], description: '引用块' },
        { keys: ['---', 'Space'], description: '分割线' },
        { keys: ['```', 'Space'], description: '代码块' },
        { keys: ['| 表头 | 表头 |'], description: '表格' },
        { keys: ['/'], description: '插入块菜单' },
        { keys: ['@'], description: '引用文档' },
    ]},
]

export function KeyboardShortcutsDialog({ open, onOpenChange }: KeyboardShortcutsDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>键盘快捷键</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-2">
                    {shortcuts.map(group => (
                        <div key={group.category}>
                            <h3 className="text-sm font-medium text-muted-foreground mb-3">{group.category}</h3>
                            <div className="space-y-2">
                                {group.items.map(item => (
                                    <div key={item.description} className="flex items-center justify-between py-1.5">
                                        <span className="text-sm">{item.description}</span>
                                        <div className="flex items-center gap-1">
                                            {item.keys.map((key, i) => (
                                                <span key={i}>
                                                    <kbd className="pointer-events-none inline-flex h-6 select-none items-center gap-1 rounded border border-border bg-muted px-2 font-mono text-[11px] font-medium text-muted-foreground">
                                                        {key}
                                                    </kbd>
                                                    {i < item.keys.length - 1 && <span className="text-muted-foreground text-xs mx-0.5">+</span>}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    )
}
