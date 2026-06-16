/**
 * AI Diff 预览组件
 *
 * 参考 Cursor Cmd+K 模式，展示 AI 对文档的修改建议。
 * 支持三种修改类型的 Diff 展示：
 * - insert_blocks：绿色高亮显示新内容
 * - update_block：红色删除线 + 绿色新增对比
 * - delete_block：红色删除线
 *
 * 交互：
 * - "接受"：将修改应用到编辑器
 * - "拒绝"：丢弃修改
 * - "全部接受"：接受所有 Diff
 * - "全部拒绝"：拒绝所有 Diff
 *
 * @module components/AIDiffPreview
 */
import { Check, X, CheckCheck, XCircle } from 'lucide-react'
import { useState } from 'react'

import type { DiffItem } from '@/hooks/useAIStream'

/** Diff 项的审批状态 */
type DiffApprovalStatus = 'pending' | 'accepted' | 'rejected'

/** AIDiffPreview 组件属性 */
export interface AIDiffPreviewProps {
    /** Diff 操作列表 */
    diffs: DiffItem[]
    /** 接受单个 Diff 的回调 */
    onAccept: (diff: DiffItem) => void
    /** 拒绝单个 Diff 的回调 */
    onReject: (diff: DiffItem) => void
    /** 接受所有 Diff 的回调 */
    onAcceptAll: (diffs: DiffItem[]) => void
    /** 拒绝所有 Diff 的回调 */
    onRejectAll: (diffs: DiffItem[]) => void
    /** 关闭预览的回调 */
    onClose: () => void
}

/** 单个 Diff 项的展示 */
function DiffItemView({
    diff,
    status,
    onAccept,
    onReject,
}: {
    diff: DiffItem
    status: DiffApprovalStatus
    onAccept: () => void
    onReject: () => void
}) {
    const { type, data } = diff

    // 根据操作类型渲染不同的 Diff 展示
    return (
        <div
            style={{
                padding: '12px 16px',
                borderBottom: '1px solid #f0f0ee',
                opacity: status === 'pending' ? 1 : 0.5,
            }}
        >
            {/* 操作类型标签 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span
                    style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor:
                            type === 'insert_blocks' ? '#dcfce7' :
                            type === 'update_block' ? '#fef3c7' :
                            '#fee2e2',
                        color:
                            type === 'insert_blocks' ? '#166534' :
                            type === 'update_block' ? '#92400e' :
                            '#991b1b',
                    }}
                >
                    {type === 'insert_blocks' ? '插入' : type === 'update_block' ? '修改' : '删除'}
                </span>
                {diff.blockId && (
                    <span style={{ fontSize: '11px', color: '#9b9a97' }}>
                        Block: {diff.blockId.slice(0, 8)}...
                    </span>
                )}
            </div>

            {/* Diff 内容展示 */}
            <div
                style={{
                    fontSize: '13px',
                    lineHeight: '1.6',
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    backgroundColor: '#fafaf9',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #e9e9e7',
                }}
            >
                {type === 'insert_blocks' && (
                    <span style={{ backgroundColor: '#dcfce7', color: '#166534' }}>
                        {data.newContent || data.content || JSON.stringify(data, null, 2)}
                    </span>
                )}

                {type === 'update_block' && (
                    <>
                        {data.oldContent && (
                            <span style={{ backgroundColor: '#fee2e2', textDecoration: 'line-through', color: '#991b1b' }}>
                                {data.oldContent}
                            </span>
                        )}
                        {data.oldContent && data.newContent && '\n'}
                        {data.newContent && (
                            <span style={{ backgroundColor: '#dcfce7', color: '#166534' }}>
                                {data.newContent}
                            </span>
                        )}
                        {!data.oldContent && !data.newContent && (
                            <span>{JSON.stringify(data, null, 2)}</span>
                        )}
                    </>
                )}

                {type === 'delete_block' && (
                    <span style={{ backgroundColor: '#fee2e2', textDecoration: 'line-through', color: '#991b1b' }}>
                        {data.oldContent || data.content || JSON.stringify(data, null, 2)}
                    </span>
                )}
            </div>

            {/* 审批按钮 */}
            {status === 'pending' && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button
                        onClick={onAccept}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 12px',
                            fontSize: '12px',
                            borderRadius: '6px',
                            border: '1px solid #dcfce7',
                            backgroundColor: '#f0fdf4',
                            color: '#166534',
                            cursor: 'pointer',
                        }}
                    >
                        <Check size={14} /> 接受
                    </button>
                    <button
                        onClick={onReject}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 12px',
                            fontSize: '12px',
                            borderRadius: '6px',
                            border: '1px solid #fee2e2',
                            backgroundColor: '#fef2f2',
                            color: '#991b1b',
                            cursor: 'pointer',
                        }}
                    >
                        <X size={14} /> 拒绝
                    </button>
                </div>
            )}

            {status === 'accepted' && (
                <span style={{ fontSize: '12px', color: '#166534', marginTop: '4px', display: 'inline-block' }}>
                    已接受
                </span>
            )}

            {status === 'rejected' && (
                <span style={{ fontSize: '12px', color: '#991b1b', marginTop: '4px', display: 'inline-block' }}>
                    已拒绝
                </span>
            )}
        </div>
    )
}

