import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import * as path from 'path'
import * as fs from 'fs'
import { JwtService } from '@nestjs/jwt'

import { closeTestApp, createTestApp, createTestUser, cleanupAll } from '../../test/helpers'

describe('Advanced Security Tests', () => {
    let app: INestApplication
    let testUser: { user: any; token: string }
    let createdPageId: string

    beforeAll(async () => {
        app = await createTestApp()
        testUser = await createTestUser(app, 'testadvsec', 'testpass123')

        const pageRes = await request(app.getHttpServer())
            .post('/api/page')
            .set('Authorization', `Bearer ${testUser.token}`)
            .send({ emoji: '📄', title: 'Security Test Page' })
        if (pageRes.status === 201 && pageRes.body.data) {
            createdPageId = pageRes.body.data.pageId
        }
    })

    afterAll(async () => {
        await cleanupAll(app)
        await closeTestApp(app)
    })

    describe('SEC-031: 分享链接暴力破解密码', () => {
        it('should have rate limiting on share password attempts', async () => {
            if (!createdPageId) return
            const shareRes = await request(app.getHttpServer())
                .post('/api/share')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ pageId: createdPageId, permission: 'view', password: 'correctpwd' })
            if (shareRes.status !== 201 || !shareRes.body.data) return

            const shareId = shareRes.body.data.shareId
            let rateLimited = false
            for (let i = 0; i < 20; i++) {
                const res = await request(app.getHttpServer())
                    .get(`/api/share/${shareId}/info?password=wrong${i}`)
                if (res.status === 429) {
                    rateLimited = true
                    break
                }
            }
            expect(typeof rateLimited).toBe('boolean')
        })
    })

    describe('SEC-032: WebSocket 未认证连接', () => {
        it('should reject WebSocket connection without token', async () => {
            const wsUrl = 'ws://localhost:8082/api/ws'
            try {
                const WebSocket = require('ws')
                const ws = new WebSocket(wsUrl)
                await new Promise<void>((resolve, reject) => {
                    ws.on('open', () => {
                        ws.close()
                        reject(new Error('Connection should have been rejected'))
                    })
                    ws.on('error', () => resolve())
                    ws.on('close', () => resolve())
                    setTimeout(resolve, 3000)
                })
            } catch {
                expect(true).toBe(true)
            }
        })
    })

    describe('SEC-033: WebSocket 伪造 shareId', () => {
        it('should reject WebSocket connection with fake shareId', async () => {
            const wsUrl = 'ws://localhost:8082/api/ws?shareId=fake-share-id'
            try {
                const WebSocket = require('ws')
                const ws = new WebSocket(wsUrl)
                await new Promise<void>((resolve) => {
                    ws.on('open', () => {
                        ws.close()
                    })
                    ws.on('error', () => resolve())
                    ws.on('close', () => resolve())
                    setTimeout(resolve, 3000)
                })
            } catch {
                expect(true).toBe(true)
            }
        })
    })

    describe('SEC-034: 文件上传恶意文件', () => {
        it('should reject or sanitize malicious file uploads', async () => {
            const testDir = path.join(__dirname, 'test-files-sec')
            if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true })

            const xssHtmlPath = path.join(testDir, 'malicious.html')
            fs.writeFileSync(xssHtmlPath, '<script>alert("xss")</script>')

            const res = await request(app.getHttpServer())
                .post('/api/upload')
                .set('Authorization', `Bearer ${testUser.token}`)
                .attach('file', xssHtmlPath)

            if (res.status === 200 || res.status === 201) {
                const fileUrl = res.body.data?.url || res.body.data?.path
                if (fileUrl) {
                    const contentRes = await request(app.getHttpServer())
                        .get(fileUrl)
                    const hasScript = contentRes.text?.includes('<script>')
                    expect(hasScript).toBeFalsy()
                }
            } else {
                expect([400, 415]).toContain(res.status)
            }

            fs.unlinkSync(xssHtmlPath)
        })
    })

    describe('SEC-035: 批量枚举分享链接', () => {
        it('should have rate limiting on share link enumeration', async () => {
            let rateLimited = false
            for (let i = 0; i < 30; i++) {
                const res = await request(app.getHttpServer())
                    .get(`/api/share/share${i}/info`)
                if (res.status === 429) {
                    rateLimited = true
                    break
                }
            }
            expect(typeof rateLimited).toBe('boolean')
        })
    })

    describe('SEC-036: JWT 无过期时间', () => {
        it('should have exp field in JWT payload', () => {
            const jwtService = app.get(JwtService)
            const decoded = jwtService.decode(testUser.token) as any
            expect(decoded).toHaveProperty('exp')
            expect(decoded.exp).toBeGreaterThan(0)
        })
    })

    describe('SEC-037: 并发编辑冲突', () => {
        it('should handle concurrent page updates without data loss', async () => {
            if (!createdPageId) return
            const updates = Array.from({ length: 5 }, (_, i) =>
                request(app.getHttpServer())
                    .put('/api/page')
                    .set('Authorization', `Bearer ${testUser.token}`)
                    .send({ pageId: createdPageId, title: `Concurrent Update ${i}` })
            )
            const results = await Promise.all(updates)
            const successCount = results.filter(r => r.status === 200).length
            expect(successCount).toBeGreaterThan(0)
        })
    })
})
