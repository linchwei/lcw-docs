import { Inject, Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { InjectRepository } from '@nestjs/typeorm'
import * as Y from 'yjs'
import { nanoid } from 'nanoid'
import { PostgresqlPersistence } from 'y-postgresql'
import { Repository } from 'typeorm'

import { PageEntity } from '../../entities/page.entity'
import { VersionEntity } from '../../entities/version.entity'
import { docs } from '../../fundamentals/yjs-postgresql/utils'

const MAX_VERSIONS_PER_DOC = 1000

@Injectable()
export class VersionScheduler {
    private readonly logger = new Logger(VersionScheduler.name)

    constructor(
        @InjectRepository(VersionEntity)
        private readonly versionRepository: Repository<VersionEntity>,
        @InjectRepository(PageEntity)
        private readonly pageRepository: Repository<PageEntity>,
        @Inject('YJS_POSTGRESQL_ADAPTER') private readonly yjsPostgresqlAdapter: PostgresqlPersistence
    ) {}

    @Cron('*/30 * * * *')
    async autoSnapshot() {
        try {
            const activeDocs = Array.from(docs.keys())

            if (activeDocs.length === 0) return

            for (const docName of activeDocs) {
                const pageId = docName.replace('doc-yjs-', '')
                const page = await this.pageRepository.findOne({
                    where: { pageId, isDeleted: false },
                })
                if (!page) continue

                const hasChanges = await this.checkForChanges(pageId, docName)
                if (!hasChanges) continue

                await this.createAutoSnapshot(pageId, docName, page.user.id)
                await this.enforceVersionLimit(pageId)
            }
        } catch (error) {
            this.logger.error('Auto snapshot failed', error)
        }
    }

    private async checkForChanges(pageId: string, docName: string): Promise<boolean> {
        const latestVersion = await this.versionRepository.findOne({
            where: { pageId },
            order: { createdAt: 'DESC' },
        })

        if (!latestVersion) return true

        const doc = docs.get(docName)
        if (!doc) return false

        const currentSnapshot = doc.getXmlFragment(`document-store-${pageId}`).toJSON()
        return currentSnapshot !== latestVersion.snapshot
    }

    private async createAutoSnapshot(pageId: string, docName: string, userId: number) {
        const doc = docs.get(docName)
        if (!doc) return

        const snapshot = doc.getXmlFragment(`document-store-${pageId}`).toJSON()
        const stateUpdate = Buffer.from(Y.encodeStateAsUpdate(doc)).toString('base64')

        const version = new VersionEntity({
            pageId,
            snapshot: snapshot || '',
            stateUpdate,
            description: '自动保存',
            source: 'auto',
            createdBy: userId,
        })
        version.versionId = 'v' + nanoid(20)

        await this.versionRepository.save(version)
        this.logger.log(`Auto snapshot created for page ${pageId}`)
    }

    private async enforceVersionLimit(pageId: string) {
        const count = await this.versionRepository.count({
            where: { pageId },
        })

        if (count <= MAX_VERSIONS_PER_DOC) return

        const excess = count - MAX_VERSIONS_PER_DOC
        const oldestVersions = await this.versionRepository.find({
            where: { pageId, source: 'auto' },
            order: { createdAt: 'ASC' },
            take: excess,
        })

        if (oldestVersions.length > 0) {
            await this.versionRepository.remove(oldestVersions)
            this.logger.log(`Cleaned up ${oldestVersions.length} old auto versions for page ${pageId}`)
        }
    }
}