/**
 * AI Diff 预览组件
 *
 * 展示 AI 对文档的修改建议，支持逐项审批或批量操作。
 */
export function AIDiffPreview({
    diffs,
    onAccept,
    onReject,
    onAcceptAll,
    onRejectAll,
    onClose,
}: AIDiffPreviewProps) {
    // 每个 Diff 项的审批状态
    const [statuses, setStatuses] = useState<DiffApprovalStatus[]>(
        () => diffs.map(() => 'pending')
    )

    // 更新单个 Diff 的状态
    const updateStatus = (index: number, status: DiffApprovalStatus) => {
        setStatuses(prev => {
            const next = [...prev]
            next[index] = status
            return next
        })
    }

    // 处理接受
    const handleAccept = (index: number) => {
        updateStatus(index, 'accepted')
        onAccept(diffs[index])
    }

    // 处理拒绝
    const handleReject = (index: number) => {
        updateStatus(index, 'rejected')
        onReject(diffs[index])
    }

    // 处理全部接受
    const handleAcceptAll = () => {
        setStatuses(diffs.map(() => 'accepted'))
        onAcceptAll(diffs)
    }

    // 处理全部拒绝
    const handleRejectAll = () => {
        setStatuses(diffs.map(() => 'rejected'))
        onRejectAll(diffs)
    }

    const pendingCount = statuses.filter(s => s === 'pending').length

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
                    AI 修改建议
                    {pendingCount > 0 && (
                        <span style={{ fontSize: '12px', fontWeight: 400, color: '#9b9a97', marginLeft: '8px' }}>
                            {pendingCount} 项待审批
                        </span>
                    )}
                </span>
                <button
                    onClick={onClose}
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

            {/* Diff 列表 */}
            <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                {diffs.map((diff, index) => (
                    <DiffItemView
                        key={`${diff.type}-${diff.blockId || index}`}
                        diff={diff}
                        status={statuses[index]}
                        onAccept={() => handleAccept(index)}
                        onReject={() => handleReject(index)}
                    />
                ))}
            </div>

            {/* 底部批量操作栏 */}
            {pendingCount > 0 && (
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
                        onClick={handleRejectAll}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 14px',
                            fontSize: '13px',
                            borderRadius: '6px',
                            border: '1px solid #e9e9e7',
                            backgroundColor: '#fff',
                            color: '#787774',
                            cursor: 'pointer',
                        }}
                    >
                        <XCircle size={14} /> 全部拒绝
                    </button>
                    <button
                        onClick={handleAcceptAll}
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
                        <CheckCheck size={14} /> 全部接受
                    </button>
                </div>
            )}
        </div>
    )
}
