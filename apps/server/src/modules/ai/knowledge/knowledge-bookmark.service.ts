/**
 * 知识书签服务
 *
 * 提供知识书签的增删查搜功能，
 * 支持用户在 AI 对话过程中收藏、检索和管理知识片段。
 *
 * @module ai/knowledge/knowledge-bookmark.service
 */
import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { KnowledgeBookmarkEntity } from '../../../entities/knowledge-bookmark.entity'

/**
 * 知识书签服务类
 *
 * 负责知识书签的创建、列表查询、删除和搜索等业务逻辑。
 */
@Injectable()
export class KnowledgeBookmarkService {
    constructor(
        @InjectRepository(KnowledgeBookmarkEntity)
        private readonly bookmarkRepo: Repository<KnowledgeBookmarkEntity>
    ) {}

    /**
     * 创建知识书签
     *
     * @param params.userId - 用户 ID
     * @param params.sourcePageId - 来源页面 ID
     * @param params.sourceBlockId - 来源块 ID（可选）
     * @param params.title - 书签标题
     * @param params.content - 书签内容
     * @param params.question - 用户原始提问（可选）
     * @param params.threadId - 所属对话线程 ID（可选）
     * @returns 创建后的书签实体
     */
    async create(params: {
        userId: number
        sourcePageId: string
        sourceBlockId?: string
        title: string
        content: string
        question?: string
        threadId?: string
    }): Promise<KnowledgeBookmarkEntity> {
        const bookmark = new KnowledgeBookmarkEntity({
            userId: params.userId,
            sourcePageId: params.sourcePageId,
            sourceBlockId: params.sourceBlockId ?? null,
            title: params.title,
            content: params.content,
            question: params.question ?? null,
            threadId: params.threadId ?? null,
        })

        return this.bookmarkRepo.save(bookmark)
    }

    /**
     * 查询知识书签列表（分页）
     *
     * @param params.userId - 用户 ID
     * @param params.page - 页码，默认 1
     * @param params.pageSize - 每页条数，默认 20
     * @returns 分页结果，包含 items 和 total
     */
    async list(params: {
        userId: number
        page?: number
        pageSize?: number
    }): Promise<{ items: KnowledgeBookmarkEntity[]; total: number }> {
        const page = params.page ?? 1
        const pageSize = params.pageSize ?? 20

        const [items, total] = await this.bookmarkRepo.findAndCount({
            where: { userId: params.userId },
            order: { createdAt: 'DESC' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        })

        return { items, total }
    }

    /**
     * 删除知识书签
     *
     * 仅允许删除属于当前用户的书签，否则抛出 NotFoundException。
     *
     * @param params.bookmarkId - 书签 ID
     * @param params.userId - 用户 ID（用于权限校验）
     * @returns 删除成功标志
     */
    async delete(params: { bookmarkId: number; userId: number }): Promise<{ success: true }> {
        // 查询书签并校验归属用户
        const bookmark = await this.bookmarkRepo.findOne({
            where: { id: params.bookmarkId, userId: params.userId },
        })
        if (!bookmark) {
            throw new NotFoundException('知识书签不存在')
        }

        await this.bookmarkRepo.remove(bookmark)
        return { success: true }
    }

    /**
     * 搜索知识书签
     *
     * 在标题和内容中进行模糊匹配（不区分大小写），限制返回 20 条。
     *
     * @param params.userId - 用户 ID
     * @param params.query - 搜索关键词
     * @returns 匹配的书签列表
     */
    async search(params: { userId: number; query: string }): Promise<KnowledgeBookmarkEntity[]> {
        const { userId, query } = params

        return this.bookmarkRepo
            .createQueryBuilder('bookmark')
            .where('bookmark.userId = :userId', { userId })
            .andWhere(
                '(LOWER(bookmark.title) LIKE LOWER(:query) OR LOWER(bookmark.content) LIKE LOWER(:query))',
                { query: `%${query}%` },
            )
            .orderBy('bookmark.createdAt', 'DESC')
            .limit(20)
            .getMany()
    }
}
