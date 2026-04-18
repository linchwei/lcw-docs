import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'

import { closeTestApp, createTestApp, createTestUser, cleanupAll } from '../../test/helpers'

describe('PageController', () => {
    let app: INestApplication
    let testUser: { user: any; token: string }
    let createdPageId: string

    beforeAll(async () => {
        app = await createTestApp()
        testUser = await createTestUser(app, 'testpageuser', 'testpass123')
    })

    afterAll(async () => {
        await cleanupAll(app)
        await closeTestApp()
    })

    describe('POST /api/page', () => {
        it('PG-001: should create a page', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/page')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ emoji: '📄', title: 'Test Page' })
            expect(res.status).toBe(201)
            expect(res.body).toHaveProperty('data')
            expect(res.body.data).toHaveProperty('title', 'Test Page')
            expect(res.body.success).toBe(true)
            createdPageId = res.body.data.pageId
        })

        it('PG-002: should return 401 without auth', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/page')
                .send({ emoji: '📄', title: 'Test' })
            expect(res.status).toBe(401)
        })

        it('PG-003: should fail with missing required fields', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/page')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({})
            expect(res.status).toBe(400)
        })
    })

    describe('PUT /api/page', () => {
        it('PG-004: should update page title', async () => {
            const res = await request(app.getHttpServer())
                .put('/api/page')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ pageId: createdPageId, title: 'Updated Title' })
            expect(res.status).toBe(200)
            expect(res.body.data).toHaveProperty('title', 'Updated Title')
        })

        it('PG-005: should update page cover image', async () => {
            const res = await request(app.getHttpServer())
                .put('/api/page')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ pageId: createdPageId, coverImage: 'https://example.com/cover.jpg' })
            expect(res.status).toBe(200)
            expect(res.body.data).toHaveProperty('coverImage', 'https://example.com/cover.jpg')
        })

        it('PG-006: should update page folder', async () => {
            const res = await request(app.getHttpServer())
                .put('/api/page')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ pageId: createdPageId, folderId: null })
            expect(res.status).toBe(200)
        })

        it('PG-007: should return 404 for non-existent page', async () => {
            const res = await request(app.getHttpServer())
                .put('/api/page')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ pageId: 'nonexistentpageid', title: 'Test' })
            expect(res.status).toBe(404)
        })
    })

    describe('GET /api/page', () => {
        it('PG-008: should return page list', async () => {
            const res = await request(app.getHttpServer())
                .get('/api/page')
                .set('Authorization', `Bearer ${testUser.token}`)
            expect(res.status).toBe(200)
            expect(res.body).toHaveProperty('data')
            expect(res.body.data).toHaveProperty('pages')
            expect(res.body.data).toHaveProperty('count')
        })
    })

    describe('GET /api/page/:pageId', () => {
        it('PG-009: should return page detail', async () => {
            const res = await request(app.getHttpServer())
                .get(`/api/page/${createdPageId}`)
                .set('Authorization', `Bearer ${testUser.token}`)
            expect(res.status).toBe(200)
            expect(res.body).toHaveProperty('data')
            expect(res.body.data).toHaveProperty('pageId', createdPageId)
        })

        it('PG-010: should return 404 for non-existent page', async () => {
            const res = await request(app.getHttpServer())
                .get('/api/page/nonexistentpageid')
                .set('Authorization', `Bearer ${testUser.token}`)
            expect(res.status).toBe(404)
        })
    })

    describe('GET /api/page/search', () => {
        it('PG-011: should search pages', async () => {
            const res = await request(app.getHttpServer())
                .get('/api/page/search?q=Updated')
                .set('Authorization', `Bearer ${testUser.token}`)
            expect(res.status).toBe(200)
            expect(res.body).toHaveProperty('data')
        })

        it('PG-012: should return empty for empty query', async () => {
            const res = await request(app.getHttpServer())
                .get('/api/page/search?q=')
                .set('Authorization', `Bearer ${testUser.token}`)
            expect(res.status).toBe(200)
        })
    })

    describe('GET /api/page/shared', () => {
        it('PG-013: should return shared pages', async () => {
            const res = await request(app.getHttpServer())
                .get('/api/page/shared')
                .set('Authorization', `Bearer ${testUser.token}`)
            expect(res.status).toBe(200)
        })
    })

    describe('GET /api/page/:pageId/backlinks', () => {
        it('PG-014: should return backlinks', async () => {
            const res = await request(app.getHttpServer())
                .get(`/api/page/${createdPageId}/backlinks`)
                .set('Authorization', `Bearer ${testUser.token}`)
            expect(res.status).toBe(200)
        })
    })

    describe('GET /api/page/trash', () => {
        it('PG-015: should return trash pages', async () => {
            const res = await request(app.getHttpServer())
                .get('/api/page/trash')
                .set('Authorization', `Bearer ${testUser.token}`)
            expect(res.status).toBe(200)
        })
    })

    describe('GET /api/page/recent', () => {
        it('PG-016: should return recent pages', async () => {
            const res = await request(app.getHttpServer())
                .get('/api/page/recent')
                .set('Authorization', `Bearer ${testUser.token}`)
            expect(res.status).toBe(200)
        })
    })

    describe('GET /api/page/graph', () => {
        it('PG-017: should return page graph', async () => {
            const res = await request(app.getHttpServer())
                .get('/api/page/graph')
                .set('Authorization', `Bearer ${testUser.token}`)
            expect(res.status).toBe(200)
        })
    })

    describe('PUT /api/page/:pageId/favorite', () => {
        it('PG-018: should toggle favorite - add', async () => {
            const res = await request(app.getHttpServer())
                .put(`/api/page/${createdPageId}/favorite`)
                .set('Authorization', `Bearer ${testUser.token}`)
            expect(res.status).toBe(200)
            expect(res.body.data).toHaveProperty('isFavorite', true)
        })

        it('PG-019: should toggle favorite - remove', async () => {
            const res = await request(app.getHttpServer())
                .put(`/api/page/${createdPageId}/favorite`)
                .set('Authorization', `Bearer ${testUser.token}`)
            expect(res.status).toBe(200)
            expect(res.body.data).toHaveProperty('isFavorite', false)
        })
    })

    describe('DELETE /api/page (soft delete)', () => {
        let pageToDeleteId: string

        beforeAll(async () => {
            const res = await request(app.getHttpServer())
                .post('/api/page')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ emoji: '🗑️', title: 'Page to Delete' })
            pageToDeleteId = res.body.data.pageId
        })

        it('PG-020: should soft delete a page', async () => {
            const res = await request(app.getHttpServer())
                .delete('/api/page')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ pageId: pageToDeleteId })
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })

        it('PG-021: should restore a page', async () => {
            const res = await request(app.getHttpServer())
                .post(`/api/page/${pageToDeleteId}/restore`)
                .set('Authorization', `Bearer ${testUser.token}`)
            expect(res.status).toBe(201)
            expect(res.body.success).toBe(true)
        })

        it('PG-022: should permanently delete a page', async () => {
            await request(app.getHttpServer())
                .delete('/api/page')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ pageId: pageToDeleteId })

            const res = await request(app.getHttpServer())
                .delete(`/api/page/${pageToDeleteId}/permanent`)
                .set('Authorization', `Bearer ${testUser.token}`)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })

        it('PG-023: should return 404 for permanent delete non-existent', async () => {
            const res = await request(app.getHttpServer())
                .delete('/api/page/nonexistentpageid/permanent')
                .set('Authorization', `Bearer ${testUser.token}`)
            expect(res.status).toBe(404)
        })
    })
})
