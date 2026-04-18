import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { PostgresqlPersistence } from 'y-postgresql'

import { CollaboratorEntity } from '../../entities/collaborator.entity'
import { ForbiddenCode, ForbiddenError } from '../../fundamentals/common/exceptions/forbidden.exception'
import { PageEntity } from '../../entities/page.entity'
import { yjsXmlMentionCollect } from '../../utils/yjsXMLMentionCollect'
import { yjsXmlToText } from '../../utils/yjsXmlToText'

@Injectable()
export class PageService {
    constructor(
        @InjectRepository(PageEntity)
        private readonly pageRepository: Repository<PageEntity>,
        @InjectRepository(CollaboratorEntity)
        private readonly collaboratorRepository: Repository<CollaboratorEntity>,
        @Inject('YJS_POSTGRESQL_ADAPTER') private readonly yjsPostgresqlAdapter: PostgresqlPersistence
    ) {}

    async create(payload) {
        this.pageRepository.save(payload)
        return payload
    }

    async update(payload) {
        const allowedFields: Partial<Pick<PageEntity, 'title' | 'emoji' | 'coverImage' | 'folderId'>> = {}
        if (payload.title !== undefined) allowedFields.title = payload.title
        if (payload.emoji !== undefined) allowedFields.emoji = payload.emoji
        if (payload.coverImage !== undefined) allowedFields.coverImage = payload.coverImage
        if (payload.folderId !== undefined) allowedFields.folderId = payload.folderId

        const res = await this.pageRepository.update(
            { pageId: payload.pageId },
            { ...allowedFields, updatedAt: new Date() }
        )

        if (res.affected === 0) {
            throw new NotFoundException('page not found')
        }

        const updatedPage = await this.pageRepository.findOne({
            where: { pageId: payload.pageId },
        })

        return updatedPage
    }

    async fetch(params: { pageId: string; userId: number }) {
        const page = await this.pageRepository.findOne({
            where: { pageId: params.pageId, isDeleted: false },
            relations: ['user'],
        })

        if (!page) {
            throw new NotFoundException('page not found')
        }

        const role = await this.checkPageAccess(params.userId, page)
        if (!role) {
            throw new ForbiddenError('您没有访问此文档的权限，请向文档所有者申请访问', ForbiddenCode.FORBIDDEN_NO_ACCESS)
        }

        return { ...page, role }
    }

    private async checkPageAccess(userId: number, page: PageEntity): Promise<string | null> {
        if (page.user && page.user.id === userId) return 'owner'
        const collaborator = await this.collaboratorRepository.findOne({
            where: { pageId: page.pageId, userId },
        })
        return collaborator ? collaborator.role : null
    }

    async list(params: { userId: number }) {
        const [data, count] = await this.pageRepository.findAndCount({
            where: { user: { id: params.userId }, isDeleted: false },
            order: { isFavorite: 'DESC', updatedAt: 'DESC' },
        })

        return {
            pages: data,
            count,
        }
    }

    async recent(params: { userId: number; limit?: number }) {
        const limit = params.limit || 5
        const ownPages = await this.pageRepository.find({
            where: { user: { id: params.userId }, isDeleted: false },
            order: { updatedAt: 'DESC' },
            take: limit,
            relations: ['user'],
        })

        const collaboratorEntries = await this.collaboratorRepository.find({
            where: { userId: params.userId },
        })
        const sharedPageIds = collaboratorEntries.map(c => c.pageId)

        let sharedPages: PageEntity[] = []
        if (sharedPageIds.length > 0) {
            sharedPages = await this.pageRepository.find({
                where: sharedPageIds.map(pageId => ({ pageId, isDeleted: false })),
                order: { updatedAt: 'DESC' },
                take: limit,
                relations: ['user'],
            })
        }

        const allPages = [...ownPages, ...sharedPages]
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            .slice(0, limit)

        return allPages
    }

    async shared(params: { userId: number }) {
        const collaboratorEntries = await this.collaboratorRepository.find({
            where: { userId: params.userId },
        })

        if (collaboratorEntries.length === 0) {
            return []
        }

        const pageIds = collaboratorEntries.map(c => c.pageId)
        const pages = await this.pageRepository.find({
            where: pageIds.map(pageId => ({ pageId, isDeleted: false })),
            relations: ['user'],
            order: { updatedAt: 'DESC' },
        })

        return pages.map(page => {
            const collab = collaboratorEntries.find(c => c.pageId === page.pageId)
            return {
                pageId: page.pageId,
                emoji: page.emoji,
                title: page.title,
                role: collab?.role || 'viewer',
                ownerName: page.user?.username || '',
                updatedAt: page.updatedAt,
                createdAt: page.createdAt,
            }
        })
    }

