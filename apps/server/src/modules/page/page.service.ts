import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In } from 'typeorm'
import { PostgresqlPersistence } from 'y-postgresql'

import { CollaboratorEntity } from '../../entities/collaborator.entity'
import { PageEntity } from '../../entities/page.entity'
import { ForbiddenCode, ForbiddenError } from '../../fundamentals/common/exceptions/forbidden.exception'
import { RagService } from '../ai/rag/rag.service'
import { yjsXmlMentionCollect } from '../../utils/yjsXMLMentionCollect'
import { yjsXmlToText } from '../../utils/yjsXmlToText'

@Injectable()
export class PageService {
    constructor(
        @InjectRepository(PageEntity)
        private readonly pageRepository: Repository<PageEntity>,
        @InjectRepository(CollaboratorEntity)
        private readonly collaboratorRepository: Repository<CollaboratorEntity>,
        @Inject('YJS_POSTGRESQL_ADAPTER') private readonly yjsPostgresqlAdapter: PostgresqlPersistence,
        private readonly ragService: RagService,
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

        const res = await this.pageRepository.update({ pageId: payload.pageId }, { ...allowedFields, updatedAt: new Date() })

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

    async batchSoftDelete(params: { pageIds: string[]; userId: number }) {
        const res = await this.pageRepository.update(
            { pageId: In(params.pageIds), user: { id: params.userId }, isDeleted: false },
            { isDeleted: true, deletedAt: new Date() }
        )

        return { success: true, affected: res.affected }
    }

    async batchRestore(params: { pageIds: string[]; userId: number }) {
        const res = await this.pageRepository.update(
            { pageId: In(params.pageIds), user: { id: params.userId }, isDeleted: true },
            { isDeleted: false, deletedAt: null }
        )

        return { success: true, affected: res.affected }
    }

    async batchPermanentDelete(params: { pageIds: string[]; userId: number }) {
        const res = await this.pageRepository.delete({
            pageId: In(params.pageIds),
            user: { id: params.userId },
            isDeleted: true,
        })

        return { success: true, affected: res.affected }
    }

    async clearTrash(params: { userId: number }) {
        const res = await this.pageRepository.delete({
            user: { id: params.userId },
            isDeleted: true,
        })

        return { success: true, affected: res.affected }
    }

    async graph(params: { userId: number }) {
        const pages = await this.pageRepository.find({
            where: { user: { id: params.userId }, isDeleted: false },
        })
        const withLinksPages = await Promise.all(
            pages.map(async page => {
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
            })
        )

        return withLinksPages
    }

    /**
     * 搜索文档
     *
     * 优先使用 RAG 语义搜索（理解查询含义），
     * 不可用时降级为关键词匹配搜索（精确匹配）。
     *
     * 语义搜索优势：
     * - 可找到意思相近但用词不同的内容
     * - 基于 pgvector 向量检索，性能远优于全扫描
     * - 返回相似度分数，结果更精准
     */
    async search(params: { query: string; userId: number }) {
        const keyword = params.query.toLowerCase().trim()
        if (!keyword) return []

        // 语义搜索路径（RAG）
        if (this.ragService.isAvailable()) {
            try {
                const ragResults = await this.ragService.retrieve(params.query, {
                    topK: 20,
                    minScore: 0.3,
                })

                if (ragResults.length > 0) {
                    // 获取用户有权限的文档列表
                    const userPages = await this.pageRepository.find({
                        where: { user: { id: params.userId }, isDeleted: false },
                    })
                    const userPageIds = new Set(userPages.map(p => p.pageId))

                    // 按文档分组，去重
                    const pageScoreMap = new Map<string, { pageId: string; maxScore: number; bestContent: string }>()
                    for (const r of ragResults) {
                        if (!userPageIds.has(r.pageId)) continue
                        const existing = pageScoreMap.get(r.pageId)
                        if (!existing || r.score > existing.maxScore) {
                            pageScoreMap.set(r.pageId, {
                                pageId: r.pageId,
                                maxScore: r.score,
                                bestContent: r.content,
                            })
                        }
                    }

                    // 获取匹配文档的元数据
                    const matchedPageIds = Array.from(pageScoreMap.keys())
                    if (matchedPageIds.length === 0) return []

                    const pages = await this.pageRepository.find({
                        where: matchedPageIds.map(pageId => ({ pageId, isDeleted: false })),
                    })

                    return pages.map(page => {
                        const match = pageScoreMap.get(page.pageId)!
                        return {
                            pageId: page.pageId,
                            emoji: page.emoji,
                            title: page.title,
                            snippet: match.bestContent.slice(0, 150),
                            updatedAt: page.updatedAt,
                            matchType: 'semantic' as const,
                            score: match.maxScore,
                        }
                    }).sort((a, b) => (b.score || 0) - (a.score || 0))
                }
            } catch {
                // 语义搜索失败，降级为关键词搜索
            }
        }

        // 关键词回退路径（原有逻辑）
        const pages = await this.pageRepository.find({
            where: { user: { id: params.userId }, isDeleted: false },
        })

        const results = await Promise.all(
            pages.map(async page => {
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
            })
        )

        return results.filter(Boolean).sort((a, b) => {
            if (a.matchType === 'title' && b.matchType !== 'title') return -1
            if (a.matchType !== 'title' && b.matchType === 'title') return 1
            return 0
        })
    }

    async backlinks(params: { pageId: string; userId: number }) {
        const pages = await this.pageRepository.find({
            where: { user: { id: params.userId }, isDeleted: false },
        })

        const results = await Promise.all(
            pages.map(async page => {
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
            })
        )

        return results.filter(Boolean)
    }
}
