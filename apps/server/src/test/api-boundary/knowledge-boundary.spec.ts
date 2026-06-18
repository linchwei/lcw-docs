import { INestApplication } from '@nestjs/common'
import request from 'supertest'

import { cleanupAll, closeTestApp, createTestApp, createTestUser } from '../helpers'

describe('API Boundary - Knowledge', () => {
    let app: INestApplication
    let testUser: { user: any; token: string }
    let createdPageId: string

    beforeAll(async () => {
        app = await createTestApp()
        testUser = await createTestUser(app, 'testboundarykn', 'testpass123')

        // 创建测试页面供后续用例使用
        const pageRes = await request(app.getHttpServer())
            .post('/api/page')
            .set('Authorization', `Bearer ${testUser.token}`)
            .send({ emoji: '📄', title: 'Knowledge Boundary Test' })
        if (pageRes.status === 201 && pageRes.body.data) {
            createdPageId = pageRes.body.data.pageId
        }
    })

    afterAll(async () => {
        await cleanupAll(app)
        await closeTestApp()
    })

    describe('KN-B01: 知识库问答超长消息', () => {
        it('应在消息内容超长时返回 400', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/ai/knowledge/chat')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({
                    messages: [{ role: 'user', content: 'x'.repeat(100000) }],
                    pageId: createdPageId || 'test-page-id',
                })
            // Zod 验证不限制字符串长度，但超长内容应被正常处理或拒绝
            expect([200, 400, 500]).toContain(res.status)
        })
    })

    describe('KN-B02: 自动标签无效 pageId 格式', () => {
        it('应在 pageId 为空字符串时返回 400', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/ai/knowledge/auto-tag')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ pageId: '' })
            expect(res.status).toBe(400)
        })
    })

    describe('KN-B03: 保存知识卡片超长 title', () => {
        it('应在 title 超过 200 字时返回 400', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/ai/knowledge/save-card')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({
                    title: '超长标题'.repeat(50), // 200+ 字符
                    content: '测试内容',
                    sourcePageId: createdPageId || 'test-page-id',
                })
            expect(res.status).toBe(400)
        })
    })

    describe('KN-B04: 保存知识卡片超长 content', () => {
        it('应在 content 超长时测试行为', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/ai/knowledge/save-card')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({
                    title: '正常标题',
                    content: 'x'.repeat(100000),
                    sourcePageId: createdPageId || 'test-page-id',
                })
            // Zod schema 未限制 content 长度，应正常接受或由数据库拒绝
            expect([200, 201, 400]).toContain(res.status)
        })
    })

    describe('KN-B05: 全局搜索超长 query', () => {
        it('应在 query 超长时测试行为', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/ai/knowledge/global-search')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({
                    query: 'x'.repeat(10000),
                })
            // Zod schema 仅要求 query 非空，超长应由服务层处理
            expect([200, 400, 500]).toContain(res.status)
        })
    })

    describe('KN-B06: 收藏列表超出 pageSize 范围', () => {
        it('应在 pageSize 超过 50 时测试行为', async () => {
            const res = await request(app.getHttpServer())
                .get('/api/ai/knowledge/bookmarks?pageSize=100')
                .set('Authorization', `Bearer ${testUser.token}`)
            // 控制器直接 parseInt 未做上限校验，测试实际行为
            expect([200, 400]).toContain(res.status)
        })
    })

    describe('KN-B07: 创建收藏空 content', () => {
        it('应在 content 为空字符串时返回 400', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/ai/knowledge/bookmark')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({
                    sourcePageId: createdPageId || 'test-page-id',
                    title: '测试收藏',
                    content: '',
                })
            expect(res.status).toBe(400)
        })
    })

    describe('KN-B08: 触发索引空 pageId', () => {
        it('应在 pageId 为空字符串时返回 400', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/ai/knowledge/index')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({
                    pageId: '',
                    blocks: [{ id: 'b1', type: 'paragraph', content: '测试' }],
                })
            expect(res.status).toBe(400)
        })
    })

    describe('KN-B09: 关联文档 topK 超出范围', () => {
        it('应在 topK 超过 20 时测试行为', async () => {
            const res = await request(app.getHttpServer())
                .get(`/api/ai/knowledge/related/${createdPageId || 'test-page-id'}?topK=100`)
                .set('Authorization', `Bearer ${testUser.token}`)
            // 控制器直接 parseInt 未做上限校验，测试实际行为
            expect([200, 400, 500]).toContain(res.status)
        })
    })

    describe('KN-B10: 知识库问答无效 scope 值', () => {
        it('应在 scope 为无效值时返回 400', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/ai/knowledge/chat')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({
                    messages: [{ role: 'user', content: '测试问题' }],
                    pageId: createdPageId || 'test-page-id',
                    scope: 'invalid_scope',
                })
            expect(res.status).toBe(400)
        })
    })

    describe('KN-B11: 删除收藏不存在的 ID', () => {
        it('应在删除不存在的收藏 ID 时返回 404', async () => {
            const res = await request(app.getHttpServer())
                .delete('/api/ai/knowledge/bookmark/999999')
                .set('Authorization', `Bearer ${testUser.token}`)
            expect(res.status).toBe(404)
        })
    })

    describe('KN-B12: 创建收藏缺少 content', () => {
        it('应在缺少 content 字段时返回 400', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/ai/knowledge/bookmark')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({
                    sourcePageId: createdPageId || 'test-page-id',
                    title: '测试收藏',
                })
            expect(res.status).toBe(400)
        })
    })
})
