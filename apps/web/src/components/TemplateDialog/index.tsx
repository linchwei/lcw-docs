import { useState } from 'react'
import { Search } from 'lucide-react'

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@lcw-doc/shadcn-shared-ui/components/ui/dialog'
import { Input } from '@lcw-doc/shadcn-shared-ui/components/ui/input'
import { cn } from '@lcw-doc/shadcn-shared-ui/lib/utils'

import { templates, templateCategories, Template } from '@/data/templates'

interface TemplateDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSelectTemplate: (template: Template) => void
}

export function TemplateDialog({ open, onOpenChange, onSelectTemplate }: TemplateDialogProps) {
    const [search, setSearch] = useState('')
    const [activeCategory, setActiveCategory] = useState('all')

    const filteredTemplates = templates.filter((t) => {
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
                        <Input
                            placeholder="搜索模板..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
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
                        {templateCategories.map((cat) => (
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {filteredTemplates.map((template) => (
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
                    {filteredTemplates.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                            没有找到匹配的模板
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
