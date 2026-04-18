import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import * as path from 'path'
import * as fs from 'fs'

import { closeTestApp, createTestApp, createTestUser, cleanupAll } from '../../test/helpers'

describe('UploadController', () => {
    let app: INestApplication
    let testUser: { user: any; token: string }

    beforeAll(async () => {
        app = await createTestApp()
        testUser = await createTestUser(app, 'testuploaduser', 'testpass123')
    })

    afterAll(async () => {
        await cleanupAll(app)
        await closeTestApp()
    })

    it('UP-001: should upload a file', async () => {
        const testFilePath = path.join(__dirname, 'test-upload.txt')
        fs.writeFileSync(testFilePath, 'test content')

        const res = await request(app.getHttpServer())
            .post('/api/upload')
            .set('Authorization', `Bearer ${testUser.token}`)
            .attach('file', testFilePath)
        expect(res.status).toBe(201)
        expect(res.body).toHaveProperty('data')
        expect(res.body.success).toBe(true)

        fs.unlinkSync(testFilePath)
    })

    it('UP-002: should return 401 without auth', async () => {
        const res = await request(app.getHttpServer())
            .post('/api/upload')
        expect(res.status).toBe(401)
    })

    it('UP-003: should fail without file', async () => {
        const res = await request(app.getHttpServer())
            .post('/api/upload')
            .set('Authorization', `Bearer ${testUser.token}`)
        expect(res.status).toBe(400)
    })
})
