import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'

import { cleanupAll, closeTestApp, createTestApp, createTestUser } from '../../helpers'

describe('FolderController', () => {
    let app: INestApplication
    let testUser: { user: any; token: string }
    let createdFolderId: string

    beforeAll(async () => {
        app = await createTestApp()
        testUser = await createTestUser(app, 'testfolderuser', 'testpass123')
    })

    afterAll(async () => {
        await cleanupAll(app)
        await closeTestApp()
    })

    describe('GET /api/folder', () => {
        it('FD-001: should return folder list', async () => {
            const res = await request(app.getHttpServer()).get('/api/folder').set('Authorization', `Bearer ${testUser.token}`)
            expect(res.status).toBe(200)
            expect(res.body).toHaveProperty('data')
        })
    })

    describe('POST /api/folder', () => {
        it('FD-002: should create a folder', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/folder')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ name: 'Test Folder' })
            expect(res.status).toBe(201)
            expect(res.body).toHaveProperty('data')
            expect(res.body.success).toBe(true)
            createdFolderId = res.body.data.folderId
        })

        it('FD-003: should create a subfolder', async () => {
            if (!createdFolderId) return
            const res = await request(app.getHttpServer())
                .post('/api/folder')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ name: 'Sub Folder', parentId: createdFolderId })
            expect(res.status).toBe(201)
            expect(res.body.success).toBe(true)
        })
    })

    describe('PUT /api/folder', () => {
        it('FD-004: should update a folder', async () => {
            if (!createdFolderId) return
            const res = await request(app.getHttpServer())
                .put('/api/folder')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ folderId: createdFolderId, name: 'Updated Folder' })
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })
    })

    describe('DELETE /api/folder/:folderId', () => {
        it('FD-005: should delete a folder', async () => {
            if (!createdFolderId) return
            const res = await request(app.getHttpServer())
                .delete(`/api/folder/${createdFolderId}`)
                .set('Authorization', `Bearer ${testUser.token}`)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
        })

        it('FD-006: should return 404 for non-existent folder', async () => {
            const res = await request(app.getHttpServer())
                .delete('/api/folder/nonexistentfolderid')
                .set('Authorization', `Bearer ${testUser.token}`)
            expect(res.status).toBe(404)
        })
    })

    describe('DELETE /api/folder/:folderId - page cleanup', () => {
        it('FD-007: should move pages back to root when folder is deleted', async () => {
            // 1. 创建文件夹
            const folderRes = await request(app.getHttpServer())
                .post('/api/folder')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ name: 'Folder With Pages' })
            expect(folderRes.status).toBe(201)
            const folderId = folderRes.body.data.folderId

            // 2. 创建页面并移入文件夹
            const pageRes = await request(app.getHttpServer())
                .post('/api/page')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ emoji: '📄', title: 'Page In Folder' })
            expect(pageRes.status).toBe(201)
            const pageId = pageRes.body.data.pageId

            const moveRes = await request(app.getHttpServer())
                .put('/api/page')
                .set('Authorization', `Bearer ${testUser.token}`)
                .send({ pageId, folderId })
            expect(moveRes.status).toBe(200)

            // 3. 删除文件夹
            const deleteRes = await request(app.getHttpServer())
                .delete(`/api/folder/${folderId}`)
                .set('Authorization', `Bearer ${testUser.token}`)
            expect(deleteRes.status).toBe(200)

            // 4. 验证页面的 folderId 已被清空
            const pageDetail = await request(app.getHttpServer())
                .get(`/api/page/${pageId}`)
                .set('Authorization', `Bearer ${testUser.token}`)
            expect(pageDetail.status).toBe(200)
            expect(pageDetail.body.data.folderId).toBeNull()
        })
    })
})
