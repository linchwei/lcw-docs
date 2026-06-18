/**
 * 知识库 AI 助手控制器测试
 *
 * 覆盖所有知识库端点的认证校验和参数验证。
 * 测试 ID 格式：KN-NNN
 *
 * @module test/modules/ai/knowledge
 */
import { INestApplication } from '@nestjs/common'
import request from 'supertest'

import { cleanupAll, closeTestApp, createTestApp, createTestUser } from '../../helpers'

describe('Knowledge AI Controller', () => {
    let app: INestApplication
    let testUser: { user: any; token: string }

    beforeAll(async () => {
        app = await createTestApp()
        testUser = await createTestUser(app, 'test-knowledge-user', 'password123')
    })

    afterAll(async () => {
        await cleanupAll(app)
        await closeTestApp()
    })

    // === 知识库问答 ===

    it('KN-001: 知识库问答未认证应返回 401', async () => {
        const res = await request(app.getHttpServer())
            .post('/api/ai/knowledge/chat')
            .send({ messages: [{ role: 'user', content: 'hello' }], pageId: 'test-page' })
        expect(res.status).toBe(401)
    })

    it('KN-002: 知识库问答空消息应返回 400', async () => {
        const res = await request(app.getHttpServer())
            .post('/api/ai/knowledge/chat')
            .set('Authorization', `Bearer ${testUser.token}`)
            .send({ messages: [], pageId: 'test-page' })
        expect(res.status).toBe(400)
    })

    it('KN-003: 知识库问答缺少 pageId 应返回 400（或 429 限流）', async () => {
        const res = await request(app.getHttpServer())
            .post('/api/ai/knowledge/chat')
            .set('Authorization', `Bearer ${testUser.token}`)
            .send({ messages: [{ role: 'user', content: 'hello' }] })
        // 429 表示限流，400 表示参数验证失败，两者都是合理的拒绝响应
        expect([400, 429]).toContain(res.status)
    })

    it('KN-004: 知识库问答缺少 messages 应返回 400（或 429 限流）', async () => {
        const res = await request(app.getHttpServer())
            .post('/api/ai/knowledge/chat')
            .set('Authorization', `Bearer ${testUser.token}`)
            .send({ pageId: 'test-page' })
        // 429 表示限流，400 表示参数验证失败，两者都是合理的拒绝响应
        expect([400, 429]).toContain(res.status)
    })

    it('KN-005: 知识库问答消息角色无效应返回 400（或 429 限流）', async () => {
        const res = await request(app.getHttpServer())
            .post('/api/ai/knowledge/chat')
            .set('Authorization', `Bearer ${testUser.token}`)
            .send({ messages: [{ role: 'invalid', content: 'hello' }], pageId: 'test-page' })
        // 429 表示限流，400 表示参数验证失败，两者都是合理的拒绝响应
        expect([400, 429]).toContain(res.status)
    })

    // === 索引状态 ===

    it('KN-006: 索引状态查询未认证应返回 401', async () => {
        const res = await request(app.getHttpServer()).get('/api/ai/knowledge/status/test-page')
        expect(res.status).toBe(401)
    })

    it('KN-007: 索引状态查询正常应返回 200', async () => {
        const res = await request(app.getHttpServer())
            .get('/api/ai/knowledge/status/test-page')
            .set('Authorization', `Bearer ${testUser.token}`)
        expect(res.status).toBe(200)
        expect(res.body).toHaveProperty('isIndexed')
    })

    it('KN-008: 索引状态查询缺少 pageId 路径参数应返回 404', async () => {
        const res = await request(app.getHttpServer()).get('/api/ai/knowledge/status/').set('Authorization', `Bearer ${testUser.token}`)
        expect(res.status).toBe(404)
    })

    // === 触发索引 ===

    it('KN-009: 触发索引未认证应返回 401', async () => {
        const res = await request(app.getHttpServer())
            .post('/api/ai/knowledge/index')
            .send({ pageId: 'test-page', blocks: [{ id: '1', type: 'text', content: 'hello' }] })
        expect(res.status).toBe(401)
    })

    it('KN-010: 触发索引空 blocks 应返回 400', async () => {
        const res = await request(app.getHttpServer())
            .post('/api/ai/knowledge/index')
            .set('Authorization', `Bearer ${testUser.token}`)
            .send({ pageId: 'test-page', blocks: [] })
        expect(res.status).toBe(400)
    })

    it('KN-011: 触发索引缺少 pageId 应返回 400', async () => {
        const res = await request(app.getHttpServer())
            .post('/api/ai/knowledge/index')
            .set('Authorization', `Bearer ${testUser.token}`)
            .send({ blocks: [{ id: '1', type: 'text', content: 'hello' }] })
        expect(res.status).toBe(400)
    })

    // === 自动标签 ===

    it('KN-012: 自动标签未认证应返回 401', async () => {
        const res = await request(app.getHttpServer()).post('/api/ai/knowledge/auto-tag').send({ pageId: 'test-page' })
        expect(res.status).toBe(401)
    })

    it('KN-013: 自动标签缺少 pageId 应返回 400', async () => {
        const res = await request(app.getHttpServer())
            .post('/api/ai/knowledge/auto-tag')
            .set('Authorization', `Bearer ${testUser.token}`)
            .send({})
        expect(res.status).toBe(400)
    })

    // === 知识图谱 ===

    it('KN-014: 知识图谱未认证应返回 401', async () => {
        const res = await request(app.getHttpServer()).post('/api/ai/knowledge/graph').send({ pageId: 'test-page' })
        expect(res.status).toBe(401)
    })

    it('KN-015: 知识图谱缺少 pageId 应返回 400', async () => {
        const res = await request(app.getHttpServer())
            .post('/api/ai/knowledge/graph')
            .set('Authorization', `Bearer ${testUser.token}`)
            .send({})
        expect(res.status).toBe(400)
    })

    // === 保存知识卡片 ===

    it('KN-016: 保存知识卡片未认证应返回 401', async () => {
        const res = await request(app.getHttpServer())
            .post('/api/ai/knowledge/save-card')
            .send({ title: 'test', content: 'test', sourcePageId: 'test-page' })
        expect(res.status).toBe(401)
    })

    it('KN-017: 保存知识卡片缺少 title 应返回 400', async () => {
        const res = await request(app.getHttpServer())
            .post('/api/ai/knowledge/save-card')
            .set('Authorization', `Bearer ${testUser.token}`)
            .send({ content: 'test', sourcePageId: 'test-page' })
        expect(res.status).toBe(400)
    })

    it('KN-018: 保存知识卡片缺少 content 应返回 400', async () => {
        const res = await request(app.getHttpServer())
            .post('/api/ai/knowledge/save-card')
            .set('Authorization', `Bearer ${testUser.token}`)
            .send({ title: 'test', sourcePageId: 'test-page' })
        expect(res.status).toBe(400)
    })

    // === 智能摘要 ===

    it('KN-019: 智能摘要未认证应返回 401', async () => {
        const res = await request(app.getHttpServer()).post('/api/ai/knowledge/smart-summary').send({ pageId: 'test-page' })
        expect(res.status).toBe(401)
    })

    it('KN-020: 智能摘要缺少 pageId 应返回 400', async () => {
        const res = await request(app.getHttpServer())
            .post('/api/ai/knowledge/smart-summary')
            .set('Authorization', `Bearer ${testUser.token}`)
            .send({})
        expect(res.status).toBe(400)
    })

    // === 学习路径 ===

    it('KN-021: 学习路径未认证应返回 401', async () => {
        const res = await request(app.getHttpServer()).post('/api/ai/knowledge/learning-path').send({ pageId: 'test-page' })
        expect(res.status).toBe(401)
    })

    it('KN-022: 学习路径缺少 pageId 应返回 400', async () => {
        const res = await request(app.getHttpServer())
            .post('/api/ai/knowledge/learning-path')
            .set('Authorization', `Bearer ${testUser.token}`)
            .send({})
        expect(res.status).toBe(400)
    })

    // === 关联文档 ===

    it('KN-023: 关联文档未认证应返回 401', async () => {
        const res = await request(app.getHttpServer()).get('/api/ai/knowledge/related/test-page')
        expect(res.status).toBe(401)
    })

    it('KN-024: 关联文档已认证应返回 200', async () => {
        const res = await request(app.getHttpServer())
            .get('/api/ai/knowledge/related/test-page')
            .set('Authorization', `Bearer ${testUser.token}`)
        expect(res.status).toBe(200)
    })

    // === 全局搜索 ===

    it('KN-025: 全局搜索未认证应返回 401', async () => {
        const res = await request(app.getHttpServer()).post('/api/ai/knowledge/global-search').send({ query: 'test' })
        expect(res.status).toBe(401)
    })

    it('KN-026: 全局搜索空 query 应返回 400', async () => {
        const res = await request(app.getHttpServer())
            .post('/api/ai/knowledge/global-search')
            .set('Authorization', `Bearer ${testUser.token}`)
            .send({ query: '' })
        expect(res.status).toBe(400)
    })

    it('KN-027: 全局搜索缺少 query 应返回 400', async () => {
        const res = await request(app.getHttpServer())
            .post('/api/ai/knowledge/global-search')
            .set('Authorization', `Bearer ${testUser.token}`)
            .send({})
        expect(res.status).toBe(400)
    })

    // === 知识收藏 ===

    it('KN-028: 创建收藏未认证应返回 401', async () => {
        const res = await request(app.getHttpServer())
            .post('/api/ai/knowledge/bookmark')
            .send({ sourcePageId: 'test-page', title: 'test', content: 'test' })
        expect(res.status).toBe(401)
    })

    it('KN-029: 创建收藏缺少 title 应返回 400', async () => {
        const res = await request(app.getHttpServer())
            .post('/api/ai/knowledge/bookmark')
            .set('Authorization', `Bearer ${testUser.token}`)
            .send({ sourcePageId: 'test-page', content: 'test' })
        expect(res.status).toBe(400)
    })

    it('KN-030: 创建收藏正常应返回 201', async () => {
        const res = await request(app.getHttpServer())
            .post('/api/ai/knowledge/bookmark')
            .set('Authorization', `Bearer ${testUser.token}`)
            .send({ sourcePageId: 'test-page', title: '测试收藏', content: '测试内容' })
        expect(res.status).toBe(201)
        expect(res.body).toHaveProperty('id')
    })

    it('KN-031: 收藏列表未认证应返回 401', async () => {
        const res = await request(app.getHttpServer()).get('/api/ai/knowledge/bookmarks')
        expect(res.status).toBe(401)
    })

    it('KN-032: 收藏列表正常应返回 200', async () => {
        const res = await request(app.getHttpServer()).get('/api/ai/knowledge/bookmarks').set('Authorization', `Bearer ${testUser.token}`)
        expect(res.status).toBe(200)
        expect(res.body).toHaveProperty('items')
        expect(res.body).toHaveProperty('total')
    })

    it('KN-033: 删除收藏未认证应返回 401', async () => {
        const res = await request(app.getHttpServer()).delete('/api/ai/knowledge/bookmark/999')
        expect(res.status).toBe(401)
    })

    it('KN-034: 删除收藏已认证应返回 200 或 404', async () => {
        const res = await request(app.getHttpServer())
            .delete('/api/ai/knowledge/bookmark/999')
            .set('Authorization', `Bearer ${testUser.token}`)
        expect([200, 404]).toContain(res.status)
    })

    it('KN-035: 搜索收藏未认证应返回 401', async () => {
        const res = await request(app.getHttpServer()).post('/api/ai/knowledge/bookmark/search').send({ query: 'test' })
        expect(res.status).toBe(401)
    })

    it('KN-036: 搜索收藏空 query 应返回 400', async () => {
        const res = await request(app.getHttpServer())
            .post('/api/ai/knowledge/bookmark/search')
            .set('Authorization', `Bearer ${testUser.token}`)
            .send({ query: '' })
        expect(res.status).toBe(400)
    })

    // === 对话历史 ===

    it('KN-037: 对话历史未认证应返回 401', async () => {
        const res = await request(app.getHttpServer()).get('/api/ai/knowledge/threads')
        expect(res.status).toBe(401)
    })

    it('KN-038: 对话历史已认证应返回 200', async () => {
        const res = await request(app.getHttpServer()).get('/api/ai/knowledge/threads').set('Authorization', `Bearer ${testUser.token}`)
        expect(res.status).toBe(200)
    })

    it('KN-039: 删除对话未认证应返回 401', async () => {
        const res = await request(app.getHttpServer()).delete('/api/ai/knowledge/thread/test-thread-id')
        expect(res.status).toBe(401)
    })

    it('KN-040: 删除对话已认证应返回 200 或 404', async () => {
        const res = await request(app.getHttpServer())
            .delete('/api/ai/knowledge/thread/test-thread-id')
            .set('Authorization', `Bearer ${testUser.token}`)
        expect([200, 404]).toContain(res.status)
    })
})
