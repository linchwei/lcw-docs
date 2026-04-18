import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'

import { closeTestApp, createTestApp, createTestUser, cleanupAll } from '../../test/helpers'

describe('ApplicationController', () => {
    let app: INestApplication
    let testUser: { user: any; token: string }
    let createdAppId: string

    beforeAll(async () => {
        app = await createTestApp()
        testUser = await createTestUser(app, 'testappuser', 'testpass123')
    })

    afterAll(async () => {
        await cleanupAll(app)
        await closeTestApp()
    })

    it('AP-001: should create an application', async () => {
        const res = await request(app.getHttpServer())
            .post('/api/application')
            .set('Authorization', `Bearer ${testUser.token}`)
            .send({ type: 'react', name: 'Test App' })
        expect(res.status).toBe(201)
        expect(res.body).toHaveProperty('data')
        expect(res.body.success).toBe(true)
        createdAppId = res.body.data.appId
    })

    it('AP-003: should return application list', async () => {
        const res = await request(app.getHttpServer())
            .get('/api/application')
            .set('Authorization', `Bearer ${testUser.token}`)
        expect(res.status).toBe(200)
        expect(res.body).toHaveProperty('data')
    })

    it('AP-002: should update an application', async () => {
        if (!createdAppId) return
        const res = await request(app.getHttpServer())
            .put('/api/application')
            .set('Authorization', `Bearer ${testUser.token}`)
            .send({ appId: createdAppId, name: 'Updated App' })
        expect(res.status).toBe(200)
        expect(res.body.success).toBe(true)
    })

    it('AP-004: should delete an application', async () => {
        if (!createdAppId) return
        const res = await request(app.getHttpServer())
            .delete('/api/application')
            .set('Authorization', `Bearer ${testUser.token}`)
            .send({ appId: createdAppId })
        expect(res.status).toBe(200)
        expect(res.body.success).toBe(true)
    })
})
