import { request } from '@/utils/request'

export const createComment = async (data: { pageId: string; content: string; anchorText?: string; anchorPos?: string }) => {
    return await request.post(`/page/${data.pageId}/comment`, data)
}

export const fetchComments = async (pageId: string) => {
    return await request.get(`/page/${pageId}/comments`)
}

export const replyComment = async (data: { parentId: string; content: string }) => {
    return await request.post(`/comment/${data.parentId}/reply`, data)
}

export const resolveComment = async (commentId: string) => {
    return await request.put(`/comment/${commentId}/resolve`)
}

export const deleteComment = async (commentId: string) => {
    return await request.delete(`/comment/${commentId}`)
}
