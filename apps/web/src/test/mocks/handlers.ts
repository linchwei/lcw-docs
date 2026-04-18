import { http, HttpResponse } from 'msw'

const API_BASE = '/api'

export const handlers = [
    http.post(`${API_BASE}/auth/login`, async ({ request }) => {
        const body = await request.json() as { username: string; password: string }
        if (body.username === 'testuser' && body.password === 'testpass123') {
            return HttpResponse.json({
                data: { access_token: 'mock-jwt-token' },
                success: true,
            })
        }
        return HttpResponse.json(
            { message: 'authorized failed', error: 'please try again later.' },
            { status: 400 }
        )
    }),

    http.get(`${API_BASE}/currentUser`, ({ request }) => {
        const authHeader = request.headers.get('Authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }
        return HttpResponse.json({
            data: { id: 1, username: 'testuser' },
        })
    }),

    http.post(`${API_BASE}/auth/logout`, () => {
        return HttpResponse.json({ success: true })
    }),

    http.post(`${API_BASE}/user/logout`, () => {
        return HttpResponse.json({ success: true })
    }),

    http.post(`${API_BASE}/user/register`, async ({ request }) => {
        const body = await request.json() as { username: string; password: string }
        if (body.username === 'duplicateuser') {
            return HttpResponse.json(
                { message: '用户已存在', error: 'user is existed' },
                { status: 400 }
            )
        }
        return HttpResponse.json({
            data: { id: 2, username: body.username },
            success: true,
        }, { status: 201 })
    }),

    http.get(`${API_BASE}/page`, ({ request }) => {
        const authHeader = request.headers.get('Authorization')
        if (!authHeader) {
            return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }
        return HttpResponse.json({
            data: {
                pages: [
                    { pageId: 'page1', title: 'Test Page 1', emoji: '📄', isFavorite: false, isDeleted: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
                    { pageId: 'page2', title: 'Test Page 2', emoji: '📝', isFavorite: true, isDeleted: false, coverImage: 'https://example.com/cover.jpg', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
                ],
                count: 2,
            },
            success: true,
        })
    }),

    http.post(`${API_BASE}/page`, async () => {
        return HttpResponse.json({
            data: { pageId: 'pagenew', title: 'New Page', emoji: '📄' },
            success: true,
        }, { status: 201 })
    }),

    http.put(`${API_BASE}/page`, async () => {
        return HttpResponse.json({
            data: { pageId: 'page1', title: 'Updated Page' },
            success: true,
        })
    }),

    http.delete(`${API_BASE}/page`, async () => {
        return HttpResponse.json({ data: { success: true }, success: true })
    }),

    http.put(`${API_BASE}/page/:pageId/favorite`, async () => {
        return HttpResponse.json({
            data: { pageId: 'page1', isFavorite: true },
            success: true,
        })
    }),

    http.post(`${API_BASE}/page/:pageId/restore`, async () => {
        return HttpResponse.json({ data: { success: true }, success: true })
    }),

    http.delete(`${API_BASE}/page/:pageId/permanent`, async () => {
        return HttpResponse.json({ data: { success: true }, success: true })
    }),

    http.get(`${API_BASE}/page/:pageId/backlinks`, () => {
        return HttpResponse.json({ data: [], success: true })
    }),

    http.get(`${API_BASE}/page/shared`, () => {
        return HttpResponse.json({ data: [], success: true })
    }),

    http.get(`${API_BASE}/page/trash`, () => {
        return HttpResponse.json({ data: [], success: true })
    }),

    http.get(`${API_BASE}/page/recent`, () => {
        return HttpResponse.json({ data: [], success: true })
    }),

    http.get(`${API_BASE}/page/graph`, () => {
        return HttpResponse.json({ data: { nodes: [], edges: [] }, success: true })
    }),

    http.get(`${API_BASE}/page/search`, ({ request }) => {
        const url = new URL(request.url)
        const q = url.searchParams.get('q') || ''
        return HttpResponse.json({
            data: q ? [{ pageId: 'page1', title: 'Test Page 1', snippet: q, matchType: 'title' }] : [],
            success: true,
        })
    }),

    http.get(`${API_BASE}/page/:pageId`, ({ params }) => {
        return HttpResponse.json({
            data: { pageId: params.pageId, title: 'Test Document', emoji: '📄', role: 'owner', user: { id: 1, username: 'testuser' } },
            success: true,
        })
    }),

    http.get(`${API_BASE}/tags`, () => {
        return HttpResponse.json({
            data: [
                { tagId: 'tag1', name: 'Important', color: '#ff0000' },
                { tagId: 'tag2', name: 'Work', color: '#00ff00' },
            ],
            success: true,
        })
    }),

    http.post(`${API_BASE}/tag`, async () => {
        return HttpResponse.json({
            data: { tagId: 'tagnew', name: 'New Tag', color: '#0000ff' },
            success: true,
        }, { status: 201 })
    }),

    http.post(`${API_BASE}/page-tag`, async () => {
        return HttpResponse.json({ data: { success: true }, success: true }, { status: 201 })
    }),

    http.delete(`${API_BASE}/page-tag`, () => {
        return HttpResponse.json({ data: { success: true }, success: true })
    }),

    http.get(`${API_BASE}/page/:pageId/tags`, () => {
        return HttpResponse.json({
            data: [{ tagId: 'tag1', name: 'Important', color: '#ff0000' }],
            success: true,
        })
    }),

    http.post(`${API_BASE}/page-tags/batch`, async ({ request }) => {
        const body = await request.json() as { pageIds: string[] }
        const result: Record<string, any[]> = {}
        for (const pageId of body.pageIds || []) {
            result[pageId] = [{ tagId: 'tag1', name: 'Important', color: '#ff0000' }]
        }
        return HttpResponse.json({ data: result, success: true })
    }),

    http.get(`${API_BASE}/folder`, () => {
        return HttpResponse.json({ data: [], success: true })
    }),

    http.post(`${API_BASE}/folder`, async () => {
        return HttpResponse.json({
            data: { folderId: 'folder1', name: 'New Folder' },
            success: true,
        }, { status: 201 })
    }),

    http.get(`${API_BASE}/notification`, () => {
        return HttpResponse.json({ data: [], success: true })
    }),

    http.get(`${API_BASE}/notification/unread-count`, () => {
        return HttpResponse.json({ data: { count: 0 }, success: true })
    }),

    http.post(`${API_BASE}/notification/read-all`, () => {
        return HttpResponse.json({ data: { success: true }, success: true })
    }),

    http.get(`${API_BASE}/page/:pageId/versions`, () => {
        return HttpResponse.json({ data: [], success: true })
    }),

    http.post(`${API_BASE}/share`, async () => {
        return HttpResponse.json({
            data: { shareId: 'share1', pageId: 'page1', permission: 'view' },
            success: true,
        }, { status: 201 })
    }),

    http.get(`${API_BASE}/share/page/:pageId`, () => {
        return HttpResponse.json({ data: [], success: true })
    }),

    http.get(`${API_BASE}/page/:pageId/collaborators`, () => {
        return HttpResponse.json({ data: [], success: true })
    }),

    http.get(`${API_BASE}/page/:pageId/comments`, () => {
        return HttpResponse.json({ data: [], success: true })
    }),

    http.get(`${API_BASE}/page/:pageId/audit_log`, () => {
        return HttpResponse.json({ data: [], success: true })
    }),
]
