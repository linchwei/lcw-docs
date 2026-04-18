import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import * as Y from 'yjs'
import { nanoid } from 'nanoid'
import { PostgresqlPersistence } from 'y-postgresql'
import { Repository } from 'typeorm'

import { PageEntity } from '../../entities/page.entity'
import { VersionEntity } from '../../entities/version.entity'
import { docs } from '../../fundamentals/yjs-postgresql/utils'

@Injectable()
export class VersionService {
    constructor(
        @InjectRepository(VersionEntity)
        private readonly versionRepository: Repository<VersionEntity>,
        @InjectRepository(PageEntity)
        private readonly pageRepository: Repository<PageEntity>,
        @Inject('YJS_POSTGRESQL_ADAPTER') private readonly yjsPostgresqlAdapter: PostgresqlPersistence
    ) {}

    async create(params: { pageId: string; description?: string; userId: number; source?: string }) {
        const page = await this.pageRepository.findOne({
            where: { pageId: params.pageId, isDeleted: false },
        })
        if (!page) {
            throw new NotFoundException('page not found')
        }

        const docName = `doc-yjs-${params.pageId}`
        const doc = await this.yjsPostgresqlAdapter.getYDoc(docName)
        const snapshot = doc.getXmlFragment(`document-store-${params.pageId}`).toJSON()
        const stateUpdate = Buffer.from(Y.encodeStateAsUpdate(doc)).toString('base64')

        const version = new VersionEntity({
            pageId: params.pageId,
            snapshot: snapshot || '',
            stateUpdate,
            description: params.description || null,
            source: params.source || 'manual',
            createdBy: params.userId,
        })
        version.versionId = 'v' + nanoid(20)

        return this.versionRepository.save(version)
    }

    async findByPageId(params: { pageId: string; userId: number }) {
        const page = await this.pageRepository.findOne({
            where: { pageId: params.pageId, isDeleted: false },
        })
        if (!page) {
            throw new NotFoundException('page not found')
        }

        return this.versionRepository.find({
            where: { pageId: params.pageId },
            order: { createdAt: 'DESC' },
        })
    }

    async findOne(params: { versionId: string; userId: number }) {
        const version = await this.versionRepository.findOne({
            where: { versionId: params.versionId },
        })
        if (!version) {
            throw new NotFoundException('version not found')
        }

        const page = await this.pageRepository.findOne({
            where: { pageId: version.pageId, isDeleted: false },
        })
        if (!page) {
            throw new NotFoundException('page not found')
        }

        return version
    }

    async delete(params: { versionId: string; userId: number }) {
        const version = await this.versionRepository.findOne({
            where: { versionId: params.versionId },
        })
        if (!version) {
            throw new NotFoundException('version not found')
        }

        await this.versionRepository.remove(version)
        return { success: true }
    }

    async rollback(params: { pageId: string; versionId: string; userId: number }) {
        const page = await this.pageRepository.findOne({
            where: { pageId: params.pageId, isDeleted: false },
            relations: ['user'],
        })
        if (!page) {
            throw new NotFoundException('page not found')
        }

        if (page.user.id !== params.userId) {
            throw new ForbiddenException('Only the document owner can rollback')
        }

        const targetVersion = await this.versionRepository.findOne({
            where: { versionId: params.versionId, pageId: params.pageId },
        })
        if (!targetVersion) {
            throw new NotFoundException('version not found')
        }

        if (!targetVersion.stateUpdate) {
            throw new NotFoundException('This version does not support rollback (missing state data)')
        }

        const safetyVersion = await this.create({
            pageId: params.pageId,
            description: '回滚前自动保存',
            userId: params.userId,
            source: 'rollback-safety',
        })

        const docName = `doc-yjs-${params.pageId}`
        const currentDoc = docs.get(docName)

        if (currentDoc) {
            const targetStateUpdate = Uint8Array.from(Buffer.from(targetVersion.stateUpdate, 'base64'))
            const targetDoc = new Y.Doc()
            Y.applyUpdate(targetDoc, targetStateUpdate)

            const currentFragment = currentDoc.getXmlFragment(`document-store-${params.pageId}`)
            const targetFragment = targetDoc.getXmlFragment(`document-store-${params.pageId}`)

            currentDoc.transact(() => {
                while (currentFragment.length > 0) {
                    currentFragment.delete(0)
                }
                for (let i = 0; i < targetFragment.length; i++) {
                    const child = targetFragment.get(i)
                    if (child && typeof child.clone === 'function') {
                        currentFragment.push([child.clone()])
                    }
                }
            }, 'rollback')
        } else {
            const doc = await this.yjsPostgresqlAdapter.getYDoc(docName)
            const targetStateUpdate = Uint8Array.from(Buffer.from(targetVersion.stateUpdate, 'base64'))
            const targetDoc = new Y.Doc()
            Y.applyUpdate(targetDoc, targetStateUpdate)

            const currentFragment = doc.getXmlFragment(`document-store-${params.pageId}`)
            const targetFragment = targetDoc.getXmlFragment(`document-store-${params.pageId}`)

            doc.transact(() => {
                while (currentFragment.length > 0) {
                    currentFragment.delete(0)
                }
                for (let i = 0; i < targetFragment.length; i++) {
                    const child = targetFragment.get(i)
                    if (child && typeof child.clone === 'function') {
                        currentFragment.push([child.clone()])
                    }
                }
            }, 'rollback')

            const update = Y.encodeStateAsUpdate(doc)
            await this.yjsPostgresqlAdapter.storeUpdate(docName, update)
        }

        return { success: true, safetyVersionId: safetyVersion.versionId }
    }

