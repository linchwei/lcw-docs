import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'

import { closeTestApp, createTestApp, createTestUser, cleanupAll } from '../../test/helpers'

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
            const res = await request(app.getHttpServer())
                .get('/api/folder')
                .set('Authorization', `Bearer ${testUser.token}`)
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
})
