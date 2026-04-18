import { useState } from 'react'
import {
    BookOpen,
    Brain,
    Download,
    FileText,
    GitFork,
    LayoutTemplate,
    MessageSquare,
    Search,
    Share2,
    Sidebar,
    Type,
    Upload,
    Users,
    BarChart3,
    Eye,
} from 'lucide-react'

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@lcw-doc/shadcn-shared-ui/components/ui/dialog'
import { cn } from '@lcw-doc/shadcn-shared-ui/lib/utils'

interface AboutDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

type TabId = 'about' | 'features' | 'shortcuts' | 'markdown'

const tabs: { id: TabId; label: string }[] = [
    { id: 'about', label: '关于' },
    { id: 'features', label: '功能介绍' },
    { id: 'shortcuts', label: '快捷键' },
    { id: 'markdown', label: 'Markdown 语法' },
]

const featureCategories = [
    {
        name: '编辑与写作',
        features: [
            { icon: FileText, name: '文档编辑', desc: '富文本块编辑器，支持标题、列表、表格、代码块、引用等' },
            { icon: LayoutTemplate, name: '模板库', desc: '11 个预设模板，涵盖周报、需求文档、简历等 4 大分类' },
            { icon: Upload, name: 'Markdown 导入', desc: '拖拽上传 .md 文件，自动解析为可编辑文档' },
            { icon: Download, name: '多格式导出', desc: '支持 Markdown、HTML、Word、PDF、纯文本 5 种格式' },
            { icon: Sidebar, name: '文档大纲', desc: '自动生成目录，快速跳转到对应章节' },
            { icon: BarChart3, name: '状态栏', desc: '实时统计字数、词数、段落数和阅读时长' },
        ],
    },
    {
        name: '协作与分享',
        features: [
            { icon: Users, name: '实时协作', desc: '多人同时编辑，光标实时同步，在线状态可见' },
            { icon: MessageSquare, name: '评论系统', desc: '添加评论、回复讨论、标记已解决' },
            { icon: Share2, name: '分享文档', desc: '生成分享链接，支持密码保护和过期时间设置' },
        ],
    },
    {
        name: 'AI 能力',
        features: [
            { icon: Brain, name: 'AI 助手', desc: '全局 AI 对话、行内 AI、选区 AI 操作（续写、改写、翻译、总结）' },
        ],
    },
    {
        name: '导航与管理',
        features: [
            { icon: Search, name: '全局搜索', desc: '⌘K 快速搜索文档，即时定位' },
            { icon: GitFork, name: '文档图谱', desc: '可视化文档关系网络，发现文档间的引用关联' },
            { icon: Eye, name: '文档管理', desc: '创建、收藏、删除、回收站恢复，完整的文档生命周期' },
        ],
    },
]

const shortcutGroups = [
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

const markdownSyntax = [
    { category: '标题', items: [
        { syntax: '# 标题', effect: '一级标题' },
        { syntax: '## 标题', effect: '二级标题' },
        { syntax: '### 标题', effect: '三级标题' },
        { syntax: '#### 标题', effect: '四级标题' },
        { syntax: '##### 标题', effect: '五级标题' },
        { syntax: '###### 标题', effect: '六级标题' },
    ]},
    { category: '文本格式', items: [
        { syntax: '**粗体**', effect: '粗体文字' },
        { syntax: '*斜体*', effect: '斜体文字' },
        { syntax: '~~删除线~~', effect: '删除线文字' },
        { syntax: '`行内代码`', effect: '行内代码样式' },
        { syntax: '==高亮==', effect: '高亮标记文字' },
        { syntax: '^上标^', effect: '上标文字' },
        { syntax: '~下标~', effect: '下标文字' },
    ]},
    { category: '块级元素', items: [
        { syntax: '- 列表项', effect: '无序列表' },
        { syntax: '1. 列表项', effect: '有序列表' },
        { syntax: '[] 待办项', effect: '任务列表' },
        { syntax: '> 引用', effect: '引用块' },
        { syntax: '---', effect: '分割线' },
        { syntax: '```代码```', effect: '代码块' },
    ]},
    { category: '插入元素', items: [
        { syntax: '[文字](链接)', effect: '超链接' },
        { syntax: '![描述](图片URL)', effect: '图片' },
        { syntax: '| 表头 | 表头 |', effect: '表格（回车自动生成）' },
        { syntax: '/', effect: '打开插入块菜单' },
        { syntax: '@', effect: '引用其他文档' },
    ]},
]

const coreFeatures = [
    { icon: FileText, title: '块编辑器', desc: '所见即所得的富文本编辑体验' },
    { icon: Users, title: '实时协作', desc: '多人同时编辑，光标实时同步' },
    { icon: Brain, title: 'AI 助手', desc: '智能写作、续写、翻译、总结' },
    { icon: BookOpen, title: '模板库', desc: '预设模板一键创建结构化文档' },
]

export function AboutDialog({ open, onOpenChange }: AboutDialogProps) {
    const [activeTab, setActiveTab] = useState<TabId>('about')

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>关于协同文档</DialogTitle>
                </DialogHeader>
                <div className="flex flex-wrap gap-2 mb-4">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                                activeTab === tab.id
                                    ? 'bg-foreground text-background'
                                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === 'about' && (
                    <div className="space-y-6 py-2">
                        <div className="flex flex-col items-center text-center gap-3 pb-4">
                            <img src="/logo.png" alt="Logo" className="w-14 h-14 rounded-lg" />
                            <h2 className="text-xl font-semibold text-[#37352f]">协同文档</h2>
                            <span className="text-xs text-[#9b9a97]">v0.1.0</span>
                            <p className="text-sm text-[#787774]">一个轻量级的协同文档编辑平台</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {coreFeatures.map(f => {
                                const Icon = f.icon
                                return (
                                    <div key={f.title} className="flex items-start gap-3 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700">
                                        <div className="w-8 h-8 rounded-md bg-foreground/5 flex items-center justify-center shrink-0">
                                            <Icon size={16} className="text-foreground/70" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">{f.title}</p>
                                            <p className="text-xs text-muted-foreground">{f.desc}</p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        <footer className="text-center text-xs text-[#9b9a97] pt-2">© 2025 LCW Docs</footer>
                    </div>
                )}

                {activeTab === 'features' && (
                    <div className="space-y-6 py-2">
                        {featureCategories.map(category => (
                            <div key={category.name}>
                                <h3 className="text-sm font-medium text-muted-foreground mb-3">{category.name}</h3>
                                <div className="space-y-2">
                                    {category.features.map(feature => {
                                        const Icon = feature.icon
                                        return (
                                            <div key={feature.name} className="flex items-start gap-3 py-2">
                                                <div className="w-8 h-8 rounded-md bg-foreground/5 flex items-center justify-center shrink-0">
                                                    <Icon size={16} className="text-foreground/70" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">{feature.name}</p>
                                                    <p className="text-xs text-muted-foreground">{feature.desc}</p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'shortcuts' && (
                    <div className="space-y-6 py-2">
                        {shortcutGroups.map(group => (
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
                )}

                {activeTab === 'markdown' && (
                    <div className="space-y-6 py-2">
                        {markdownSyntax.map(group => (
                            <div key={group.category}>
                                <h3 className="text-sm font-medium text-muted-foreground mb-3">{group.category}</h3>
                                <div className="space-y-2">
                                    {group.items.map(item => (
                                        <div key={item.syntax} className="flex items-center justify-between py-1.5">
                                            <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded">{item.syntax}</code>
                                            <span className="text-sm text-muted-foreground">{item.effect}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
