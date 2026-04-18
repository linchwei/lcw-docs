import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'

import { closeTestApp, createTestApp, cleanupUsers } from '../../test/helpers'

describe('UserController', () => {
    let app: INestApplication

    beforeAll(async () => {
        app = await createTestApp()
    })

    afterAll(async () => {
        await cleanupUsers(app)
        await closeTestApp()
    })

    afterEach(async () => {
        await cleanupUsers(app)
    })

    describe('POST /api/user/register', () => {
        it('US-001: should register a new user', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/user/register')
                .send({ username: 'testreguser', password: 'testpass123' })
            expect(res.status).toBe(201)
            expect(res.body).toHaveProperty('data')
            expect(res.body.data).toHaveProperty('username', 'testreguser')
            expect(res.body.data).not.toHaveProperty('password')
            expect(res.body.success).toBe(true)
        })

        it('US-002: should fail with username too short', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/user/register')
                .send({ username: 'ab', password: 'testpass123' })
            expect(res.status).toBe(400)
        })

        it('US-003: should fail with username too long', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/user/register')
                .send({ username: 'a'.repeat(21), password: 'testpass123' })
            expect(res.status).toBe(400)
        })

        it('US-004: should fail with password too short', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/user/register')
                .send({ username: 'testreguser', password: '12345' })
            expect(res.status).toBe(400)
        })

        it('US-005: should fail with duplicate username', async () => {
            await request(app.getHttpServer())
                .post('/api/user/register')
                .send({ username: 'testdupuser', password: 'testpass123' })

            const res = await request(app.getHttpServer())
                .post('/api/user/register')
                .send({ username: 'testdupuser', password: 'testpass123' })
            expect(res.status).toBe(400)
        })

        it('US-006: should fail with missing required fields', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/user/register')
                .send({})
            expect(res.status).toBe(400)
        })
    })
})
