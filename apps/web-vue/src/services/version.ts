import { request } from '@/utils/request'

export const createVersion = async (data: { pageId: string; description?: string }) => {
    return await request.post(`/page/${data.pageId}/version`, data)
}

export const fetchVersions = async (pageId: string) => {
    return await request.get(`/page/${pageId}/versions`)
}

export const fetchVersion = async (versionId: string) => {
    return await request.get(`/version/${versionId}`)
}

export const deleteVersion = async (versionId: string) => {
    return await request.delete(`/version/${versionId}`)
}

export const rollbackVersion = async (pageId: string, versionId: string) => {
    return await request.post(`/page/${pageId}/version/${versionId}/rollback`)
}

export const diffVersions = async (pageId: string, v1: string, v2: string) => {
    return await request.get(`/page/${pageId}/version/${v1}/diff/${v2}`)
}
