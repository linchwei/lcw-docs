import { request } from '@/utils/request'

export const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)

    const res: any = await request.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data.url
}
