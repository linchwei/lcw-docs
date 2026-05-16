import { http, HttpResponse } from 'msw'

const BASE = '/api'

export const handlers = [
    http.get(`${BASE}/page`, () =>
        HttpResponse.json({
            data: { pages: [], count: 0 },
            success: true,
        })
    ),
    http.get(`${BASE}/page/trash`, () =>
        HttpResponse.json({
            data: [],
            success: true,
        })
    ),
    http.get(`${BASE}/page/recent`, () =>
        HttpResponse.json({
            data: [],
            success: true,
        })
    ),
    http.get(`${BASE}/folder`, () =>
        HttpResponse.json({
            data: [],
            success: true,
        })
    ),
    http.get(`${BASE}/page/shared`, () =>
        HttpResponse.json({
            data: [],
            success: true,
        })
    ),
    http.get(`${BASE}/currentUser`, () =>
        HttpResponse.json({
            data: { username: 'testuser', email: 'test@example.com' },
            success: true,
        })
    ),
    http.post(`${BASE}/page`, () =>
        HttpResponse.json({
            data: { pageId: 'mock-page-id', emoji: '📄', title: '未命名文档' },
            success: true,
        })
    ),
    http.post(`${BASE}/folder`, () =>
        HttpResponse.json({
            data: { folderId: 'mock-folder-id', name: '新建文件夹' },
            success: true,
        })
    ),
]
