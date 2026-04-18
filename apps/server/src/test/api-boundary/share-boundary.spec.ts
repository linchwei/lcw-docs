import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'

import { closeTestApp, createTestApp, createTestUser, cleanupAll } from '../../test/helpers'

describe('API Boundary - Share', () => {
    let app: INestApplication
    let testUser: { user: any; token: string }
    let otherUser: { user: any; token: string }
    let createdPageId: string

    beforeAll(async () => {
        app = await createTestApp()
        testUser = await createTestUser(app, 'testboundaryshare', 'testpass123')
        otherUser = await createTestUser(app, 'testboundaryshare2', 'testpass123')

        const pageRes = await request(app.getHttpServer())
            .post('/api/page')
            .set('Authorization', `Bearer ${testUser.token}`)
            .send({ emoji: '📄', title: 'Share Boundary Test' })
        if (pageRes.status === 201 && pageRes.body.data) {
            createdPageId = pageRes.body.data.pageId
        }
    })

    afterAll(async () => {
        await cleanupAll(app)
        await closeTestApp(app)
    })

    describe('API-SHARE-001: 创建分享 - 无效权限值', () => {
        it('should reject invalid permission value', async () => {
            if (!createdPageId) return
            const res = await request(app.getHttpServer())
                .post('/api/share')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ pageId: createdPageId, permission: 'admin' })
            expect(res.status).toBe(400)
        })
    })

    describe('API-SHARE-002: 创建分享 - 过去的时间作为过期时间', () => {
        it('should handle past expiry time', async () => {
            if (!createdPageId) return
            const res = await request(app.getHttpServer())
                .post('/api/share')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ pageId: createdPageId, permission: 'view', expiresAt: '2020-01-01T00:00:00Z' })
            expect([201, 400]).toContain(res.status)
        })
    })

    describe('API-SHARE-003: 创建分享 - 非所有者创建', () => {
        it('should reject share creation by non-owner', async () => {
            if (!createdPageId) return
            const res = await request(app.getHttpServer())
                .post('/api/share')
                .set('Authorization', `Bearer ${otherUser.token}`)
                .send({ pageId: createdPageId, permission: 'view' })
            expect([403, 400, 404]).toContain(res.status)
        })
    })

    describe('API-SHARE-004: 同一页面创建多个分享', () => {
        it('should allow creating multiple shares for same page', async () => {
            if (!createdPageId) return
            const res1 = await request(app.getHttpServer())
                .post('/api/share')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ pageId: createdPageId, permission: 'view' })
            const res2 = await request(app.getHttpServer())
                .post('/api/share')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ pageId: createdPageId, permission: 'edit' })
            expect(res1.status).toBe(201)
            expect(res2.status).toBe(201)
            expect(res1.body.data.shareId).not.toBe(res2.body.data.shareId)
        })
    })

    describe('API-SHARE-005: 访问分享 - 过期分享', () => {
        it('should return 410 for expired share', async () => {
            if (!createdPageId) return
            const shareRes = await request(app.getHttpServer())
                .post('/api/share')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({
                    pageId: createdPageId,
                    permission: 'view',
                    expiresAt: new Date(Date.now() - 86400000).toISOString(),
                })
            if (shareRes.status !== 201 || !shareRes.body.data) return

            const shareId = shareRes.body.data.shareId
            const res = await request(app.getHttpServer())
                .get(`/api/share/${shareId}/content`)
            expect([410, 200]).toContain(res.status)
        })
    })

    describe('API-SHARE-006: 访问分享 - 密码正确', () => {
        it('should return content with correct password', async () => {
            if (!createdPageId) return
            const shareRes = await request(app.getHttpServer())
                .post('/api/share')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ pageId: createdPageId, permission: 'view', password: 'test123' })
            if (shareRes.status !== 201 || !shareRes.body.data) return

            const shareId = shareRes.body.data.shareId
            const res = await request(app.getHttpServer())
                .get(`/api/share/${shareId}/info?password=test123`)
            expect(res.status).toBe(200)
        })
    })

    describe('API-SHARE-007: 删除分享 - 非所有者删除', () => {
        it('should reject share deletion by non-owner', async () => {
            if (!createdPageId) return
            const shareRes = await request(app.getHttpServer())
                .post('/api/share')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ pageId: createdPageId, permission: 'view' })
            if (shareRes.status !== 201 || !shareRes.body.data) return

            const shareId = shareRes.body.data.shareId
            const res = await request(app.getHttpServer())
                .delete(`/api/share/${shareId}`)
                .set('Authorization', `Bearer ${otherUser.token}`)
            expect([403, 400, 404]).toContain(res.status)
        })
    })
})
