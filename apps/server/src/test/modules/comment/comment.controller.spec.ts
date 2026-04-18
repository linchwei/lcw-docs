import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'

import { closeTestApp, createTestApp, createTestUser, cleanupAll } from '../../test/helpers'

describe('CommentController', () => {
    let app: INestApplication
    let testUser: { user: any; token: string }
    let createdPageId: string
    let createdCommentId: string

    beforeAll(async () => {
        app = await createTestApp()
        testUser = await createTestUser(app, 'testcommentuser', 'testpass123')

        const pageRes = await request(app.getHttpServer())
            .post('/api/page')
            .set('Authorization', `Bearer ${testUser.token}`)
            .send({ emoji: '📄', title: 'Comment Test Page' })
        createdPageId = pageRes.body.data.pageId
    })

    afterAll(async () => {
        await cleanupAll(app)
        await closeTestApp()
    })

    describe('POST /api/page/:pageId/comment', () => {
        it('CM-001: should create a comment', async () => {
            const res = await request(app.getHttpServer())
                .post(`/api/page/${createdPageId}/comment`)
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ pageId: createdPageId, content: 'Test comment' })
            expect(res.status).toBe(201)
            expect(res.body).toHaveProperty('data')
            expect(res.body.success).toBe(true)
            createdCommentId = res.body.data.commentId
        })

        it('CM-002: should create a comment with anchor', async () => {
            const res = await request(app.getHttpServer())
                .post(`/api/page/${createdPageId}/comment`)
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ pageId: createdPageId, content: 'Anchored comment', anchorText: 'selected text', anchorPos: '1-10' })
            expect(res.status).toBe(201)
            expect(res.body.success).toBe(true)
        })
    })

    describe('GET /api/page/:pageId/comments', () => {
        it('CM-003: should return page comments', async () => {
            const res = await request(app.getHttpServer())
                .get(`/api/page/${createdPageId}/comments`)
                .set('Authorization', `Bearer ${testUser.token}`)
            expect(res.status).toBe(200)
            expect(res.body).toHaveProperty('data')
            expect(Array.isArray(res.body.data)).toBe(true)
        })
    })

    describe('POST /api/comment/:commentId/reply', () => {
        it('CM-004: should reply to a comment', async () => {
            if (!createdCommentId) return
            const res = await request(app.getHttpServer())
                .post(`/api/comment/${createdCommentId}/reply`)
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ parentId: createdCommentId, content: 'Reply text' })
            expect(res.status).toBe(201)
            expect(res.body.success).toBe(true)
        })
    })

    describe('PUT /api/comment/:commentId/resolve', () => {
        it('CM-005: should resolve a comment', async () => {
            if (!createdCommentId) return
            const res = await request(app.getHttpServer())
                .put(`/api/comment/${createdCommentId}/resolve`)
                .set('Authorization', `Bearer ${testUser.token}`)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })
    })

    describe('DELETE /api/comment/:commentId', () => {
        it('CM-006: should delete a comment', async () => {
            if (!createdCommentId) return
            const res = await request(app.getHttpServer())
                .delete(`/api/comment/${createdCommentId}`)
                .set('Authorization', `Bearer ${testUser.token}`)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })
    })
})
