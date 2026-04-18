import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'

import { closeTestApp, createTestApp, createTestUser, cleanupAll } from '../../test/helpers'

describe('NotificationController', () => {
    let app: INestApplication
    let testUser: { user: any; token: string }

    beforeAll(async () => {
        app = await createTestApp()
        testUser = await createTestUser(app, 'testnotifuser', 'testpass123')
    })

    afterAll(async () => {
        await cleanupAll(app)
        await closeTestApp()
    })

    it('NT-001: should return notification list', async () => {
        const res = await request(app.getHttpServer())
            .get('/api/notification')
            .set('Authorization', `Bearer ${testUser.token}`)
        expect(res.status).toBe(200)
        expect(res.body).toHaveProperty('data')
    })

    it('NT-002: should return unread count', async () => {
        const res = await request(app.getHttpServer())
            .get('/api/notification/unread-count')
            .set('Authorization', `Bearer ${testUser.token}`)
        expect(res.status).toBe(200)
        expect(res.body.data).toHaveProperty('count')
    })

    it('NT-004: should mark all as read', async () => {
        const res = await request(app.getHttpServer())
            .post('/api/notification/read-all')
            .set('Authorization', `Bearer ${testUser.token}`)
        expect(res.status).toBe(201)
        expect(res.body.success).toBe(true)
    })
})
