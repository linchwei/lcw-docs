import { request } from '@/utils/request'

export const fetchCollaborators = async (pageId: string) => {
    return await request.get(`/page/${pageId}/collaborators`)
}

export const addCollaborator = async (pageId: string, data: { username: string; role: string }) => {
    return await request.post(`/page/${pageId}/collaborator`, data)
}

export const updateCollaborator = async (collaboratorId: string, data: { role: string }) => {
    return await request.put(`/collaborator/${collaboratorId}`, data)
}

export const removeCollaborator = async (collaboratorId: string) => {
    return await request.delete(`/collaborator/${collaboratorId}`)
}
