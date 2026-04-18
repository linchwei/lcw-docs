import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'

import { closeTestApp, createTestApp, createTestUser, cleanupUsers } from '../../test/helpers'

describe('AuthController', () => {
    let app: INestApplication
    let testUser: { user: any; token: string }

    beforeAll(async () => {
        app = await createTestApp()
        testUser = await createTestUser(app, 'testauthuser', 'testpass123')
    })

    afterAll(async () => {
        await cleanupUsers(app)
        await closeTestApp()
    })

    describe('POST /api/auth/login', () => {
        it('AU-001: should login with correct credentials', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({ username: 'testauthuser', password: 'testpass123' })
            expect(res.status).toBe(201)
            expect(res.body).toHaveProperty('data')
            expect(res.body.data).toHaveProperty('access_token')
            expect(res.body.success).toBe(true)
        })

        it('AU-002: should fail with wrong password', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({ username: 'testauthuser', password: 'wrongpassword' })
            expect(res.status).toBe(400)
        })

        it('AU-003: should fail with non-existent user', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({ username: 'nonexistentuser', password: 'somepassword' })
            expect(res.status).toBe(400)
        })

        it('AU-004: should fail with missing fields', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({})
            expect(res.status).toBe(400)
        })
    })

    describe('POST /api/auth/logout', () => {
        it('AU-005: should logout when authenticated', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/auth/logout')
                .set('Authorization', `Bearer ${testUser.token}`)
            expect(res.status).toBe(201)
            expect(res.body.success).toBe(true)
        })

        it('AU-006: should return 401 when not authenticated', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/auth/logout')
            expect(res.status).toBe(401)
        })
    })

    describe('GET /api/currentUser', () => {
        it('AU-007: should return current user when authenticated', async () => {
            const res = await request(app.getHttpServer())
                .get('/api/currentUser')
                .set('Authorization', `Bearer ${testUser.token}`)
            expect(res.status).toBe(200)
            expect(res.body).toHaveProperty('data')
            expect(res.body.data).toHaveProperty('username', 'testauthuser')
        })

        it('AU-008: should return 401 when not authenticated', async () => {
            const res = await request(app.getHttpServer())
                .get('/api/currentUser')
            expect(res.status).toBe(401)
        })
    })

    describe('GET /api/me', () => {
        it('AU-009: should return user profile when authenticated', async () => {
            const res = await request(app.getHttpServer())
                .get('/api/me')
                .set('Authorization', `Bearer ${testUser.token}`)
            expect(res.status).toBe(200)
            expect(res.body).toHaveProperty('username', 'testauthuser')
        })

        it('AU-010: should return 401 when not authenticated', async () => {
            const res = await request(app.getHttpServer())
                .get('/api/me')
            expect(res.status).toBe(401)
        })
    })
})
