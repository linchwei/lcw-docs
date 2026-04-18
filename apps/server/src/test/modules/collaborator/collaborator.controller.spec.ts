import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'

import { closeTestApp, createTestApp, createTestUser, cleanupAll } from '../../test/helpers'

describe('CollaboratorController', () => {
    let app: INestApplication
    let testUser: { user: any; token: string }
    let secondUser: { user: any; token: string }
    let createdPageId: string

    beforeAll(async () => {
        app = await createTestApp()
        testUser = await createTestUser(app, 'testcollabowner', 'testpass123')
        secondUser = await createTestUser(app, 'testcollabguest', 'testpass123')

        const pageRes = await request(app.getHttpServer())
            .post('/api/page')
            .set('Authorization', `Bearer ${testUser.token}`)
            .send({ emoji: '📄', title: 'Collab Test Page' })
        createdPageId = pageRes.body.data.pageId
    })

    afterAll(async () => {
        await cleanupAll(app)
        await closeTestApp()
    })

    describe('GET /api/page/:pageId/collaborators', () => {
        it('CL-001: should return collaborator list', async () => {
            const res = await request(app.getHttpServer())
                .get(`/api/page/${createdPageId}/collaborators`)
                .set('Authorization', `Bearer ${testUser.token}`)
            expect(res.status).toBe(200)
            expect(res.body).toHaveProperty('data')
        })
    })

    describe('POST /api/page/:pageId/collaborator', () => {
        it('CL-002: should add a collaborator', async () => {
            const res = await request(app.getHttpServer())
                .post(`/api/page/${createdPageId}/collaborator`)
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ username: 'testcollabguest', role: 'editor' })
            expect(res.status).toBe(201)
            expect(res.body.success).toBe(true)
        })

        it('CL-003: should fail with invalid role', async () => {
            const res = await request(app.getHttpServer())
                .post(`/api/page/${createdPageId}/collaborator`)
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ username: 'testcollabguest', role: 'admin' })
            expect(res.status).toBe(400)
        })

        it('CL-006: should fail with non-existent user', async () => {
            const res = await request(app.getHttpServer())
                .post(`/api/page/${createdPageId}/collaborator`)
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ username: 'nonexistentuser', role: 'viewer' })
            expect(res.status).toBe(404)
        })
    })

    describe('PUT /api/collaborator/:collaboratorId', () => {
        it('CL-004: should update collaborator role', async () => {
            const listRes = await request(app.getHttpServer())
                .get(`/api/page/${createdPageId}/collaborators`)
                .set('Authorization', `Bearer ${testUser.token}`)
            const collaboratorId = listRes.body.data?.[0]?.collaboratorId
            if (!collaboratorId) return

            const res = await request(app.getHttpServer())
                .put(`/api/collaborator/${collaboratorId}`)
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ role: 'viewer' })
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })
    })

    describe('DELETE /api/collaborator/:collaboratorId', () => {
        it('CL-005: should remove a collaborator', async () => {
            const listRes = await request(app.getHttpServer())
                .get(`/api/page/${createdPageId}/collaborators`)
                .set('Authorization', `Bearer ${testUser.token}`)
            const collaboratorId = listRes.body.data?.[0]?.collaboratorId
            if (!collaboratorId) return

            const res = await request(app.getHttpServer())
                .delete(`/api/collaborator/${collaboratorId}`)
                .set('Authorization', `Bearer ${testUser.token}`)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })
    })
})
