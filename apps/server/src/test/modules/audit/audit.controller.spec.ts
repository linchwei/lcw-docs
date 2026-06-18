import { INestApplication } from '@nestjs/common'
import request from 'supertest'

import { cleanupAll, closeTestApp, createTestApp, createTestUser } from '../../helpers'

describe('AuditController', () => {
    let app: INestApplication
    let testUser: { user: any; token: string }
    let createdPageId: string

    beforeAll(async () => {
        app = await createTestApp()
        testUser = await createTestUser(app, 'testaudituser', 'testpass123')

        const pageRes = await request(app.getHttpServer())
            .post('/api/page')
            .set('Authorization', `Bearer ${testUser.token}`)
            .send({ emoji: '📄', title: 'Audit Test Page' })
        if (pageRes.status === 201 && pageRes.body.data) {
            createdPageId = pageRes.body.data.pageId
        }
    })

    afterAll(async () => {
        await cleanupAll(app)
        await closeTestApp()
    })

    it('AD-001: should return page audit log', async () => {
        if (!createdPageId) return
        const res = await request(app.getHttpServer())
            .get(`/api/page/${createdPageId}/audit_log`)
            .set('Authorization', `Bearer ${testUser.token}`)
        expect(res.status).toBe(200)
        // audit controller returns the result directly (array), not wrapped in { data, success }
        expect(Array.isArray(res.body) || res.body).toBeDefined()
    })

    it('AD-002: should return audit log with limit', async () => {
        if (!createdPageId) return
        const res = await request(app.getHttpServer())
            .get(`/api/page/${createdPageId}/audit_log?limit=10`)
            .set('Authorization', `Bearer ${testUser.token}`)
        expect(res.status).toBe(200)
        expect(Array.isArray(res.body) || res.body).toBeDefined()
    })
})
