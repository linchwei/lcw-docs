import { request } from '@/utils/request'

export const fetchFolders = async () => {
    return await request.get('/folder')
}

export const createFolder = async (data: { name: string; parentId?: string }) => {
    return await request.post('/folder', data)
}

export const updateFolder = async (data: { folderId: string; name?: string; parentId?: string | null; sortOrder?: number }) => {
    return await request.put('/folder', data)
}

export const deleteFolder = async (folderId: string) => {
    return await request.delete(`/folder/${folderId}`)
}
