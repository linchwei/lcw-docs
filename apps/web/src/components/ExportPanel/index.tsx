import { LcwDocEditor } from '@lcw-doc/core'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@lcw-doc/shadcn-shared-ui/components/ui/dialog'
import { useToast } from '@lcw-doc/shadcn-shared-ui/hooks/use-toast'
import { AlignLeft, Code, File, FileDown, FileText, Loader2 } from 'lucide-react'
import { useState } from 'react'

import { ExportFormat, exportDocument, isLargeDocument } from '@/utils/exportDocument'

const exportFormats: { key: ExportFormat; label: string; ext: string; icon: typeof FileText; desc: string }[] = [
    { key: 'markdown', label: 'Markdown', ext: '.md', icon: FileText, desc: '原始 Markdown 源码，保留所有语法标记' },
    { key: 'html', label: 'HTML', ext: '.html', icon: Code, desc: '单文件 HTML，可直接在浏览器打开，自带样式' },
    { key: 'docx', label: 'Word', ext: '.docx', icon: File, desc: 'Word 格式，支持 Word/WPS 打开，保留标题层级、列表、表格' },
    { key: 'pdf', label: 'PDF', ext: '.pdf', icon: FileDown, desc: '高保真排版，适合打印和分享' },
    { key: 'txt', label: '纯文本', ext: '.txt', icon: AlignLeft, desc: '仅保留文本内容，去除所有格式' },
]

interface ExportPanelProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    editor: LcwDocEditor<any, any, any> | null
    fileName: string
}

export function ExportPanel({ open, onOpenChange, editor, fileName }: ExportPanelProps) {
    const [exporting, setExporting] = useState<ExportFormat | null>(null)
    const { toast } = useToast()

    const handleExport = async (format: ExportFormat) => {
        if (!editor) return

        setExporting(format)
        try {
            if (isLargeDocument(editor)) {
                toast({ title: '文档内容较多，导出可能需要几秒钟' })
            }
            await exportDocument(editor, format, fileName)
            toast({ title: '导出成功', variant: 'success' })
            onOpenChange(false)
        } catch {
            toast({ title: '导出失败，请稍后重试', variant: 'destructive' })
        } finally {
            setExporting(null)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>导出文档</DialogTitle>
                </DialogHeader>
                <div className="grid gap-3 py-4">
                    {exportFormats.map(fmt => {
                        const Icon = fmt.icon
                        return (
                            <button
                                key={fmt.key}
                                onClick={() => handleExport(fmt.key)}
                                disabled={exporting !== null}
                                className="flex items-center gap-3 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-accent transition-colors text-left disabled:opacity-50"
                            >
                                <Icon size={20} className="text-muted-foreground shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium">
                                        {fmt.label}{' '}
                                        <span className="text-muted-foreground font-normal">{fmt.ext}</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground">{fmt.desc}</div>
                                </div>
                                {exporting === fmt.key && <Loader2 size={16} className="animate-spin shrink-0" />}
                            </button>
                        )
                    })}
                </div>
            </DialogContent>
        </Dialog>
    )
}
