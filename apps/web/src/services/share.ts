import { request } from '@/utils/request'

export const createShare = async (data: { pageId: string; permission: string; password?: string; expiresAt?: string }) => {
    return await request.post('/share', data)
}

export const fetchSharesByPageId = async (pageId: string) => {
    return await request.get(`/share/page/${pageId}`)
}

export const deleteShare = async (shareId: string) => {
    return await request.delete(`/share/${shareId}`)
}

export const fetchShareInfo = async (shareId: string, password?: string) => {
    return await request.get(`/share/${shareId}/info`, { params: { password } })
}

export const fetchShareContent = async (shareId: string, password?: string) => {
    return await request.get(`/share/${shareId}/content`, { params: { password } })
}