    async toggleFavorite(params: { pageId: string; userId: number }) {
        const page = await this.pageRepository.findOne({
            where: { pageId: params.pageId, user: { id: params.userId }, isDeleted: false },
        })

        if (!page) {
            throw new NotFoundException('page not found')
        }

        page.isFavorite = !page.isFavorite
        page.updatedAt = new Date()
        await this.pageRepository.save(page)
        return page
    }

    async softDelete(params: { pageId: string; userId: number }) {
        const res = await this.pageRepository.update(
            { pageId: params.pageId, user: { id: params.userId } },
            { isDeleted: true, deletedAt: new Date() }
        )

        if (res.affected === 0) {
            throw new NotFoundException('page not found')
        }

        return { success: true }
    }

    async trash(params: { userId: number }) {
        const data = await this.pageRepository.find({
            where: { user: { id: params.userId }, isDeleted: true },
            order: { deletedAt: 'DESC' },
        })

        return data
    }

    async restore(params: { pageId: string; userId: number }) {
        const res = await this.pageRepository.update(
            { pageId: params.pageId, user: { id: params.userId } },
            { isDeleted: false, deletedAt: null }
        )

        if (res.affected === 0) {
            throw new NotFoundException('page not found')
        }

        return { success: true }
    }

    async permanentDelete(params: { pageId: string; userId: number }) {
        const res = await this.pageRepository.delete({ pageId: params.pageId, user: { id: params.userId } })

        if (res.affected === 0) {
            throw new NotFoundException('page not found')
        }

        return { success: true }
    }

    async graph(params: { userId: number }) {
        const pages = await this.pageRepository.find({
            where: { user: { id: params.userId }, isDeleted: false },
        })
        const withLinksPages = await Promise.all(pages.map(async page => {
            const doc = await this.yjsPostgresqlAdapter.getYDoc(`doc-yjs-${page.pageId}`)
            const pageDoc = doc.getXmlFragment(`document-store-${page.pageId}`).toJSON()
            if (pageDoc) {
                return {
                    ...page,
                    links: yjsXmlMentionCollect(pageDoc),
                }
            }
            return {
                ...page,
                links: [],
            }
        }))

        return withLinksPages
    }

    async search(params: { query: string; userId: number }) {
        const keyword = params.query.toLowerCase().trim()
        if (!keyword) return []

        const pages = await this.pageRepository.find({
            where: { user: { id: params.userId }, isDeleted: false },
        })

        const results = await Promise.all(pages.map(async page => {
            const titleMatch = page.title.toLowerCase().includes(keyword)

            const doc = await this.yjsPostgresqlAdapter.getYDoc(`doc-yjs-${page.pageId}`)
            const pageDoc = doc.getXmlFragment(`document-store-${page.pageId}`).toJSON()
            const contentText = pageDoc ? yjsXmlToText(pageDoc) : ''
            const contentMatch = contentText.toLowerCase().includes(keyword)

            if (!titleMatch && !contentMatch) return null

            let snippet = ''
            if (titleMatch) {
                snippet = contentText.slice(0, 150)
            } else {
                const idx = contentText.toLowerCase().indexOf(keyword)
                const start = Math.max(0, idx - 50)
                const end = Math.min(contentText.length, idx + keyword.length + 100)
                snippet = (start > 0 ? '...' : '') + contentText.slice(start, end) + (end < contentText.length ? '...' : '')
            }

            return {
                pageId: page.pageId,
                emoji: page.emoji,
                title: page.title,
                snippet,
                updatedAt: page.updatedAt,
                matchType: titleMatch ? 'title' : 'content',
            }
        }))

        return results
            .filter(Boolean)
            .sort((a, b) => {
                if (a.matchType === 'title' && b.matchType !== 'title') return -1
                if (a.matchType !== 'title' && b.matchType === 'title') return 1
                return 0
            })
    }

    async backlinks(params: { pageId: string; userId: number }) {
        const pages = await this.pageRepository.find({
            where: { user: { id: params.userId }, isDeleted: false },
        })

        const results = await Promise.all(pages.map(async page => {
            if (page.pageId === params.pageId) return null

            const doc = await this.yjsPostgresqlAdapter.getYDoc(`doc-yjs-${page.pageId}`)
            const pageDoc = doc.getXmlFragment(`document-store-${page.pageId}`).toJSON()
            if (!pageDoc) return null

            const links = yjsXmlMentionCollect(pageDoc)
            if (!links.includes(params.pageId)) return null

            return {
                pageId: page.pageId,
                emoji: page.emoji,
                title: page.title,
                updatedAt: page.updatedAt,
            }
        }))

        return results.filter(Boolean)
    }
}
