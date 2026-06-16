/**
 * AI 大纲审批组件
 *
 * 展示 AI 生成的大纲，支持：
 * - 编辑每个章节的标题和描述
 * - 新增/删除章节
 * - "确认并生成" / "取消" 操作
 *
 * 当大纲 Agent 在 approveOutline 节点中断时，
 * 前端收到 interrupt 事件后展示此组件。
 *
 * @module components/AIOutlineApproval
 */
import { Check, ChevronRight, GripVertical, Plus, Trash2, X } from 'lucide-react'
import { useState } from 'react'

/** 大纲章节项 */
export interface OutlineSection {
    /** 章节标题 */
    title: string
    /** 章节描述 */
    description: string
}

/** AIOutlineApproval 组件属性 */
export interface AIOutlineApprovalProps {
    /** AI 生成的大纲 */
    outline: OutlineSection[]
    /** 对话线程 ID，用于恢复 Agent */
    threadId: string
    /** 确认并生成的回调 */
    onConfirm: (outline: OutlineSection[], threadId: string) => void
    /** 取消的回调 */
    onCancel: () => void
}

/**
 * AI 大纲审批组件
 *
 * 展示 AI 生成的大纲，用户可编辑后确认生成。
 */
export function AIOutlineApproval({
    outline: initialOutline,
    threadId,
    onConfirm,
    onCancel,
}: AIOutlineApprovalProps) {
    // 可编辑的大纲列表
    const [sections, setSections] = useState<OutlineSection[]>(initialOutline)
    // 正在编辑的章节索引
    const [editingIdx, setEditingIdx] = useState<number | null>(null)

    /** 更新章节标题 */
    const updateTitle = (index: number, title: string) => {
        setSections(prev => {
            const next = [...prev]
            next[index] = { ...next[index], title }
            return next
        })
    }

    /** 更新章节描述 */
    const updateDescription = (index: number, description: string) => {
        setSections(prev => {
            const next = [...prev]
            next[index] = { ...next[index], description }
            return next
        })
    }

    /** 新增章节 */
    const addSection = () => {
        setSections(prev => [...prev, { title: '新章节', description: '' }])
    }

    /** 删除章节 */
    const removeSection = (index: number) => {
        setSections(prev => prev.filter((_, i) => i !== index))
        if (editingIdx === index) setEditingIdx(null)
    }

    /** 确认并生成 */
    const handleConfirm = () => {
        onConfirm(sections, threadId)
    }

    return (
        <div
            style={{
                backgroundColor: '#fff',
                borderRadius: '10px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                border: '1px solid #e9e9e7',
                overflow: 'hidden',
                maxWidth: '480px',
                width: '100%',
            }}
        >
            {/* 标题栏 */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderBottom: '1px solid #e9e9e7',
                    backgroundColor: '#fafaf9',
                }}
            >
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#37352f' }}>
                    AI 生成大纲
                </span>
                <button
                    onClick={onCancel}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '24px',
                        height: '24px',
                        borderRadius: '4px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        cursor: 'pointer',
                        color: '#787774',
                    }}
                >
                    <X size={16} />
                </button>
            </div>

            {/* 大纲列表 */}
            <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '8px 0' }}>
                {sections.map((section, index) => (
                    <div
                        key={index}
                        style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '8px',
                            padding: '8px 16px',
                            borderBottom: index < sections.length - 1 ? '1px solid #f5f5f3' : 'none',
                        }}
                    >
                        {/* 拖拽手柄（视觉占位，暂不实现拖拽排序） */}
                        <div style={{ paddingTop: '4px', color: '#d4d4d2', flexShrink: 0 }}>
                            <GripVertical size={14} />
                        </div>

                        {/* 章节序号 */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                paddingTop: '4px',
                                color: '#9b9a97',
                                fontSize: '12px',
                                flexShrink: 0,
                            }}
                        >
                            <ChevronRight size={12} />
                            {index + 1}.
                        </div>

                        {/* 章节内容 */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            {/* 标题 */}
                            <input
                                type="text"
                                value={section.title}
                                onChange={e => updateTitle(index, e.target.value)}
                                onFocus={() => setEditingIdx(index)}
                                style={{
                                    width: '100%',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    color: '#37352f',
                                    border: 'none',
                                    outline: 'none',
                                    backgroundColor: editingIdx === index ? '#f7f6f3' : 'transparent',
                                    borderRadius: '4px',
                                    padding: '2px 4px',
                                }}
                            />

                            {/* 描述 */}
                            <input
                                type="text"
                                value={section.description}
                                onChange={e => updateDescription(index, e.target.value)}
                                placeholder="添加描述..."
                                style={{
                                    width: '100%',
                                    fontSize: '12px',
                                    color: '#787774',
                                    border: 'none',
                                    outline: 'none',
                                    backgroundColor: 'transparent',
                                    padding: '2px 4px',
                                    marginTop: '2px',
                                }}
                            />
                        </div>

                        {/* 删除按钮 */}
                        <button
                            onClick={() => removeSection(index)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '24px',
                                height: '24px',
                                borderRadius: '4px',
                                border: 'none',
                                backgroundColor: 'transparent',
                                cursor: 'pointer',
                                color: '#d4d4d2',
                                flexShrink: 0,
                                marginTop: '2px',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                            onMouseLeave={e => (e.currentTarget.style.color = '#d4d4d2')}
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}

                {/* 新增章节按钮 */}
                <div style={{ padding: '8px 16px' }}>
                    <button
                        onClick={addSection}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            fontSize: '12px',
                            color: '#6B45FF',
                            backgroundColor: 'transparent',
                            border: '1px dashed #d4d4d2',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            width: '100%',
                            justifyContent: 'center',
                        }}
                    >
                        <Plus size={14} /> 添加章节
                    </button>
                </div>
            </div>

            {/* 底部操作栏 */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '8px',
                    padding: '12px 16px',
                    borderTop: '1px solid #e9e9e7',
                    backgroundColor: '#fafaf9',
                }}
            >
                <button
                    onClick={onCancel}
                    style={{
                        padding: '6px 14px',
                        fontSize: '13px',
                        borderRadius: '6px',
                        border: '1px solid #e9e9e7',
                        backgroundColor: '#fff',
                        color: '#787774',
                        cursor: 'pointer',
                    }}
                >
                    取消
                </button>
                <button
                    onClick={handleConfirm}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '6px 14px',
                        fontSize: '13px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: '#6B45FF',
                        color: '#fff',
                        cursor: 'pointer',
                    }}
                >
                    <Check size={14} /> 确认并生成
                </button>
            </div>
        </div>
    )
}
