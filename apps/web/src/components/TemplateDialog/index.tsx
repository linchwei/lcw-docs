import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@lcw-doc/shadcn-shared-ui/components/ui/dialog'
import { Input } from '@lcw-doc/shadcn-shared-ui/components/ui/input'
import { cn } from '@lcw-doc/shadcn-shared-ui/lib/utils'
import { Search } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { Template, TemplateCategory } from '@/data/templates'
import { fetchTemplateCategories, fetchTemplates } from '@/services/template'

interface TemplateDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSelectTemplate: (template: Template) => void
}

export function TemplateDialog({ open, onOpenChange, onSelectTemplate }: TemplateDialogProps) {
    const [search, setSearch] = useState('')
    const [activeCategory, setActiveCategory] = useState('all')
    const [categories, setCategories] = useState<TemplateCategory[]>([])
    const [templates, setTemplates] = useState<Template[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const loadData = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const [cats, tmpls] = await Promise.all([
                fetchTemplateCategories(),
                fetchTemplates(),
            ])
            setCategories(cats.map(c => ({ id: c.categoryId, name: c.name, emoji: c.emoji })))
            setTemplates(tmpls.map(t => ({
                id: t.templateId,
                name: t.name,
                category: t.categoryId,
                description: t.description,
                emoji: t.emoji,
                content: t.content,
            })))
        } catch (e) {
            setError(e instanceof Error ? e.message : '加载模板失败')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        if (open) {
            loadData()
        }
    }, [open, loadData])

    const filteredTemplates = templates.filter(t => {
        const matchesCategory = activeCategory === 'all' || t.category === activeCategory
        const matchesSearch =
            search === '' ||
            t.name.toLowerCase().includes(search.toLowerCase()) ||
            t.description.toLowerCase().includes(search.toLowerCase())
        return matchesCategory && matchesSearch
    })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>选择模板</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="搜索模板..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setActiveCategory('all')}
                            className={cn(
                                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                                activeCategory === 'all'
                                    ? 'bg-foreground text-background'
                                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            )}
                        >
                            全部
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={cn(
                                    'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                                    activeCategory === cat.id
                                        ? 'bg-foreground text-background'
                                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                )}
                            >
                                {cat.emoji} {cat.name}
                            </button>
                        ))}
                    </div>
                    {loading && (
                        <div className="text-center py-8 text-muted-foreground text-sm">加载模板中...</div>
                    )}
                    {error && (
                        <div className="text-center py-8 space-y-2">
                            <p className="text-sm text-destructive">{error}</p>
                            <button onClick={loadData} className="text-sm text-muted-foreground hover:text-foreground underline">
                                重试
                            </button>
                        </div>
                    )}
                    {!loading && !error && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {filteredTemplates.map(template => (
                                <div
                                    key={template.id}
                                    className="border rounded-lg p-4 hover:border-foreground/30 transition-colors flex items-start justify-between gap-3"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-2xl">{template.emoji}</span>
                                            <span className="font-medium text-sm truncate">{template.name}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground line-clamp-2">{template.description}</p>
                                    </div>
                                    <button
                                        onClick={() => onSelectTemplate(template)}
                                        className="shrink-0 px-3 py-1.5 text-xs font-medium rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors"
                                    >
                                        使用此模板
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    {!loading && !error && filteredTemplates.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground text-sm">没有找到匹配的模板</div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
