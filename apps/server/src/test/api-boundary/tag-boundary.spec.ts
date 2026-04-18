import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'

import { closeTestApp, createTestApp, createTestUser, cleanupAll } from '../../test/helpers'

describe('API Boundary - Tag', () => {
    let app: INestApplication
    let testUser: { user: any; token: string }
    let createdPageId: string
    let createdTagId: string

    beforeAll(async () => {
        app = await createTestApp()
        testUser = await createTestUser(app, 'testboundarytag', 'testpass123')

        const pageRes = await request(app.getHttpServer())
            .post('/api/page')
            .set('Authorization', `Bearer ${testUser.token}`)
            .send({ emoji: '📄', title: 'Tag Boundary Test' })
        if (pageRes.status === 201 && pageRes.body.data) {
            createdPageId = pageRes.body.data.pageId
        }

        const tagRes = await request(app.getHttpServer())
            .post('/api/tag')
            .set('Authorization', `Bearer ${testUser.token}`)
            .send({ name: 'BoundaryTag', color: '#ff0000' })
        if ((tagRes.status === 201 || tagRes.status === 200) && tagRes.body.data) {
            createdTagId = tagRes.body.data.tagId || tagRes.body.data.id
        }
    })

    afterAll(async () => {
        await cleanupAll(app)
        await closeTestApp(app)
    })

    describe('API-TAG-001: 创建同名标签', () => {
        it('should handle duplicate tag name', async () => {
            const res1 = await request(app.getHttpServer())
                .post('/api/tag')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ name: 'DuplicateTag', color: '#00ff00' })
            expect([201, 200]).toContain(res1.status)

            const res2 = await request(app.getHttpServer())
                .post('/api/tag')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ name: 'DuplicateTag', color: '#0000ff' })
            expect([201, 200, 409, 400]).toContain(res2.status)
        })
    })

    describe('API-TAG-002: 删除标签后页面标签关联', () => {
        it('should remove tag association from page after tag deletion', async () => {
            if (!createdPageId || !createdTagId) return

            await request(app.getHttpServer())
                .post('/api/page-tag')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ pageId: createdPageId, tagId: createdTagId })

            await request(app.getHttpServer())
                .delete(`/api/tag/${createdTagId}`)
                .set('Authorization', `Bearer ${testUser.token}`)

            const res = await request(app.getHttpServer())
                .get(`/api/page/${createdPageId}/tags`)
                .set('Authorization', `Bearer ${testUser.token}`)
            expect(res.status).toBe(200)
            const tags = res.body.data || []
            const found = Array.isArray(tags) && tags.some((t: any) =>
                (t.tagId || t.id) === createdTagId
            )
            expect(found).toBe(false)
        })
    })

    describe('API-TAG-003: 重复添加页面标签', () => {
        it('should handle duplicate page-tag association', async () => {
            if (!createdPageId) return
            const tagRes = await request(app.getHttpServer())
                .post('/api/tag')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ name: 'DupPageTag', color: '#123456' })
            if ((tagRes.status !== 201 && tagRes.status !== 200) || !tagRes.body.data) return

            const tagId = tagRes.body.data.tagId || tagRes.body.data.id
            if (!tagId) return

            await request(app.getHttpServer())
                .post('/api/page-tag')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ pageId: createdPageId, tagId })

            const res = await request(app.getHttpServer())
                .post('/api/page-tag')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ pageId: createdPageId, tagId })
            expect([200, 201, 409, 400]).toContain(res.status)
        })
    })
})
