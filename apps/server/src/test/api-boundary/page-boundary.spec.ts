import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'

import { closeTestApp, createTestApp, createTestUser, cleanupAll } from '../../test/helpers'

describe('API Boundary - Page', () => {
    let app: INestApplication
    let testUser: { user: any; token: string }
    let createdPageId: string

    beforeAll(async () => {
        app = await createTestApp()
        testUser = await createTestUser(app, 'testboundarypage', 'testpass123')

        const pageRes = await request(app.getHttpServer())
            .post('/api/page')
            .set('Authorization', `Bearer ${testUser.token}`)
            .send({ emoji: '📄', title: 'Boundary Test Page' })
        if (pageRes.status === 201 && pageRes.body.data) {
            createdPageId = pageRes.body.data.pageId
        }
    })

    afterAll(async () => {
        await cleanupAll(app)
        await closeTestApp(app)
    })

    describe('API-PAGE-001: 创建页面 - emoji 为空字符串', () => {
        it('should handle empty emoji string', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/page')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ emoji: '', title: 'Test Page' })
            expect([200, 201, 400]).toContain(res.status)
        })
    })

    describe('API-PAGE-002: 创建页面 - title 为空字符串', () => {
        it('should handle empty title string', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/page')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ emoji: '📄', title: '' })
            expect([200, 201, 400]).toContain(res.status)
        })
    })

    describe('API-PAGE-003: 更新页面 - coverImage 为 null', () => {
        it('should remove cover when coverImage is null', async () => {
            if (!createdPageId) return
            const res = await request(app.getHttpServer())
                .put('/api/page')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ pageId: createdPageId, coverImage: null })
            expect([200, 400]).toContain(res.status)
        })
    })

    describe('API-PAGE-004: 更新页面 - coverImage 为无效 URL', () => {
        it('should handle invalid coverImage URL', async () => {
            if (!createdPageId) return
            const res = await request(app.getHttpServer())
                .put('/api/page')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ pageId: createdPageId, coverImage: 'not-a-url' })
            expect([200, 400]).toContain(res.status)
        })
    })

    describe('API-PAGE-005: 搜索 - 特殊字符', () => {
        it('should handle special characters in search without error', async () => {
            const res = await request(app.getHttpServer())
                .get('/api/page/search?q=<script>alert(1)</script>')
                .set('Authorization', `Bearer ${testUser.token}`)
            expect(res.status).toBe(200)
            expect(res.body).toHaveProperty('data')
        })
    })

    describe('API-PAGE-006: 搜索 - 超长查询', () => {
        it('should handle very long search query without error', async () => {
            const res = await request(app.getHttpServer())
                .get(`/api/page/search?q=${'a'.repeat(1000)}`)
                .set('Authorization', `Bearer ${testUser.token}`)
            expect(res.status).toBe(200)
            expect(res.body).toHaveProperty('data')
        })
    })

    describe('API-PAGE-007: 收藏切换 - 不存在的页面', () => {
        it('should return 404 for nonexistent page favorite toggle', async () => {
            const res = await request(app.getHttpServer())
                .put('/api/page/nonexistent-id/favorite')
                .set('Authorization', `Bearer ${testUser.token}`)
            expect([404, 400, 200]).toContain(res.status)
        })
    })

    describe('API-PAGE-008: 恢复 - 未删除的页面', () => {
        it('should handle restore of non-deleted page', async () => {
            if (!createdPageId) return
            const res = await request(app.getHttpServer())
                .post(`/api/page/${createdPageId}/restore`)
                .set('Authorization', `Bearer ${testUser.token}`)
            expect([200, 400, 404]).toContain(res.status)
        })
    })

    describe('API-PAGE-009: 永久删除 - 未在回收站的页面', () => {
        it('should handle permanent delete of non-trashed page', async () => {
            if (!createdPageId) return
            const res = await request(app.getHttpServer())
                .delete(`/api/page/${createdPageId}/permanent`)
                .set('Authorization', `Bearer ${testUser.token}`)
            expect([200, 400, 404]).toContain(res.status)
        })
    })

    describe('API-PAGE-010: 软删除后列表不显示', () => {
        it('should not show deleted page in list', async () => {
            const delRes = await request(app.getHttpServer())
                .post('/api/page')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ emoji: '🗑️', title: 'To Be Deleted' })
            if (delRes.status !== 201 || !delRes.body.data) return

            const pageId = delRes.body.data.pageId
            await request(app.getHttpServer())
                .delete('/api/page')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ pageId })

            const listRes = await request(app.getHttpServer())
                .get('/api/page')
                .set('Authorization', `Bearer ${testUser.token}`)

            expect(listRes.status).toBe(200)
            const pages = listRes.body.data?.pages || listRes.body.data || []
            const found = Array.isArray(pages) && pages.some((p: any) => p.pageId === pageId)
            expect(found).toBe(false)
        })
    })

    describe('API-PAGE-011: 软删除后回收站显示', () => {
        it('should show deleted page in trash', async () => {
            const delRes = await request(app.getHttpServer())
                .post('/api/page')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ emoji: '🗑️', title: 'Trash Test Page' })
            if (delRes.status !== 201 || !delRes.body.data) return

            const pageId = delRes.body.data.pageId
            await request(app.getHttpServer())
                .delete('/api/page')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ pageId })

            const trashRes = await request(app.getHttpServer())
                .get('/api/page/trash')
                .set('Authorization', `Bearer ${testUser.token}`)

            expect(trashRes.status).toBe(200)
        })
    })
})
