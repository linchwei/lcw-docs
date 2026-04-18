import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import * as path from 'path'
import * as fs from 'fs'

import { closeTestApp, createTestApp, createTestUser, cleanupAll } from '../../test/helpers'

describe('API Boundary - Upload', () => {
    let app: INestApplication
    let testUser: { user: any; token: string }

    beforeAll(async () => {
        app = await createTestApp()
        testUser = await createTestUser(app, 'testboundaryupload', 'testpass123')
    })

    afterAll(async () => {
        await cleanupAll(app)
        await closeTestApp(app)
    })

    describe('API-UPLOAD-001: 上传非图片文件', () => {
        it('should handle non-image file upload', async () => {
            const testFilePath = path.join(__dirname, 'test-files', 'test.exe')
            const testDir = path.join(__dirname, 'test-files')
            if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true })
            fs.writeFileSync(testFilePath, 'fake exe content')

            const res = await request(app.getHttpServer())
                .post('/api/upload')
                .set('Authorization', `Bearer ${testUser.token}`)
                .attach('file', testFilePath)
            expect([200, 201, 400, 415]).toContain(res.status)

            fs.unlinkSync(testFilePath)
        })
    })

    describe('API-UPLOAD-002: 上传空文件', () => {
        it('should handle empty file upload', async () => {
            const testFilePath = path.join(__dirname, 'test-files', 'empty.txt')
            const testDir = path.join(__dirname, 'test-files')
            if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true })
            fs.writeFileSync(testFilePath, '')

            const res = await request(app.getHttpServer())
                .post('/api/upload')
                .set('Authorization', `Bearer ${testUser.token}`)
                .attach('file', testFilePath)
            expect([200, 201, 400]).toContain(res.status)

            fs.unlinkSync(testFilePath)
        })
    })

    describe('API-UPLOAD-003: 上传文件名含特殊字符', () => {
        it('should handle filename with special characters', async () => {
            const testFilePath = path.join(__dirname, 'test-files', '测试<file>.txt')
            const testDir = path.join(__dirname, 'test-files')
            if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true })
            fs.writeFileSync(testFilePath, 'special chars test')

            const res = await request(app.getHttpServer())
                .post('/api/upload')
                .set('Authorization', `Bearer ${testUser.token}`)
                .attach('file', testFilePath)
            expect([200, 201, 400]).toContain(res.status)

            fs.unlinkSync(testFilePath)
        })
    })
})