    async diff(params: { pageId: string; versionId1: string; versionId2: string; userId: number }) {
        const page = await this.pageRepository.findOne({
            where: { pageId: params.pageId, isDeleted: false },
        })
        if (!page) {
            throw new NotFoundException('page not found')
        }

        const v1 = await this.versionRepository.findOne({
            where: { versionId: params.versionId1, pageId: params.pageId },
        })
        const v2 = await this.versionRepository.findOne({
            where: { versionId: params.versionId2, pageId: params.pageId },
        })
        if (!v1 || !v2) {
            throw new NotFoundException('version not found')
        }

        const parseBlocks = (snapshot: string) => {
            try {
                const parsed = JSON.parse(snapshot)
                if (Array.isArray(parsed)) return parsed
                if (parsed && parsed.content && Array.isArray(parsed.content)) return parsed.content
                if (parsed && typeof parsed === 'object') return [parsed]
                return []
            } catch {
                return []
            }
        }

        const blocks1 = parseBlocks(v1.snapshot)
        const blocks2 = parseBlocks(v2.snapshot)

        const getKey = (block: any) => {
            if (!block || typeof block !== 'object') return String(block)
            const type = block.type || 'unknown'
            const text = extractText(block)
            return `${type}:${text}`
        }

        const extractText = (block: any): string => {
            if (!block) return ''
            if (typeof block === 'string') return block
            if (block.text) return block.text
            if (block.content) {
                if (typeof block.content === 'string') return block.content
                if (Array.isArray(block.content)) {
                    return block.content.map(extractText).join('')
                }
            }
            if (block.children && Array.isArray(block.children)) {
                return block.children.map(extractText).join('')
            }
            return ''
        }

        const map1 = new Map<string, { block: any; index: number }>()
        const map2 = new Map<string, { block: any; index: number }>()

        blocks1.forEach((block: any, i: number) => map1.set(getKey(block), { block, index: i }))
        blocks2.forEach((block: any, i: number) => map2.set(getKey(block), { block, index: i }))

        const added: Array<{ blockType: string; content: string }> = []
        const removed: Array<{ blockType: string; content: string }> = []
        const modified: Array<{ blockType: string; oldContent: string; newContent: string }> = []

        for (const [key, val] of map2) {
            const existing = map1.get(key)
            if (!existing) {
                added.push({ blockType: val.block?.type || 'unknown', content: extractText(val.block) })
            } else {
                const oldContent = extractText(existing.block)
                const newContent = extractText(val.block)
                if (oldContent !== newContent) {
                    modified.push({ blockType: val.block?.type || 'unknown', oldContent, newContent })
                }
            }
        }

        for (const [key, val] of map1) {
            if (!map2.has(key)) {
                removed.push({ blockType: val.block?.type || 'unknown', content: extractText(val.block) })
            }
        }

        return { added, removed, modified }
    }
}
