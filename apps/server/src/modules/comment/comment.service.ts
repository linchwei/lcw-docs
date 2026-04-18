import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { nanoid } from 'nanoid'
import { Repository } from 'typeorm'

import { CommentEntity } from '../../entities/comment.entity'
import { PageEntity } from '../../entities/page.entity'

@Injectable()
export class CommentService {
    constructor(
        @InjectRepository(CommentEntity)
        private readonly commentRepository: Repository<CommentEntity>,
        @InjectRepository(PageEntity)
        private readonly pageRepository: Repository<PageEntity>
    ) {}

    async create(params: { pageId: string; content: string; anchorText?: string; anchorPos?: string; userId: number }) {
        const page = await this.pageRepository.findOne({
            where: { pageId: params.pageId, isDeleted: false },
        })
        if (!page) {
            throw new NotFoundException('page not found')
        }

        const comment = new CommentEntity({
            pageId: params.pageId,
            content: params.content,
            anchorText: params.anchorText || null,
            anchorPos: params.anchorPos || null,
            parentId: null,
            resolvedAt: null,
            createdBy: params.userId,
        })
        comment.commentId = 'c' + nanoid(20)

        return this.commentRepository.save(comment)
    }

    async findByPageId(params: { pageId: string; userId: number }) {
        const page = await this.pageRepository.findOne({
            where: { pageId: params.pageId, isDeleted: false },
        })
        if (!page) {
            throw new NotFoundException('page not found')
        }

        const comments = await this.commentRepository.find({
            where: { pageId: params.pageId },
            order: { createdAt: 'ASC' },
        })

        const topLevelComments = comments.filter((c) => c.parentId === null)
        const result = topLevelComments.map((parent) => {
            const replies = comments.filter((c) => c.parentId === parent.commentId)
            return { ...parent, replies }
        })

        return result
    }

    async reply(params: { parentId: string; content: string; userId: number }) {
        const parentComment = await this.commentRepository.findOne({
            where: { commentId: params.parentId },
        })
        if (!parentComment) {
            throw new NotFoundException('parent comment not found')
        }

        const page = await this.pageRepository.findOne({
            where: { pageId: parentComment.pageId, isDeleted: false },
        })
        if (!page) {
            throw new NotFoundException('page not found')
        }

        const comment = new CommentEntity({
            pageId: parentComment.pageId,
            content: params.content,
            anchorText: null,
            anchorPos: null,
            parentId: params.parentId,
            resolvedAt: null,
            createdBy: params.userId,
        })
        comment.commentId = 'c' + nanoid(20)

        return this.commentRepository.save(comment)
    }

    async resolve(params: { commentId: string; userId: number }) {
        const comment = await this.commentRepository.findOne({
            where: { commentId: params.commentId },
        })
        if (!comment) {
            throw new NotFoundException('comment not found')
        }

        const page = await this.pageRepository.findOne({
            where: { pageId: comment.pageId },
        })
        if (!page) {
            throw new NotFoundException('page not found')
        }

        comment.resolvedAt = new Date()
        return this.commentRepository.save(comment)
    }

    async delete(params: { commentId: string; userId: number }) {
        const comment = await this.commentRepository.findOne({
            where: { commentId: params.commentId },
        })
        if (!comment) {
            throw new NotFoundException('comment not found')
        }

        const page = await this.pageRepository.findOne({
            where: { pageId: comment.pageId },
            relations: ['user'],
        })
        if (!page) {
            throw new NotFoundException('page not found')
        }

        if (comment.createdBy !== params.userId && page.user.id !== params.userId) {
            throw new NotFoundException('comment not found')
        }

        await this.commentRepository.delete({ parentId: comment.commentId })
        await this.commentRepository.remove(comment)
        return { success: true }
    }
}
