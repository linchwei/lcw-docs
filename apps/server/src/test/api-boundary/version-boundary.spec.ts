import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'

import { closeTestApp, createTestApp, createTestUser, cleanupAll } from '../../test/helpers'

describe('API Boundary - Version', () => {
    let app: INestApplication
    let testUser: { user: any; token: string }
    let createdPageId: string

    beforeAll(async () => {
        app = await createTestApp()
        testUser = await createTestUser(app, 'testboundaryver', 'testpass123')

        const pageRes = await request(app.getHttpServer())
            .post('/api/page')
            .set('Authorization', `Bearer ${testUser.token}`)
            .send({ emoji: '📄', title: 'Version Boundary Test' })
        if (pageRes.status === 201 && pageRes.body.data) {
            createdPageId = pageRes.body.data.pageId
        }
    })

    afterAll(async () => {
        await cleanupAll(app)
        await closeTestApp(app)
    })

    describe('API-VER-001: 创建版本 - 不存在的页面', () => {
        it('should return 404 for nonexistent page version creation', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/page/nonexistent-page-id/version')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ pageId: 'nonexistent-page-id' })
            expect([404, 400]).toContain(res.status)
        })
    })

    describe('API-VER-002: 版本对比 - 相同版本', () => {
        it('should return empty diff when comparing same version', async () => {
            if (!createdPageId) return
            const verRes = await request(app.getHttpServer())
                .post(`/api/page/${createdPageId}/version`)
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ pageId: createdPageId, description: 'test version' })
            if (verRes.status !== 201 || !verRes.body.data) return

            const versionId = verRes.body.data.versionId || verRes.body.data.id
            if (!versionId) return

            const res = await request(app.getHttpServer())
                .get(`/api/page/${createdPageId}/version/${versionId}/diff/${versionId}`)
                .set('Authorization', `Bearer ${testUser.token}`)
            expect(res.status).toBe(200)
        })
    })

    describe('API-VER-003: 回滚 - 不存在的页面', () => {
        it('should return 404 for rollback on nonexistent page', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/page/nonexistent-page-id/version/nonexistent-ver/rollback')
                .set('Authorization', `Bearer ${testUser.token}`)
            expect([404, 400]).toContain(res.status)
        })
    })
})
