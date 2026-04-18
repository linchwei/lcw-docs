import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'

import { closeTestApp, createTestApp, createTestUser, cleanupAll } from '../../test/helpers'

describe('Security - Input Validation & Injection', () => {
    let app: INestApplication
    let testUser: { user: any; token: string }

    beforeAll(async () => {
        app = await createTestApp()
        testUser = await createTestUser(app, 'testsecinjuser', 'testpass123')
    })

    afterAll(async () => {
        await cleanupAll(app)
        await closeTestApp()
    })

    describe('SEC-011: SQL Injection - Login', () => {
        it('should not allow SQL injection in login', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({ username: "' OR 1=1--", password: "' OR 1=1--" })
            expect(res.status).toBe(400)
            expect(res.body).not.toHaveProperty('sql')
        })
    })

    describe('SEC-012: SQL Injection - Search', () => {
        it('should not allow SQL injection in search', async () => {
            const res = await request(app.getHttpServer())
                .get("/api/page/search?q='; DROP TABLE pages;--")
                .set('Authorization', `Bearer ${testUser.token}`)
            expect(res.status).toBe(200)
            expect(res.body).not.toHaveProperty('sql')
        })
    })

    describe('SEC-013: XSS - Page title', () => {
        it('should accept but handle XSS in page title', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/page')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ emoji: '📄', title: '<script>alert(1)</script>' })
            expect([200, 201]).toContain(res.status)
        })
    })

    describe('SEC-015: NoSQL Injection', () => {
        it('should reject NoSQL injection in register', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/user/register')
                .send({ username: '{"$gt": ""}', password: 'testpass123' })
            expect(res.status).toBe(400)
        })
    })

    describe('SEC-016: Extra long strings', () => {
        it('should reject extra long username', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/user/register')
                .send({ username: 'a'.repeat(100), password: 'testpass123' })
            expect(res.status).toBe(400)
        })

        it('should reject extra long password', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/user/register')
                .send({ username: 'testlonguser', password: 'a'.repeat(100) })
            expect(res.status).toBe(400)
        })
    })

    describe('SEC-017: Empty request body', () => {
        it('should reject empty body for page creation', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/page')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({})
            expect(res.status).toBe(400)
        })

        it('should reject empty body for user registration', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/user/register')
                .send({})
            expect(res.status).toBe(400)
        })
    })

    describe('SEC-018: Extra field injection', () => {
        it('should ignore extra fields in registration', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/user/register')
                .send({ username: 'testexfielduser', password: 'testpass123', isAdmin: true })
            expect(res.status).toBe(201)
            expect(res.body.data).not.toHaveProperty('isAdmin')
        })
    })

    describe('SEC-019: Path traversal', () => {
        it('should handle path traversal in page ID', async () => {
            const res = await request(app.getHttpServer())
                .get('/api/page/../../etc/passwd')
                .set('Authorization', `Bearer ${testUser.token}`)
            expect([400, 404]).toContain(res.status)
        })
    })

    describe('SEC-029: Share password protection', () => {
        it('should deny access to password-protected share without password', async () => {
            const pageRes = await request(app.getHttpServer())
                .post('/api/page')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ emoji: '📄', title: 'Protected Share Page' })
            const pageId = pageRes.body.data.pageId

            const shareRes = await request(app.getHttpServer())
                .post('/api/share')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ pageId, permission: 'view', password: 'secret123' })
            const shareId = shareRes.body.data.shareId

            const res = await request(app.getHttpServer())
                .get(`/api/share/${shareId}/info`)
            expect(res.status).toBe(403)
        })
    })
})
