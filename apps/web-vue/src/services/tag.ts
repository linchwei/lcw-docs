import { request } from '@/utils/request'

export const fetchTags = async () => {
    return await request.get('/tags')
}

export const createTag = async (data: { name: string; color?: string }) => {
    return await request.post('/tag', data)
}

export const updateTag = async (data: { tagId: string; name?: string; color?: string }) => {
    return await request.put('/tag', data)
}

export const deleteTag = async (tagId: string) => {
    return await request.delete(`/tag/${tagId}`)
}

export const addPageTag = async (data: { pageId: string; tagId: string }) => {
    return await request.post('/page-tag', data)
}

export const removePageTag = async (pageId: string, tagId: string) => {
    return await request.delete('/page-tag', { params: { pageId, tagId } })
}

export const fetchPageTags = async (pageId: string) => {
    return await request.get(`/page/${pageId}/tags`)
}

export const fetchTagPages = async (tagId: string) => {
    return await request.get(`/tag/${tagId}/pages`)
}

export const batchFetchPageTags = async (pageIds: string[]) => {
    return await request.post('/page-tags/batch', { pageIds })
}
