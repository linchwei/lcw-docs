import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'

import { createTestApp, closeTestApp } from '../../test/helpers'

describe('HealthController', () => {
    let app: INestApplication

    beforeAll(async () => {
        app = await createTestApp()
    })

    afterAll(async () => {
        await closeTestApp()
    })

    describe('GET /api/health', () => {
        it('HC-001: should return health check status', async () => {
            const res = await request(app.getHttpServer()).get('/api/health')
            expect(res.status).toBe(200)
            expect(res.body).toHaveProperty('status')
            expect(res.body).toHaveProperty('info')
        })
    })

    describe('GET /api/health/ready', () => {
        it('HC-002: should return readiness check status', async () => {
            const res = await request(app.getHttpServer()).get('/api/health/ready')
            expect(res.status).toBe(200)
            expect(res.body).toHaveProperty('status')
        })
    })

    describe('GET /api/health/live', () => {
        it('HC-003: should return liveness check status', async () => {
            const res = await request(app.getHttpServer()).get('/api/health/live')
            expect(res.status).toBe(200)
            expect(res.body).toHaveProperty('status')
        })
    })
})
