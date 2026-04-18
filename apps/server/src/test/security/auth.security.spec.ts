import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'

import {
    closeTestApp,
    createTestApp,
    createTestUser,
    cleanupAll,
    generateExpiredToken,
    generateInvalidToken,
} from '../../test/helpers'

describe('Security - Authentication & Authorization', () => {
    let app: INestApplication
    let testUser: { user: any; token: string }

    beforeAll(async () => {
        app = await createTestApp()
        testUser = await createTestUser(app, 'testsecauthuser', 'testpass123')
    })

    afterAll(async () => {
        await cleanupAll(app)
        await closeTestApp()
    })

    describe('SEC-001: No token access to protected endpoints', () => {
        it('should return 401 for GET /api/page without token', async () => {
            const res = await request(app.getHttpServer()).get('/api/page')
            expect(res.status).toBe(401)
        })

        it('should return 401 for POST /api/page without token', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/page')
                .send({ emoji: '📄', title: 'Test' })
            expect(res.status).toBe(401)
        })

        it('should return 401 for GET /api/tags without token', async () => {
            const res = await request(app.getHttpServer()).get('/api/tags')
            expect(res.status).toBe(401)
        })

        it('should return 401 for GET /api/notification without token', async () => {
            const res = await request(app.getHttpServer()).get('/api/notification')
            expect(res.status).toBe(401)
        })
    })

    describe('SEC-002: Expired token', () => {
        it('should return 401 with expired token', async () => {
            const expiredToken = generateExpiredToken(app)
            const res = await request(app.getHttpServer())
                .get('/api/page')
                .set('Authorization', `Bearer ${expiredToken}`)
            expect(res.status).toBe(401)
        })
    })

    describe('SEC-003: Invalid token format', () => {
        it('should return 401 with invalid token', async () => {
            const invalidToken = generateInvalidToken()
            const res = await request(app.getHttpServer())
                .get('/api/page')
                .set('Authorization', `Bearer ${invalidToken}`)
            expect(res.status).toBe(401)
        })
    })

    describe('SEC-004: Tampered token signature', () => {
        it('should return 401 with tampered token', async () => {
            const parts = testUser.token.split('.')
            if (parts.length === 3) {
                parts[1] = Buffer.from(JSON.stringify({ username: 'hacker', sub: 99999 })).toString('base64url')
                const tamperedToken = parts.join('.')
                const res = await request(app.getHttpServer())
                    .get('/api/page')
                    .set('Authorization', `Bearer ${tamperedToken}`)
                expect(res.status).toBe(401)
            }
        })
    })

    describe('SEC-005~007: Access control - other user resources', () => {
        let otherUser: { user: any; token: string }
        let otherUserPageId: string

        beforeAll(async () => {
            otherUser = await createTestUser(app, 'testsecotheruser', 'testpass123')
            const pageRes = await request(app.getHttpServer())
                .post('/api/page')
                .set('Authorization', `Bearer ${otherUser.token}`)
                .send({ emoji: '🔒', title: 'Private Page' })
            otherUserPageId = pageRes.body.data.pageId
        })

        it('SEC-005: should deny access to other user page', async () => {
            const res = await request(app.getHttpServer())
                .get(`/api/page/${otherUserPageId}`)
                .set('Authorization', `Bearer ${testUser.token}`)
            expect([403, 404]).toContain(res.status)
        })

        it('SEC-006: should deny updating other user page', async () => {
            const res = await request(app.getHttpServer())
                .put('/api/page')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ pageId: otherUserPageId, title: 'Hacked' })
            expect(res.status).toBe(404)
        })

        it('SEC-007: should deny deleting other user page', async () => {
            const res = await request(app.getHttpServer())
                .delete('/api/page')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ pageId: otherUserPageId })
            expect(res.status).toBe(404)
        })
    })

    describe('SEC-008: Collaborator management access control', () => {
        it('should deny adding collaborator to other user page', async () => {
            const otherUser = await createTestUser(app, 'testseccollabuser', 'testpass123')
            const pageRes = await request(app.getHttpServer())
                .post('/api/page')
                .set('Authorization', `Bearer ${otherUser.token}`)
                .send({ emoji: '🔒', title: 'Protected Page' })
            const pageId = pageRes.body.data.pageId

            const res = await request(app.getHttpServer())
                .post(`/api/page/${pageId}/collaborator`)
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ username: 'testsecauthuser', role: 'editor' })
            expect([403, 404]).toContain(res.status)
        })
    })

    describe('SEC-026: Sensitive info not leaked', () => {
        it('should not include password in currentUser response', async () => {
            const res = await request(app.getHttpServer())
                .get('/api/currentUser')
                .set('Authorization', `Bearer ${testUser.token}`)
            expect(res.status).toBe(200)
            expect(res.body.data).not.toHaveProperty('password')
        })

        it('should not include password in me response', async () => {
            const res = await request(app.getHttpServer())
                .get('/api/me')
                .set('Authorization', `Bearer ${testUser.token}`)
            expect(res.status).toBe(200)
            expect(res.body).not.toHaveProperty('password')
        })
    })
})
