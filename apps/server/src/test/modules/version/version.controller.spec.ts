import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'

import { closeTestApp, createTestApp, createTestUser, cleanupAll } from '../../test/helpers'

describe('VersionController', () => {
    let app: INestApplication
    let testUser: { user: any; token: string }
    let createdPageId: string
    let createdVersionId: string

    beforeAll(async () => {
        app = await createTestApp()
        testUser = await createTestUser(app, 'testversionuser', 'testpass123')

        const pageRes = await request(app.getHttpServer())
            .post('/api/page')
            .set('Authorization', `Bearer ${testUser.token}`)
            .send({ emoji: '📄', title: 'Version Test Page' })
        createdPageId = pageRes.body.data.pageId
    })

    afterAll(async () => {
        await cleanupAll(app)
        await closeTestApp()
    })

    describe('POST /api/page/:pageId/version', () => {
        it('VR-001: should create a version', async () => {
            const res = await request(app.getHttpServer())
                .post(`/api/page/${createdPageId}/version`)
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ pageId: createdPageId })
            expect(res.status).toBe(201)
            expect(res.body).toHaveProperty('data')
            expect(res.body.success).toBe(true)
            createdVersionId = res.body.data.versionId
        })

        it('VR-002: should create a version with description', async () => {
            const res = await request(app.getHttpServer())
                .post(`/api/page/${createdPageId}/version`)
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ pageId: createdPageId, description: 'Test version description' })
            expect(res.status).toBe(201)
            expect(res.body).toHaveProperty('data')
            expect(res.body.success).toBe(true)
        })
    })

    describe('GET /api/page/:pageId/versions', () => {
        it('VR-003: should return version list', async () => {
            const res = await request(app.getHttpServer())
                .get(`/api/page/${createdPageId}/versions`)
                .set('Authorization', `Bearer ${testUser.token}`)
            expect(res.status).toBe(200)
            expect(res.body).toHaveProperty('data')
            expect(Array.isArray(res.body.data)).toBe(true)
        })
    })

    describe('GET /api/version/:versionId', () => {
        it('VR-004: should return version detail', async () => {
            if (!createdVersionId) return
            const res = await request(app.getHttpServer())
                .get(`/api/version/${createdVersionId}`)
                .set('Authorization', `Bearer ${testUser.token}`)
            expect(res.status).toBe(200)
            expect(res.body).toHaveProperty('data')
        })
    })

    describe('DELETE /api/version/:versionId', () => {
        it('VR-005: should delete a version', async () => {
            if (!createdVersionId) return
            const res = await request(app.getHttpServer())
                .delete(`/api/version/${createdVersionId}`)
                .set('Authorization', `Bearer ${testUser.token}`)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })
    })

    describe('POST /api/page/:pageId/version/:versionId/rollback', () => {
        let versionIdForRollback: string

        beforeAll(async () => {
            const res = await request(app.getHttpServer())
                .post(`/api/page/${createdPageId}/version`)
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ pageId: createdPageId, description: 'Version for rollback' })
            versionIdForRollback = res.body.data.versionId
        })

        it('VR-006: should rollback to a version', async () => {
            if (!versionIdForRollback) return
            const res = await request(app.getHttpServer())
                .post(`/api/page/${createdPageId}/version/${versionIdForRollback}/rollback`)
                .set('Authorization', `Bearer ${testUser.token}`)
            expect(res.status).toBe(201)
            expect(res.body.success).toBe(true)
        })

        it('VR-008: should return 404 for non-existent version rollback', async () => {
            const res = await request(app.getHttpServer())
                .post(`/api/page/${createdPageId}/version/nonexistent/rollback`)
                .set('Authorization', `Bearer ${testUser.token}`)
            expect(res.status).toBe(404)
        })
    })

    describe('GET /api/page/:pageId/version/:v1/diff/:v2', () => {
        let v1: string
        let v2: string

        beforeAll(async () => {
            const res1 = await request(app.getHttpServer())
                .post(`/api/page/${createdPageId}/version`)
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ pageId: createdPageId, description: 'Version 1' })
            v1 = res1.body.data.versionId

            const res2 = await request(app.getHttpServer())
                .post(`/api/page/${createdPageId}/version`)
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ pageId: createdPageId, description: 'Version 2' })
            v2 = res2.body.data.versionId
        })

        it('VR-007: should diff two versions', async () => {
            if (!v1 || !v2) return
            const res = await request(app.getHttpServer())
                .get(`/api/page/${createdPageId}/version/${v1}/diff/${v2}`)
                .set('Authorization', `Bearer ${testUser.token}`)
            expect(res.status).toBe(200)
            expect(res.body).toHaveProperty('data')
        })
    })
})
