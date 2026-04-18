import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import * as Y from 'yjs'
import { PostgresqlPersistence } from 'y-postgresql'
import { Repository } from 'typeorm'

import { CollaboratorEntity } from '../../entities/collaborator.entity'
import { PageEntity } from '../../entities/page.entity'
import { docs } from '../../fundamentals/yjs-postgresql/utils'

@Injectable()
export class SyncService {
    constructor(
        @InjectRepository(PageEntity)
        private readonly pageRepository: Repository<PageEntity>,
        @InjectRepository(CollaboratorEntity)
        private readonly collaboratorRepository: Repository<CollaboratorEntity>,
        @Inject('YJS_POSTGRESQL_ADAPTER') private readonly yjsPostgresqlAdapter: PostgresqlPersistence
    ) {}

    private async checkAccess(params: { pageId: string; userId: number; requireWrite?: boolean }) {
        const page = await this.pageRepository.findOne({
            where: { pageId: params.pageId, isDeleted: false },
            relations: ['user'],
        })
        if (!page) {
            throw new NotFoundException('page not found')
        }

        if (page.user.id === params.userId) {
            return { page, role: 'owner' }
        }

        const collab = await this.collaboratorRepository.findOne({
            where: { pageId: params.pageId, userId: params.userId },
        })
        if (!collab) {
            throw new ForbiddenException('No access to this document')
        }

        if (params.requireWrite && (collab.role === 'viewer' || collab.role === 'commenter')) {
            throw new ForbiddenException('Write access required')
        }

        return { page, role: collab.role }
    }

    async getOps(params: { pageId: string; since: string; userId: number }) {
        await this.checkAccess({ pageId: params.pageId, userId: params.userId })

        const docName = `doc-yjs-${params.pageId}`
        const currentDoc = docs.get(docName) || await this.yjsPostgresqlAdapter.getYDoc(docName)

        let stateVector: Uint8Array | null = null
        if (params.since) {
            try {
                stateVector = Uint8Array.from(Buffer.from(params.since, 'base64'))
            } catch {
                stateVector = null
            }
        }

        const update = stateVector
            ? Y.encodeStateAsUpdate(currentDoc, stateVector)
            : Y.encodeStateAsUpdate(currentDoc)

        const currentStateVector = Y.encodeStateVector(currentDoc)

        return {
            update: Buffer.from(update).toString('base64'),
            stateVector: Buffer.from(currentStateVector).toString('base64'),
        }
    }

    async pushOps(params: { pageId: string; update: string; userId: number }) {
        await this.checkAccess({ pageId: params.pageId, userId: params.userId, requireWrite: true })

        const docName = `doc-yjs-${params.pageId}`
        const currentDoc = docs.get(docName)

        const updateData = Uint8Array.from(Buffer.from(params.update, 'base64'))

        if (currentDoc) {
            Y.applyUpdate(currentDoc, updateData)
        } else {
            const doc = await this.yjsPostgresqlAdapter.getYDoc(docName)
            Y.applyUpdate(doc, updateData)
            const fullUpdate = Y.encodeStateAsUpdate(doc)
            await this.yjsPostgresqlAdapter.storeUpdate(docName, fullUpdate)
        }

        const doc = docs.get(docName) || await this.yjsPostgresqlAdapter.getYDoc(docName)
        const currentStateVector = Y.encodeStateVector(doc)

        return {
            stateVector: Buffer.from(currentStateVector).toString('base64'),
        }
    }

    async getSnapshot(params: { pageId: string; userId: number }) {
        await this.checkAccess({ pageId: params.pageId, userId: params.userId })

        const docName = `doc-yjs-${params.pageId}`
        const doc = docs.get(docName) || await this.yjsPostgresqlAdapter.getYDoc(docName)

        const snapshot = doc.getXmlFragment(`document-store-${params.pageId}`).toJSON()
        const stateUpdate = Buffer.from(Y.encodeStateAsUpdate(doc)).toString('base64')
        const stateVector = Buffer.from(Y.encodeStateVector(doc)).toString('base64')

        return {
            snapshot,
            stateUpdate,
            stateVector,
        }
    }
}
