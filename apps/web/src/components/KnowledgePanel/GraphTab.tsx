/**
 * 知识图谱 Tab
 *
 * 提供文档内概念关联的可视化展示，支持：
 * - AI 生成知识图谱（实体 + 关系 + Mermaid 图）
 * - Mermaid 图表动态渲染（懒加载 mermaid 库）
 * - 实体列表和关系列表辅助展示
 * - 点击实体可在问答 Tab 中追问
 *
 * @module components/KnowledgePanel/GraphTab
 */
import { Button } from '@lcw-doc/shadcn-shared-ui/components/ui/button'
import { useToast } from '@lcw-doc/shadcn-shared-ui/hooks/use-toast'
import { ArrowRight, Loader2, Network, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { useEditorContext } from '@/context/EditorContext'
import { extractStructuredContextFromEditor, generateKnowledgeGraph, StructuredContext } from '@/services/ai'

interface GraphTabProps {
    pageId: string
}

/** 知识图谱结果 */
interface GraphResult {
    entities: Array<{ id: string; name: string; type: string }>
    relations: Array<{ source: string; target: string; label: string; type: string }>
    mermaid: string
}

/** 实体类型对应的颜色映射 */
const entityTypeColors: Record<string, string> = {
    person: 'bg-blue-100 text-blue-700',
    organization: 'bg-purple-100 text-purple-700',
    concept: 'bg-green-100 text-green-700',
    event: 'bg-orange-100 text-orange-700',
    location: 'bg-yellow-100 text-yellow-700',
    technology: 'bg-cyan-100 text-cyan-700',
}

/** 获取实体类型的样式 */
const getEntityTypeStyle = (type: string) => {
    return entityTypeColors[type.toLowerCase()] || 'bg-zinc-100 text-zinc-700'
}

export default function GraphTab({ pageId }: GraphTabProps) {
    const { editor } = useEditorContext()
    const { toast } = useToast()

    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<GraphResult | null>(null)

    /** Mermaid 渲染容器引用 */
    const mermaidContainerRef = useRef<HTMLDivElement>(null)

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

    /** 生成知识图谱 */
    const handleGenerateGraph = async () => {
        setLoading(true)
        setResult(null)
        try {
            const context = getContext()
            const data = await generateKnowledgeGraph(pageId, context)
            setResult(data)
        } catch (e: any) {
            toast({ title: '知识图谱生成失败', description: e.message, variant: 'destructive' })
        } finally {
            setLoading(false)
        }
    }

    /** 动态渲染 Mermaid 图表 */
    useEffect(() => {
        if (!result?.mermaid || !mermaidContainerRef.current) return

        let cancelled = false

        const renderMermaid = async () => {
            try {
                // 动态 import mermaid 库，避免增加首屏包体积
                const mermaid = (await import('mermaid')).default
                mermaid.initialize({
                    startOnLoad: false,
                    theme: 'default',
                    securityLevel: 'loose',
                })

                // 使用唯一 ID 渲染，避免重复
                const id = `knowledge-graph-${Date.now()}`
                const { svg } = await mermaid.render(id, result.mermaid)

                if (!cancelled && mermaidContainerRef.current) {
                    mermaidContainerRef.current.innerHTML = svg
                }
            } catch (err) {
                console.error('Mermaid 渲染失败:', err)
                // 渲染失败时回退到代码文本展示
                if (!cancelled && mermaidContainerRef.current) {
                    mermaidContainerRef.current.innerHTML = `<pre class="bg-zinc-50 border border-zinc-200 rounded-md p-3 text-xs font-mono text-zinc-600 overflow-x-auto whitespace-pre-wrap">${result.mermaid}</pre>`
                }
            }
        }

        renderMermaid()

        return () => {
            cancelled = true
        }
    }, [result?.mermaid])

    /** 根据 ID 查找实体名称 */
    const getEntityName = (id: string): string => {
        return result?.entities.find(e => e.id === id)?.name || id.slice(0, 8) + '...'
    }

    return (
        <div className="p-4 space-y-4">
            {/* 生成图谱按钮 */}
            <Button size="sm" variant="outline" onClick={handleGenerateGraph} disabled={loading} className="w-full h-9">
                {loading ? (
                    <>
                        <Loader2 size={14} className="animate-spin mr-1" />
                        生成中...
                    </>
                ) : (
                    <>
                        <Sparkles size={14} className="mr-1 text-brand" />
                        生成图谱
                    </>
                )}
            </Button>

            {result && (
                <div className="space-y-4">
                    {/* Mermaid 图表渲染区域 */}
                    {result.mermaid && (
                        <div>
                            <div className="flex items-center gap-1.5 mb-2">
                                <Network size={12} className="text-brand" />
                                <span className="text-xs font-medium text-zinc-700">知识图谱</span>
                            </div>
                            <div
                                ref={mermaidContainerRef}
                                className="bg-white border border-zinc-200 rounded-md p-3 overflow-x-auto max-h-80 overflow-y-auto [&_svg]:max-w-full"
                            />
                        </div>
                    )}

                    {/* 实体列表 */}
                    {result.entities.length > 0 && (
                        <div>
                            <div className="text-xs font-medium text-zinc-700 mb-2">实体列表（{result.entities.length}）</div>
                            <div className="flex flex-wrap gap-1.5">
                                {result.entities.map((entity, i) => (
                                    <div key={i} className="flex items-center gap-1 border border-zinc-200 rounded-md px-2 py-1">
                                        <span className={`text-xs px-1.5 py-0.5 rounded ${getEntityTypeStyle(entity.type)}`}>
                                            {entity.type}
                                        </span>
                                        <span className="text-xs text-zinc-700">{entity.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 关系列表 */}
                    {result.relations.length > 0 && (
                        <div>
                            <div className="text-xs font-medium text-zinc-700 mb-2">关系列表（{result.relations.length}）</div>
                            <div className="space-y-1.5">
                                {result.relations.map((rel, i) => (
                                    <div key={i} className="flex items-center gap-1.5 text-xs border border-zinc-100 rounded-md p-2">
                                        <span className="text-zinc-700 font-medium truncate max-w-[120px]">
                                            {getEntityName(rel.source)}
                                        </span>
                                        <ArrowRight size={10} className="text-brand shrink-0" />
                                        <span className="text-brand font-medium shrink-0">{rel.label}</span>
                                        <ArrowRight size={10} className="text-brand shrink-0" />
                                        <span className="text-zinc-700 font-medium truncate max-w-[120px]">
                                            {getEntityName(rel.target)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
