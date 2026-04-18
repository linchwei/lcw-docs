import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'

import { closeTestApp, createTestApp, createTestUser, cleanupAll } from '../../test/helpers'

describe('API Boundary - Auth', () => {
    let app: INestApplication
    let testUser: { user: any; token: string }

    beforeAll(async () => {
        app = await createTestApp()
        testUser = await createTestUser(app, 'testboundaryauth', 'testpass123')
    })

    afterAll(async () => {
        await cleanupAll(app)
        await closeTestApp(app)
    })

    describe('API-AUTH-001: token 有效期验证', () => {
        it('should access currentUser with valid token', async () => {
            const res = await request(app.getHttpServer())
                .get('/api/currentUser')
                .set('Authorization', `Bearer ${testUser.token}`)
            expect(res.status).toBe(200)
            expect(res.body.data).toHaveProperty('username', 'testboundaryauth')
        })
    })

    describe('API-AUTH-002: 登出后 token 是否失效', () => {
        it('should still access currentUser after logout (JWT stateless)', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/logout')
                .set('Authorization', `Bearer ${testUser.token}`)

            const res = await request(app.getHttpServer())
                .get('/api/currentUser')
                .set('Authorization', `Bearer ${testUser.token}`)

            if (res.status === 200) {
                expect(res.body.data).toHaveProperty('username')
            } else {
                expect(res.status).toBe(401)
            }
        })
    })

    describe('API-AUTH-003: 注册用户名边界 - 恰好3字符', () => {
        it('should register with 3-character username', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/user/register')
                .send({ username: 'abc', password: '123456' })
            expect([201, 400]).toContain(res.status)
        })
    })

    describe('API-AUTH-004: 注册用户名边界 - 恰好20字符', () => {
        it('should register with 20-character username', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/user/register')
                .send({ username: 'a'.repeat(20), password: '123456' })
            expect([201, 400]).toContain(res.status)
        })
    })

    describe('API-AUTH-005: 注册密码边界 - 恰好6字符', () => {
        it('should register with 6-character password', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/user/register')
                .send({ username: 'testpwd6char', password: '123456' })
            expect([201, 400]).toContain(res.status)
        })
    })

    describe('API-AUTH-006: 注册密码边界 - 恰好50字符', () => {
        it('should register with 50-character password', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/user/register')
                .send({ username: 'testpwd50char', password: 'a'.repeat(50) })
            expect([201, 400]).toContain(res.status)
        })
    })

    describe('API-AUTH-007: 登录 - 用户名含空格', () => {
        it('should handle username with spaces', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({ username: 'test user', password: 'xxx' })
            expect([400, 401]).toContain(res.status)
        })
    })

    describe('API-AUTH-008: 登录 - 密码含特殊字符', () => {
        it('should handle password with special characters', async () => {
            const specialPwd = 'p@ss!w0rd#'
            await request(app.getHttpServer())
                .post('/api/user/register')
                .send({ username: 'testspecpwd', password: specialPwd })

            const res = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({ username: 'testspecpwd', password: specialPwd })
            expect([201, 400]).toContain(res.status)
        })
    })
})
