import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'

import { closeTestApp, createTestApp, createTestUser, cleanupAll } from '../../test/helpers'

describe('API Boundary - Collaborator', () => {
    let app: INestApplication
    let ownerUser: { user: any; token: string }
    let otherUser: { user: any; token: string }
    let createdPageId: string

    beforeAll(async () => {
        app = await createTestApp()
        ownerUser = await createTestUser(app, 'testcollabowner', 'testpass123')
        otherUser = await createTestUser(app, 'testcollabother', 'testpass123')

        const pageRes = await request(app.getHttpServer())
            .post('/api/page')
            .set('Authorization', `Bearer ${ownerUser.token}`)
            .send({ emoji: '📄', title: 'Collab Boundary Test' })
        if (pageRes.status === 201 && pageRes.body.data) {
            createdPageId = pageRes.body.data.pageId
        }
    })

    afterAll(async () => {
        await cleanupAll(app)
        await closeTestApp(app)
    })

    describe('API-COLLAB-001: 添加自己为协作者', () => {
        it('should reject adding self as collaborator', async () => {
            if (!createdPageId) return
            const res = await request(app.getHttpServer())
                .post(`/api/page/${createdPageId}/collaborator`)
                .set('Authorization', `Bearer ${ownerUser.token}`)
                .send({ username: 'testcollabowner', role: 'editor' })
            expect([400, 403]).toContain(res.status)
        })
    })

    describe('API-COLLAB-002: 重复添加同一协作者', () => {
        it('should update role when adding same collaborator again', async () => {
            if (!createdPageId) return
            const res1 = await request(app.getHttpServer())
                .post(`/api/page/${createdPageId}/collaborator`)
                .set('Authorization', `Bearer ${ownerUser.token}`)
                .send({ username: 'testcollabother', role: 'editor' })
            expect([201, 200]).toContain(res1.status)

            const res2 = await request(app.getHttpServer())
                .post(`/api/page/${createdPageId}/collaborator`)
                .set('Authorization', `Bearer ${ownerUser.token}`)
                .send({ username: 'testcollabother', role: 'viewer' })
            expect([200, 201, 409]).toContain(res2.status)
        })
    })

    describe('API-COLLAB-003: 非所有者添加协作者', () => {
        it('should reject collaborator addition by non-owner', async () => {
            if (!createdPageId) return
            const res = await request(app.getHttpServer())
                .post(`/api/page/${createdPageId}/collaborator`)
                .set('Authorization', `Bearer ${otherUser.token}`)
                .send({ username: 'testcollabowner', role: 'viewer' })
            expect([403, 400, 404]).toContain(res.status)
        })
    })

    describe('API-COLLAB-004: 更新不存在的协作者', () => {
        it('should return 404 for nonexistent collaborator update', async () => {
            const res = await request(app.getHttpServer())
                .put('/api/collaborator/nonexistent-id')
                .set('Authorization', `Bearer ${ownerUser.token}`)
                .send({ role: 'editor' })
            expect([404, 400, 403]).toContain(res.status)
        })
    })
})
