/**
 * 自动标签 Tab
 *
 * 提供 AI 驱动的标签分析功能，支持：
 * - AI 分析文档内容，自动生成标签建议
 * - 标签置信度展示与勾选
 * - 一键应用选中标签到当前文档
 * - 推荐文件夹和文档摘要
 *
 * @module components/KnowledgePanel/TagsTab
 */
import { Button } from '@lcw-doc/shadcn-shared-ui/components/ui/button'
import { useToast } from '@lcw-doc/shadcn-shared-ui/hooks/use-toast'
import { Check, FolderOpen, Loader2, Sparkles, Tag } from 'lucide-react'
import { useState } from 'react'

import { useEditorContext } from '@/context/EditorContext'
import { autoTag, extractStructuredContextFromEditor, StructuredContext } from '@/services/ai'
import { addPageTag, createTag, fetchTags } from '@/services/tag'

interface TagsTabProps {
    pageId: string
}

/** AI 标签分析结果 */
interface AutoTagResult {
    tags: Array<{ name: string; color: string; confidence: number }>
    suggestedFolder: string
    summary: string
}

/** 已有标签项 */
interface ExistingTagItem {
    id: number
    tagId: string
    name: string
    color?: string
}

/** 新建标签返回项 */
interface CreatedTagItem {
    id: number
    tagId: string
    name: string
    color?: string
}

export default function TagsTab({ pageId }: TagsTabProps) {
    const { editor } = useEditorContext()
    const { toast } = useToast()

    const [loading, setLoading] = useState(false)
    const [applying, setApplying] = useState(false)
    const [result, setResult] = useState<AutoTagResult | null>(null)
    const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())

    /** 从编辑器提取结构化上下文 */
    const getContext = (): StructuredContext | undefined => {
        if (!editor) return undefined
        try {
            const blocks = editor.document as any[]
            return extractStructuredContextFromEditor(blocks)
        } catch {
            return undefined
        }
    }

    /** AI 分析标签 */
    const handleAutoTag = async () => {
        setLoading(true)
        setResult(null)
        setSelectedTags(new Set())
        try {
            const context = getContext()
            const data = await autoTag(pageId, context)
            setResult(data)
            // 默认选中置信度 >= 0.7 的标签
            const defaultSelected = new Set(
                data.tags.filter(t => t.confidence >= 0.7).map(t => t.name),
            )
            setSelectedTags(defaultSelected)
        } catch (e: any) {
            toast({ title: 'AI 标签分析失败', description: e.message, variant: 'destructive' })
        } finally {
            setLoading(false)
        }
    }

    /** 切换标签选中状态 */
    const toggleTag = (tagName: string) => {
        setSelectedTags(prev => {
            const next = new Set(prev)
            if (next.has(tagName)) {
                next.delete(tagName)
            } else {
                next.add(tagName)
            }
            return next
        })
    }

    /** 应用选中标签 */
    const handleApplyTags = async () => {
        if (!result || selectedTags.size === 0) return
        setApplying(true)
        try {
            // 获取已有标签列表
            const existingTags: ExistingTagItem[] = (await fetchTags()).data
            const existingTagMap = new Map<string, string>(
                existingTags.map((t: ExistingTagItem) => [t.name, t.tagId]),
            )

            // 并行处理选中的标签：先并行创建不存在的标签，再并行关联
            const tagsToCreate = Array.from(selectedTags).map(tagName => {
                const tagInfo = result.tags.find(t => t.name === tagName)
                return { tagName, tagInfo, existingTagId: existingTagMap.get(tagName) }
            }).filter(t => t.tagInfo)

            // 并行创建缺失的标签
            const createPromises = tagsToCreate.map(async ({ tagName, tagInfo, existingTagId }) => {
                if (existingTagId) return { tagName, tagId: existingTagId }
                const newTag: CreatedTagItem = (await createTag({ name: tagName, color: tagInfo!.color })).data
                return { tagName, tagId: newTag.tagId }
            })
            const resolved = await Promise.all(createPromises)

            // 并行关联标签到页面
            const addPromises = resolved.map(({ tagId }) => addPageTag({ pageId, tagId }))
            await Promise.all(addPromises)

            toast({ title: '标签应用成功', description: `已应用 ${selectedTags.size} 个标签` })
        } catch (e: any) {
            toast({ title: '标签应用失败', description: e.message, variant: 'destructive' })
        } finally {
            setApplying(false)
        }
    }

    return (
        <div className="p-4 space-y-4">
            {/* AI 分析按钮 */}
            <Button
                size="sm"
                variant="outline"
                onClick={handleAutoTag}
                disabled={loading}
                className="w-full h-9"
            >
                {loading ? (
                    <>
                        <Loader2 size={14} className="animate-spin mr-1" />
                        AI 分析中...
                    </>
                ) : (
                    <>
                        <Sparkles size={14} className="mr-1 text-brand" />
                        AI 分析
                    </>
                )}
            </Button>

            {/* 标签建议列表 */}
            {result && (
                <div className="space-y-3">
                    <div className="text-xs font-medium text-zinc-700">标签建议</div>
                    <div className="space-y-2">
                        {result.tags.map((tag, i) => {
                            const isSelected = selectedTags.has(tag.name)
                            return (
                                <div
                                    key={i}
                                    className="flex items-center gap-2 border border-zinc-200 rounded-md p-2 cursor-pointer hover:border-zinc-300 transition-colors"
                                    onClick={() => toggleTag(tag.name)}
                                >
                                    {/* 选中复选框 */}
                                    <div
                                        className={`flex items-center justify-center w-4 h-4 rounded border transition-colors ${
                                            isSelected
                                                ? 'bg-brand border-brand'
                                                : 'border-zinc-300'
                                        }`}
                                    >
                                        {isSelected && <Check size={10} className="text-white" />}
                                    </div>

                                    {/* 标签颜色和名称 */}
                                    <Tag size={12} style={{ color: tag.color }} />
                                    <span className="text-xs font-medium text-zinc-700 flex-1">
                                        {tag.name}
                                    </span>

                                    {/* 置信度条 */}
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-16 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-brand transition-all"
                                                style={{ width: `${tag.confidence * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-zinc-400 w-8 text-right">
                                            {(tag.confidence * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* 推荐文件夹 */}
                    {result.suggestedFolder && (
                        <div className="border border-zinc-200 rounded-md p-2">
                            <div className="flex items-center gap-1.5 mb-1">
                                <FolderOpen size={12} className="text-brand" />
                                <span className="text-xs font-medium text-zinc-700">推荐文件夹</span>
                            </div>
                            <p className="text-xs text-zinc-600">{result.suggestedFolder}</p>
                        </div>
                    )}

                    {/* 文档摘要 */}
                    {result.summary && (
                        <div className="border border-zinc-200 rounded-md p-2">
                            <div className="text-xs font-medium text-zinc-700 mb-1">文档摘要</div>
                            <p className="text-xs text-zinc-600 leading-relaxed">{result.summary}</p>
                        </div>
                    )}

                    {/* 应用选中标签按钮 */}
                    <Button
                        size="sm"
                        onClick={handleApplyTags}
                        disabled={applying || selectedTags.size === 0}
                        className="w-full h-8 text-xs bg-brand hover:bg-brand/90"
                    >
                        {applying ? (
                            <>
                                <Loader2 size={14} className="animate-spin mr-1" />
                                应用中...
                            </>
                        ) : (
                            <>应用选中标签（{selectedTags.size}）</>
                        )}
                    </Button>
                </div>
            )}
        </div>
    )
}
