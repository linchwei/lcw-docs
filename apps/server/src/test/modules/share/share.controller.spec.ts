import { INestApplication } from '@nestjs/common'
import request from 'supertest'

import { cleanupAll, closeTestApp, createTestApp, createTestUser } from '../../helpers'

describe('ShareController', () => {
    let app: INestApplication
    let testUser: { user: any; token: string }
    let createdPageId: string
    let createdShareId: string

    beforeAll(async () => {
        app = await createTestApp()
        testUser = await createTestUser(app, 'testshareuser', 'testpass123')

        const pageRes = await request(app.getHttpServer())
            .post('/api/page')
            .set('Authorization', `Bearer ${testUser.token}`)
            .send({ emoji: '📄', title: 'Share Test Page' })
        if (pageRes.status === 201 && pageRes.body.data) {
            createdPageId = pageRes.body.data.pageId
        }
    })

    afterAll(async () => {
        await cleanupAll(app)
        await closeTestApp()
    })

    describe('POST /api/share', () => {
        it('SH-001: should create a share link', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/share')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ pageId: createdPageId, permission: 'view' })
            expect(res.status).toBe(201)
            expect(res.body).toHaveProperty('data')
            expect(res.body.success).toBe(true)
            if (res.body.data) {
                createdShareId = res.body.data.shareId
            }
        })

        it('SH-002: should create a share with password', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/share')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ pageId: createdPageId, permission: 'view', password: 'secret123' })
            expect(res.status).toBe(201)
            expect(res.body.success).toBe(true)
        })

        it('SH-003: should create a share with expiry', async () => {
            const futureDate = new Date(Date.now() + 86400000).toISOString()
            const res = await request(app.getHttpServer())
                .post('/api/share')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ pageId: createdPageId, permission: 'edit', expiresAt: futureDate })
            expect(res.status).toBe(201)
            expect(res.body.success).toBe(true)
        })

        it('SH-004: should return 401 without auth', async () => {
            const res = await request(app.getHttpServer()).post('/api/share').send({ pageId: createdPageId, permission: 'view' })
            expect(res.status).toBe(401)
        })
    })

    describe('GET /api/share/page/:pageId', () => {
        it('SH-005: should return shares for a page', async () => {
            const res = await request(app.getHttpServer())
                .get(`/api/share/page/${createdPageId}`)
                .set('Authorization', `Bearer ${testUser.token}`)
            expect(res.status).toBe(200)
            expect(res.body).toHaveProperty('data')
        })
    })

    describe('DELETE /api/share/:shareId', () => {
        it('SH-006: should delete a share', async () => {
            if (!createdShareId) return
            const res = await request(app.getHttpServer())
                .delete(`/api/share/${createdShareId}`)
                .set('Authorization', `Bearer ${testUser.token}`)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })
    })

    describe('GET /api/share/:shareId/info', () => {
        it('SH-007: should access share info publicly', async () => {
            const shareRes = await request(app.getHttpServer())
                .post('/api/share')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ pageId: createdPageId, permission: 'view' })
            if (!(shareRes.status === 201 && shareRes.body.data)) return
            const shareId = shareRes.body.data.shareId

            const res = await request(app.getHttpServer()).get(`/api/share/${shareId}/info`)
            expect(res.status).toBe(200)
            expect(res.body).toHaveProperty('data')
        })

        it('SH-008: should require password for protected share', async () => {
            const shareRes = await request(app.getHttpServer())
                .post('/api/share')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ pageId: createdPageId, permission: 'view', password: 'secret123' })
            if (!(shareRes.status === 201 && shareRes.body.data)) return
            const shareId = shareRes.body.data.shareId

            const res = await request(app.getHttpServer()).get(`/api/share/${shareId}/info`)
            // share.service.access() throws UnauthorizedException (401) when password is required but not provided
            expect([401, 403]).toContain(res.status)
        })

        it('SH-009: should fail with wrong password', async () => {
            const shareRes = await request(app.getHttpServer())
                .post('/api/share')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ pageId: createdPageId, permission: 'view', password: 'secret123' })
            if (!(shareRes.status === 201 && shareRes.body.data)) return
            const shareId = shareRes.body.data.shareId

            const res = await request(app.getHttpServer()).get(`/api/share/${shareId}/info?password=wrongpassword`)
            // share.service.access() throws UnauthorizedException (401) for invalid password
            expect([401, 403]).toContain(res.status)
        })
    })

    describe('GET /api/share/:shareId/content', () => {
        it('SH-010: should get share content publicly', async () => {
            const shareRes = await request(app.getHttpServer())
                .post('/api/share')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ pageId: createdPageId, permission: 'view' })
            if (!(shareRes.status === 201 && shareRes.body.data)) return
            const shareId = shareRes.body.data.shareId

            const res = await request(app.getHttpServer()).get(`/api/share/${shareId}/content`)
            expect(res.status).toBe(200)
        })

        it('SH-011: should return 404 for non-existent share', async () => {
            const res = await request(app.getHttpServer()).get('/api/share/nonexistentshareid/content')
            expect(res.status).toBe(404)
        })
    })
})
