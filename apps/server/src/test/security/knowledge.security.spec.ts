import { INestApplication } from '@nestjs/common'
import request from 'supertest'

import { cleanupAll, closeTestApp, createTestApp, createTestUser } from '../helpers'

describe('Security - Knowledge Injection & Access Control', () => {
    let app: INestApplication
    let testUser: { user: any; token: string }
    let otherUser: { user: any; token: string }
    let createdPageId: string

    beforeAll(async () => {
        app = await createTestApp()
        testUser = await createTestUser(app, 'testsecknuser1', 'testpass123')
        otherUser = await createTestUser(app, 'testsecknuser2', 'testpass123')

        // 创建测试页面
        const pageRes = await request(app.getHttpServer())
            .post('/api/page')
            .set('Authorization', `Bearer ${testUser.token}`)
            .send({ emoji: '📄', title: 'Knowledge Security Test' })
        if (pageRes.status === 201 && pageRes.body.data) {
            createdPageId = pageRes.body.data.pageId
        }
    })

    afterAll(async () => {
        await cleanupAll(app)
        await closeTestApp()
    })

    describe('KN-S01: 知识库问答 SQL 注入', () => {
        it('应在 pageId 含 SQL 注入时正常处理，不泄露数据库信息', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/ai/knowledge/chat')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({
                    messages: [{ role: 'user', content: '测试问题' }],
                    pageId: "' OR 1=1--",
                })
            // 应返回 200/201（SSE 流式端点 POST 默认 201）或 400（验证失败）或 500，不应泄露 SQL 错误
            expect([200, 201, 400, 500]).toContain(res.status)
            expect(res.body).not.toHaveProperty('sql')
            expect(JSON.stringify(res.body)).not.toContain('SELECT')
            expect(JSON.stringify(res.body)).not.toContain('DROP')
        })
    })

    describe('KN-S02: 全局搜索 SQL 注入', () => {
        it('应在 query 含 SQL 注入时正常处理，不泄露数据库信息', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/ai/knowledge/global-search')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({
                    query: "'; DROP TABLE knowledge_bookmark;--",
                })
            // POST 端点默认返回 201
            expect([200, 201, 400, 500]).toContain(res.status)
            expect(res.body).not.toHaveProperty('sql')
            expect(JSON.stringify(res.body)).not.toContain('SELECT')
        })
    })

    describe('KN-S03: 保存知识卡片 XSS', () => {
        it('应接受含 XSS 的 content 但存储时转义或安全处理', async () => {
            const xssPayload = "<script>alert('xss')</script>"
            const res = await request(app.getHttpServer())
                .post('/api/ai/knowledge/save-card')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({
                    title: 'XSS 测试卡片',
                    content: xssPayload,
                    sourcePageId: createdPageId || 'test-page-id',
                })
            // 应接受请求（200/201），内容被存储但应被转义
            expect([200, 201]).toContain(res.status)
            if (res.body.data) {
                // 内容应被存储，但不以原始可执行形式返回
                expect(res.body.data).toBeDefined()
                // 验证 <script> 标签被转义或移除
                const dataStr = JSON.stringify(res.body.data)
                expect(dataStr).not.toContain('<script>')
                expect(dataStr).not.toContain('alert(')
            }
        })
    })

    describe('KN-S04: 收藏越权删除', () => {
        it('应阻止删除其他用户的收藏，返回 404 或无效果', async () => {
            // 用户 A 创建收藏
            const createRes = await request(app.getHttpServer())
                .post('/api/ai/knowledge/bookmark')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({
                    sourcePageId: createdPageId || 'test-page-id',
                    title: '用户A的收藏',
                    content: '这是用户A的收藏内容',
                })
            expect([200, 201]).toContain(createRes.status)
            const bookmarkId = createRes.body.data?.id || createRes.body.data?.bookmarkId

            if (bookmarkId) {
                // 用户 B 尝试删除用户 A 的收藏
                const deleteRes = await request(app.getHttpServer())
                    .delete(`/api/ai/knowledge/bookmark/${bookmarkId}`)
                    .set('Authorization', `Bearer ${otherUser.token}`)
                // 应返回 404（找不到属于该用户的收藏）或无效果
                expect([404, 200]).toContain(deleteRes.status)

                // 验证用户 A 的收藏仍然存在
                const listRes = await request(app.getHttpServer())
                    .get('/api/ai/knowledge/bookmarks')
                    .set('Authorization', `Bearer ${testUser.token}`)
                expect(listRes.status).toBe(200)
                const items = listRes.body.data?.items || listRes.body.items || []
                const stillExists = items.some((b: any) => (b.id || b.bookmarkId) === bookmarkId)
                expect(stillExists).toBe(true)
            }
        })
    })

    describe('KN-S05: 收藏越权访问', () => {
        it('应确保收藏列表只返回当前用户自己的数据', async () => {
            // 用户 A 创建收藏
            await request(app.getHttpServer())
                .post('/api/ai/knowledge/bookmark')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({
                    sourcePageId: createdPageId || 'test-page-id',
                    title: '用户A专属收藏',
                    content: '仅用户A可见',
                })

            // 用户 B 查看收藏列表
            const listRes = await request(app.getHttpServer())
                .get('/api/ai/knowledge/bookmarks')
                .set('Authorization', `Bearer ${otherUser.token}`)
            expect(listRes.status).toBe(200)

            const items = listRes.body.data?.items || listRes.body.items || []
            // 用户 B 的列表不应包含用户 A 的收藏
            const hasOtherUser = items.some((b: any) => b.title === '用户A专属收藏')
            expect(hasOtherUser).toBe(false)
        })
    })

    describe('KN-S06: 知识库问答路径遍历', () => {
        it('应在 pageId 含路径遍历时返回 400 或正常处理', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/ai/knowledge/chat')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({
                    messages: [{ role: 'user', content: '测试问题' }],
                    pageId: '../../../etc/passwd',
                })
            // 应返回 200/201（SSE 流式端点 POST 默认 201）或 400（验证失败）或正常处理，不应泄露文件内容
            expect([200, 201, 400, 500]).toContain(res.status)
            if (res.body) {
                const bodyStr = JSON.stringify(res.body)
                expect(bodyStr).not.toContain('root:')
                expect(bodyStr).not.toContain('/bin/bash')
            }
        })
    })

    describe('KN-S07: 对话历史越权', () => {
        it('应确保对话线程列表只返回当前用户自己的数据', async () => {
            // 用户 A 查看对话线程
            const listResA = await request(app.getHttpServer())
                .get('/api/ai/knowledge/threads')
                .set('Authorization', `Bearer ${testUser.token}`)
            expect(listResA.status).toBe(200)

            // 用户 B 查看对话线程
            const listResB = await request(app.getHttpServer())
                .get('/api/ai/knowledge/threads')
                .set('Authorization', `Bearer ${otherUser.token}`)
            expect(listResB.status).toBe(200)

            // 两个用户的线程列表应相互独立
            const threadsA = listResA.body.data?.items || listResA.body.items || []
            const threadsB = listResB.body.data?.items || listResB.body.items || []
            // 用户 B 不应看到用户 A 的线程
            if (threadsA.length > 0 && threadsB.length > 0) {
                const aIds = threadsA.map((t: any) => t.threadId || t.id)
                const bIds = threadsB.map((t: any) => t.threadId || t.id)
                const overlap = aIds.filter((id: string) => bIds.includes(id))
                expect(overlap.length).toBe(0)
            }
        })
    })

    describe('KN-S08: 索引状态查询路径遍历', () => {
        it('应在 pageId 含路径遍历时返回 400 或正常处理', async () => {
            const res = await request(app.getHttpServer())
                .get('/api/ai/knowledge/status/..%2F..%2Fetc%2Fpasswd')
                .set('Authorization', `Bearer ${testUser.token}`)
            // 应返回 400 或 404，不应泄露文件内容
            expect([200, 400, 404]).toContain(res.status)
            if (res.body) {
                const bodyStr = JSON.stringify(res.body)
                expect(bodyStr).not.toContain('root:')
                expect(bodyStr).not.toContain('/bin/bash')
            }
        })
    })
})
