import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'

import { closeTestApp, createTestApp, createTestUser, cleanupAll } from '../../test/helpers'

describe('API Boundary - Comment', () => {
    let app: INestApplication
    let testUser: { user: any; token: string }
    let createdPageId: string

    beforeAll(async () => {
        app = await createTestApp()
        testUser = await createTestUser(app, 'testboundarycmt', 'testpass123')

        const pageRes = await request(app.getHttpServer())
            .post('/api/page')
            .set('Authorization', `Bearer ${testUser.token}`)
            .send({ emoji: '📄', title: 'Comment Boundary Test' })
        if (pageRes.status === 201 && pageRes.body.data) {
            createdPageId = pageRes.body.data.pageId
        }
    })

    afterAll(async () => {
        await cleanupAll(app)
        await closeTestApp(app)
    })

    describe('API-CMT-001: 创建评论 - 空内容', () => {
        it('should reject empty comment content', async () => {
            if (!createdPageId) return
            const res = await request(app.getHttpServer())
                .post(`/api/page/${createdPageId}/comment`)
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ pageId: createdPageId, content: '' })
            expect(res.status).toBe(400)
        })
    })

    describe('API-CMT-002: 创建评论 - 超长内容', () => {
        it('should handle very long comment content', async () => {
            if (!createdPageId) return
            const res = await request(app.getHttpServer())
                .post(`/api/page/${createdPageId}/comment`)
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ pageId: createdPageId, content: 'a'.repeat(10000) })
            expect([201, 200, 400]).toContain(res.status)
        })
    })

    describe('API-CMT-003: 回复不存在的评论', () => {
        it('should return 404 for reply to nonexistent comment', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/comment/nonexistent-comment-id/reply')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ parentId: 'nonexistent-comment-id', content: 'test reply' })
            expect([404, 400]).toContain(res.status)
        })
    })

    describe('API-CMT-004: 解决已解决的评论', () => {
        it('should be idempotent when resolving already resolved comment', async () => {
            if (!createdPageId) return
            const cmtRes = await request(app.getHttpServer())
                .post(`/api/page/${createdPageId}/comment`)
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ pageId: createdPageId, content: 'to be resolved' })
            if (cmtRes.status !== 201 || !cmtRes.body.data) return

            const commentId = cmtRes.body.data.commentId || cmtRes.body.data.id
            if (!commentId) return

            await request(app.getHttpServer())
                .put(`/api/comment/${commentId}/resolve`)
                .set('Authorization', `Bearer ${testUser.token}`)

            const res = await request(app.getHttpServer())
                .put(`/api/comment/${commentId}/resolve`)
                .set('Authorization', `Bearer ${testUser.token}`)
            expect(res.status).toBe(200)
        })
    })
})
