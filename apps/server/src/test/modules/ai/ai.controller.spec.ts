import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'

import { closeTestApp, createTestApp, createTestUser, cleanupAll } from '../../test/helpers'

describe('AiController', () => {
    let app: INestApplication
    let testUser: { user: any; token: string }

    beforeAll(async () => {
        app = await createTestApp()
        testUser = await createTestUser(app, 'testaiuser', 'testpass123')
    })

    afterAll(async () => {
        await cleanupAll(app)
        await closeTestApp()
    })

    it('AI-002: should return 401 without auth', async () => {
        const res = await request(app.getHttpServer())
            .post('/api/ai/chat')
            .send({ messages: [{ role: 'user', content: 'hello' }] })
        expect(res.status).toBe(401)
    })

    it('AI-003: should fail with empty messages', async () => {
        const res = await request(app.getHttpServer())
            .post('/api/ai/chat')
            .set('Authorization', `Bearer ${testUser.token}`)
            .send({ messages: [] })
        expect(res.status).toBe(400)
    })
})
