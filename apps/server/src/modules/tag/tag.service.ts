import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { nanoid } from 'nanoid'
import { Repository } from 'typeorm'

import { PageTagEntity } from '../../entities/page-tag.entity'
import { TagEntity } from '../../entities/tag.entity'
import { UserEntity } from '../../entities/user.entity'

@Injectable()
export class TagService {
    constructor(
        @InjectRepository(TagEntity)
        private readonly tagRepository: Repository<TagEntity>,
        @InjectRepository(PageTagEntity)
        private readonly pageTagRepository: Repository<PageTagEntity>,
        @InjectRepository(UserEntity)
        private readonly userRepository: Repository<UserEntity>
    ) {}

    async create(params: { name: string; color?: string; userId: number }) {
        const user = new UserEntity()
        user.id = params.userId

        const tag = new TagEntity({
            name: params.name,
            color: params.color || '#6B45FF',
            userId: params.userId,
            user,
        })
        tag.tagId = 'tag' + nanoid(6)

        return this.tagRepository.save(tag)
    }

    async list(params: { userId: number }) {
        return this.tagRepository.find({
            where: { userId: params.userId },
            order: { createdAt: 'ASC' },
        })
    }

    async update(params: { tagId: string; name?: string; color?: string; userId: number }) {
        const tag = await this.tagRepository.findOne({
            where: { tagId: params.tagId, userId: params.userId },
        })
        if (!tag) {
            throw new NotFoundException('tag not found')
        }

        if (params.name !== undefined) tag.name = params.name
        if (params.color !== undefined) tag.color = params.color

        return this.tagRepository.save(tag)
    }

    async delete(params: { tagId: string; userId: number }) {
        const tag = await this.tagRepository.findOne({
            where: { tagId: params.tagId, userId: params.userId },
        })
        if (!tag) {
            throw new NotFoundException('tag not found')
        }

        await this.pageTagRepository.delete({ tagId: tag.tagId })
        await this.tagRepository.remove(tag)
        return { success: true }
    }

    async addPageTag(params: { pageId: string; tagId: string; userId: number }) {
        const tag = await this.tagRepository.findOne({
            where: { tagId: params.tagId, userId: params.userId },
        })
        if (!tag) {
            throw new NotFoundException('tag not found')
        }

        const existing = await this.pageTagRepository.findOne({
            where: { pageId: params.pageId, tagId: params.tagId },
        })
        if (existing) return existing

        const pageTag = new PageTagEntity({
            pageId: params.pageId,
            tagId: params.tagId,
        })

        return this.pageTagRepository.save(pageTag)
    }

    async removePageTag(params: { pageId: string; tagId: string; userId: number }) {
        const pageTag = await this.pageTagRepository.findOne({
            where: { pageId: params.pageId, tagId: params.tagId },
        })
        if (!pageTag) {
            throw new NotFoundException('page tag not found')
        }

        await this.pageTagRepository.remove(pageTag)
        return { success: true }
    }

    async getPageTags(params: { pageId: string }) {
        const pageTags = await this.pageTagRepository.find({
            where: { pageId: params.pageId },
        })
        const tagIds = pageTags.map(pt => pt.tagId)
        if (tagIds.length === 0) return []

        return this.tagRepository.find({
            where: tagIds.map(id => ({ tagId: id })),
        })
    }

    async batchGetPageTags(params: { pageIds: string[] }) {
        if (params.pageIds.length === 0) return {}

        const pageTags = await this.pageTagRepository.find({
            where: params.pageIds.map(pageId => ({ pageId })),
        })

        const tagIds = [...new Set(pageTags.map(pt => pt.tagId))]
        const tags = tagIds.length > 0
            ? await this.tagRepository.find({
                where: tagIds.map(id => ({ tagId: id })),
            })
            : []

        const tagMap = new Map(tags.map(t => [t.tagId, t]))

        const result: Record<string, typeof tags> = {}
        for (const pageId of params.pageIds) {
            result[pageId] = []
        }
        for (const pt of pageTags) {
            const tag = tagMap.get(pt.tagId)
            if (tag && result[pt.pageId]) {
                result[pt.pageId].push(tag)
            }
        }

        return result
    }

    async getTagPages(params: { tagId: string; userId: number }) {
        const tag = await this.tagRepository.findOne({
            where: { tagId: params.tagId, userId: params.userId },
        })
        if (!tag) {
            throw new NotFoundException('tag not found')
        }

        const pageTags = await this.pageTagRepository.find({
            where: { tagId: params.tagId },
        })

        return pageTags.map(pt => ({
            pageId: pt.pageId,
            tagId: pt.tagId,
        }))
    }
}
