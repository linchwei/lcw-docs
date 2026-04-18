import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'

import { closeTestApp, createTestApp, createTestUser, cleanupAll } from '../../test/helpers'

describe('SyncController', () => {
    let app: INestApplication
    let testUser: { user: any; token: string }
    let createdPageId: string

    beforeAll(async () => {
        app = await createTestApp()
        testUser = await createTestUser(app, 'testsyncuser', 'testpass123')

        const pageRes = await request(app.getHttpServer())
            .post('/api/page')
            .set('Authorization', `Bearer ${testUser.token}`)
            .send({ emoji: '📄', title: 'Sync Test Page' })
        createdPageId = pageRes.body.data.pageId
    })

    afterAll(async () => {
        await cleanupAll(app)
        await closeTestApp()
    })

    describe('GET /api/doc/:pageId/ops', () => {
        it('SY-001: should get ops for a page', async () => {
            const res = await request(app.getHttpServer())
                .get(`/api/doc/${createdPageId}/ops?since=0`)
                .set('Authorization', `Bearer ${testUser.token}`)
            expect(res.status).toBe(200)
            expect(res.body).toHaveProperty('data')
            expect(res.body.success).toBe(true)
        })
    })

    describe('POST /api/doc/:pageId/ops', () => {
        it('SY-002: should push ops for a page', async () => {
            const res = await request(app.getHttpServer())
                .post(`/api/doc/${createdPageId}/ops`)
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ update: 'AA==' })
            expect(res.status).toBe(201)
            expect(res.body).toHaveProperty('data')
            expect(res.body.success).toBe(true)
        })
    })

    describe('GET /api/doc/:pageId/snapshot', () => {
        it('SY-003: should get snapshot for a page', async () => {
            const res = await request(app.getHttpServer())
                .get(`/api/doc/${createdPageId}/snapshot`)
                .set('Authorization', `Bearer ${testUser.token}`)
            expect(res.status).toBe(200)
            expect(res.body).toHaveProperty('data')
            expect(res.body.success).toBe(true)
        })
    })
})
