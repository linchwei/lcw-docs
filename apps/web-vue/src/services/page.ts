import { BacklinksRes, CreatePagePayload, PageGraphRes, PageListRes, SearchRes, SharedPagesRes, UpdatePagePayload } from '@/types/api'
import { request } from '@/utils/request'

export const fetchPageList = async (): Promise<PageListRes> => {
    return await request.get('/page')
}

export const fetchPageDetail = async (pageId: string) => {
    return await request.get(`/page/${pageId}`)
}

export const fetchSharedPages = async (): Promise<SharedPagesRes> => {
    return await request.get('/page/shared')
}

export const removePage = async (pageId: string) => {
    return await request.delete(`/page`, { data: { pageId } })
}

export const createPage = async (data: CreatePagePayload) => {
    return await request.post('/page', data)
}

export const updatePage = async (data: UpdatePagePayload) => {
    return await request.put('/page', data)
}

export const fetchPageGraph = async (): Promise<PageGraphRes> => {
    return await request.get('/page/graph')
}

export const toggleFavorite = async (pageId: string) => {
    return await request.put(`/page/${pageId}/favorite`)
}

export const fetchTrashList = async () => {
    return await request.get('/page/trash')
}

export const restorePage = async (pageId: string) => {
    return await request.post(`/page/${pageId}/restore`)
}

export const permanentDeletePage = async (pageId: string) => {
    return await request.delete(`/page/${pageId}/permanent`)
}

export const fetchRecentPages = async () => {
    return await request.get('/page/recent')
}

export const searchPages = async (query: string): Promise<SearchRes> => {
    return await request.get('/page/search', { params: { q: query } })
}

export const fetchBacklinks = async (pageId: string): Promise<BacklinksRes> => {
    return await request.get(`/page/${pageId}/backlinks`)
}
