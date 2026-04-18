import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'

import { closeTestApp, createTestApp, createTestUser, cleanupAll } from '../../test/helpers'

describe('TagController', () => {
    let app: INestApplication
    let testUser: { user: any; token: string }
    let createdPageId: string
    let createdTagId: string

    beforeAll(async () => {
        app = await createTestApp()
        testUser = await createTestUser(app, 'testtaguser', 'testpass123')

        const pageRes = await request(app.getHttpServer())
            .post('/api/page')
            .set('Authorization', `Bearer ${testUser.token}`)
            .send({ emoji: '📄', title: 'Tag Test Page' })
        createdPageId = pageRes.body.data.pageId
    })

    afterAll(async () => {
        await cleanupAll(app)
        await closeTestApp()
    })

    it('TG-001: should return tag list', async () => {
        const res = await request(app.getHttpServer())
            .get('/api/tags')
            .set('Authorization', `Bearer ${testUser.token}`)
        expect(res.status).toBe(200)
        expect(res.body).toHaveProperty('data')
    })

    it('TG-002: should create a tag', async () => {
        const res = await request(app.getHttpServer())
            .post('/api/tag')
            .set('Authorization', `Bearer ${testUser.token}`)
            .send({ name: 'Test Tag' })
        expect(res.status).toBe(201)
        expect(res.body.success).toBe(true)
        createdTagId = res.body.data.tagId
    })

    it('TG-003: should create a tag with color', async () => {
        const res = await request(app.getHttpServer())
            .post('/api/tag')
            .set('Authorization', `Bearer ${testUser.token}`)
            .send({ name: 'Colored Tag', color: '#ff0000' })
        expect(res.status).toBe(201)
        expect(res.body.success).toBe(true)
    })

    it('TG-004: should update a tag', async () => {
        if (!createdTagId) return
        const res = await request(app.getHttpServer())
            .put('/api/tag')
            .set('Authorization', `Bearer ${testUser.token}`)
            .send({ tagId: createdTagId, name: 'Updated Tag' })
        expect(res.status).toBe(200)
        expect(res.body.success).toBe(true)
    })

    it('TG-006: should add tag to page', async () => {
        if (!createdTagId) return
        const res = await request(app.getHttpServer())
            .post('/api/page-tag')
            .set('Authorization', `Bearer ${testUser.token}`)
            .send({ pageId: createdPageId, tagId: createdTagId })
        expect(res.status).toBe(201)
        expect(res.body.success).toBe(true)
    })

    it('TG-008: should return page tags', async () => {
        const res = await request(app.getHttpServer())
            .get(`/api/page/${createdPageId}/tags`)
            .set('Authorization', `Bearer ${testUser.token}`)
        expect(res.status).toBe(200)
        expect(res.body).toHaveProperty('data')
    })

    it('TG-009: should return pages for a tag', async () => {
        if (!createdTagId) return
        const res = await request(app.getHttpServer())
            .get(`/api/tag/${createdTagId}/pages`)
            .set('Authorization', `Bearer ${testUser.token}`)
        expect(res.status).toBe(200)
        expect(res.body).toHaveProperty('data')
    })

    it('TG-007: should remove tag from page', async () => {
        if (!createdTagId) return
        const res = await request(app.getHttpServer())
            .delete(`/api/page-tag?pageId=${createdPageId}&tagId=${createdTagId}`)
            .set('Authorization', `Bearer ${testUser.token}`)
        expect(res.status).toBe(200)
        expect(res.body.success).toBe(true)
    })

    it('TG-005: should delete a tag', async () => {
        if (!createdTagId) return
        const res = await request(app.getHttpServer())
            .delete(`/api/tag/${createdTagId}`)
            .set('Authorization', `Bearer ${testUser.token}`)
        expect(res.status).toBe(200)
        expect(res.body.success).toBe(true)
    })
})
