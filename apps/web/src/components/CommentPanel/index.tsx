import { Button } from '@lcw-doc/shadcn-shared-ui/components/ui/button'
import { Textarea } from '@lcw-doc/shadcn-shared-ui/components/ui/textarea'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Loader2, MessageSquare, Trash2, X } from 'lucide-react'
import { useState } from 'react'

import * as srv from '@/services'
import { Comment } from '@/types/api'

interface CommentPanelProps {
    pageId?: string
    onClose?: () => void
}

function CommentItem({
    comment,
    pageId,
    onReply,
}: {
    comment: Comment
    pageId: string
    onReply: (parentId: string, content: string) => void
}) {
    const [isReplying, setIsReplying] = useState(false)
    const [replyContent, setReplyContent] = useState('')
    const queryClient = useQueryClient()

    const resolveMutation = useMutation({
        mutationFn: srv.resolveComment,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments', pageId] })
        },
    })

    const deleteMutation = useMutation({
        mutationFn: srv.deleteComment,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments', pageId] })
        },
    })

    const handleReply = () => {
        if (!replyContent.trim()) return
        onReply(comment.commentId, replyContent)
        setReplyContent('')
        setIsReplying(false)
    }

    const isResolved = !!comment.resolvedAt

    return (
        <div className={`p-3 rounded-lg border ${isResolved ? 'bg-zinc-50 border-zinc-100' : 'bg-white border-zinc-200'}`}>
            {comment.anchorText && (
                <div className="mb-2 p-2 bg-zinc-100 rounded text-xs text-zinc-600 truncate">
                    &ldquo;{comment.anchorText}&rdquo;
                </div>
            )}
            <p className={`text-sm ${isResolved ? 'text-zinc-500 line-through' : 'text-zinc-800'}`}>
                {comment.content}
            </p>
            <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-zinc-400">
                    {new Date(comment.createdAt).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-1">
                    {!isResolved && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => setIsReplying(!isReplying)}
                        >
                            <MessageSquare size={14} />
                        </Button>
                    )}
                    {!isResolved && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-zinc-400 hover:text-green-600"
                            onClick={() => resolveMutation.mutate(comment.commentId)}
                            disabled={resolveMutation.isPending}
                        >
                            <Check size={14} />
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-zinc-400 hover:text-red-500"
                        onClick={() => deleteMutation.mutate(comment.commentId)}
                        disabled={deleteMutation.isPending}
                    >
                        <Trash2 size={14} />
                    </Button>
                </div>
            </div>
            {isReplying && (
                <div className="mt-3 space-y-2">
                    <Textarea
                        placeholder="回复评论..."
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        className="min-h-[60px] text-sm"
                    />
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setIsReplying(false)}>
                            取消
                        </Button>
                        <Button size="sm" onClick={handleReply} disabled={!replyContent.trim()}>
                            回复
                        </Button>
                    </div>
                </div>
            )}
            {comment.replies && comment.replies.length > 0 && (
                <div className="mt-3 pl-3 border-l-2 border-zinc-200 space-y-2">
                    {comment.replies.map((reply) => (
                        <div key={reply.commentId} className="text-sm group">
                            <div className="flex items-start justify-between">
                                <p className="text-zinc-700 flex-1">{reply.content}</p>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 shrink-0"
                                    onClick={() => deleteMutation.mutate(reply.commentId)}
                                    disabled={deleteMutation.isPending}
                                >
                                    <Trash2 size={12} />
                                </Button>
                            </div>
                            <span className="text-xs text-zinc-400">
                                {new Date(reply.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export function CommentPanel({ pageId, onClose }: CommentPanelProps) {
    const queryClient = useQueryClient()
    const [newComment, setNewComment] = useState('')

    const { data: comments = [], isLoading } = useQuery<Comment[]>({
        queryKey: ['comments', pageId],
        queryFn: async () => {
            const res = await srv.fetchComments(pageId!)
            return res.data || []
        },
        enabled: !!pageId,
    })

    const createMutation = useMutation({
        mutationFn: srv.createComment,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments', pageId] })
            setNewComment('')
        },
    })

    const replyMutation = useMutation({
        mutationFn: srv.replyComment,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments', pageId] })
        },
    })

    const handleCreateComment = () => {
        if (!pageId || !newComment.trim()) return
        createMutation.mutate({
            pageId,
            content: newComment,
        })
    }

    const handleReply = (parentId: string, content: string) => {
        replyMutation.mutate({ parentId, content })
    }

    const unresolvedComments = comments.filter((c) => !c.resolvedAt)
    const resolvedComments = comments.filter((c) => c.resolvedAt)

    return (
        <div className="w-80 h-full border-l border-zinc-200 bg-white flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-zinc-200">
                <div className="flex items-center gap-2">
                    <MessageSquare size={18} />
                    <span className="font-medium">评论</span>
                    {comments.length > 0 && (
                        <span className="text-xs text-zinc-500">({comments.length})</span>
                    )}
                </div>
                {onClose && (
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
                        <X size={16} />
                    </Button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                    </div>
                ) : comments.length === 0 ? (
                    <div className="text-center py-8 text-zinc-500">
                        <MessageSquare size={32} className="mx-auto mb-2 text-zinc-300" />
                        <p className="text-sm">暂无评论</p>
                    </div>
                ) : (
                    <>
                        {unresolvedComments.length > 0 && (
                            <div className="space-y-3">
                                {unresolvedComments.map((comment) => (
                                    <CommentItem
                                        key={comment.commentId}
                                        comment={comment}
                                        pageId={pageId!}
                                        onReply={handleReply}
                                    />
                                ))}
                            </div>
                        )}
                        {resolvedComments.length > 0 && (
                            <div className="space-y-3">
                                <p className="text-xs font-medium text-zinc-400 uppercase">已解决</p>
                                {resolvedComments.map((comment) => (
                                    <CommentItem
                                        key={comment.commentId}
                                        comment={comment}
                                        pageId={pageId!}
                                        onReply={handleReply}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            <div className="p-4 border-t border-zinc-200 space-y-3">
                <Textarea
                    placeholder="添加评论..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[80px] resize-none"
                />
                <Button
                    className="w-full"
                    onClick={handleCreateComment}
                    disabled={!newComment.trim() || createMutation.isPending}
                >
                    {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                    发表评论
                </Button>
            </div>
        </div>
    )
}
