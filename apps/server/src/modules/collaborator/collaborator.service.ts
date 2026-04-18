import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { nanoid } from 'nanoid'
import { Repository } from 'typeorm'

import { CollaboratorEntity } from '../../entities/collaborator.entity'
import { ForbiddenCode, ForbiddenError } from '../../fundamentals/common/exceptions/forbidden.exception'
import { PageEntity } from '../../entities/page.entity'
import { UserEntity } from '../../entities/user.entity'
import { AuditService } from '../audit/audit.service'
import { NotificationService } from '../notification/notification.service'

@Injectable()
export class CollaboratorService {
    constructor(
        @InjectRepository(CollaboratorEntity)
        private readonly collaboratorRepository: Repository<CollaboratorEntity>,
        @InjectRepository(PageEntity)
        private readonly pageRepository: Repository<PageEntity>,
        @InjectRepository(UserEntity)
        private readonly userRepository: Repository<UserEntity>,
        private readonly auditService: AuditService,
        private readonly notificationService: NotificationService,
    ) {}

    async list(params: { pageId: string; userId: number }) {
        const page = await this.pageRepository.findOne({
            where: { pageId: params.pageId, isDeleted: false },
            relations: ['user'],
        })
        if (!page) {
            throw new NotFoundException('page not found')
        }

        const isOwner = page.user?.id === params.userId
        const isCollaborator = await this.collaboratorRepository.findOne({
            where: { pageId: params.pageId, userId: params.userId },
        })

        if (!isOwner && !isCollaborator) {
            throw new ForbiddenError('您无权查看此文档的协作者信息', ForbiddenCode.FORBIDDEN_NO_ACCESS)
        }

        const collaborators = await this.collaboratorRepository.find({
            where: { pageId: params.pageId },
            relations: ['user'],
            order: { createdAt: 'ASC' },
        })

        return [
            {
                userId: page.user.id,
                username: page.user.username,
                role: 'owner',
                pageId: params.pageId,
            },
            ...collaborators.map(c => ({
                collaboratorId: c.collaboratorId,
                userId: c.userId,
                username: c.user.username,
                role: c.role,
                pageId: c.pageId,
                createdAt: c.createdAt,
            })),
        ]
    }

    async add(params: { pageId: string; username: string; role: string; userId: number }) {
        const page = await this.pageRepository.findOne({
            where: { pageId: params.pageId, isDeleted: false },
            relations: ['user'],
        })
        if (!page) {
            throw new NotFoundException('page not found')
        }

        if (page.user.id !== params.userId) {
            throw new ForbiddenError('仅文档所有者可以添加协作者', ForbiddenCode.FORBIDDEN_NOT_OWNER)
        }

        const targetUser = await this.userRepository.findOne({
            where: { username: params.username },
        })
        if (!targetUser) {
            throw new NotFoundException('user not found')
        }

        if (targetUser.id === params.userId) {
            throw new ForbiddenError('不能将自己添加为协作者', ForbiddenCode.FORBIDDEN_SELF_OPERATION)
        }

        const existing = await this.collaboratorRepository.findOne({
            where: { pageId: params.pageId, userId: targetUser.id },
        })
        if (existing) {
            existing.role = params.role
            return this.collaboratorRepository.save(existing)
        }

        const collaborator = new CollaboratorEntity({
            pageId: params.pageId,
            userId: targetUser.id,
            role: params.role,
            user: targetUser,
        })
        collaborator.collaboratorId = 'col' + nanoid(6)

        const result = await this.collaboratorRepository.save(collaborator)
        await this.auditService.log({
            userId: params.userId,
            action: 'collaborator.add',
            resourceType: 'page',
            resourceId: params.pageId,
            details: { targetUserId: targetUser.id, targetUsername: targetUser.username, role: params.role },
        })
        await this.notificationService.create({
            type: 'collaborator',
            fromUserId: params.userId,
            toUserId: targetUser.id,
            pageId: params.pageId,
            content: `已将您添加为协作者，角色：${params.role === 'editor' ? '编辑者' : params.role === 'commenter' ? '评论者' : '查看者'}`,
        })
        return result
    }

    async update(params: { collaboratorId: string; role: string; userId: number }) {
        const collaborator = await this.collaboratorRepository.findOne({
            where: { collaboratorId: params.collaboratorId },
            relations: ['user'],
        })
        if (!collaborator) {
            throw new NotFoundException('collaborator not found')
        }

        const page = await this.pageRepository.findOne({
            where: { pageId: collaborator.pageId, isDeleted: false },
            relations: ['user'],
        })
        if (!page || page.user.id !== params.userId) {
            throw new ForbiddenError('仅文档所有者可以修改协作者权限', ForbiddenCode.FORBIDDEN_NOT_OWNER)
        }

        collaborator.role = params.role
        const result = await this.collaboratorRepository.save(collaborator)
        await this.auditService.log({
            userId: params.userId,
            action: 'collaborator.update',
            resourceType: 'page',
            resourceId: collaborator.pageId,
            details: { targetUserId: collaborator.userId, newRole: params.role },
        })
        await this.notificationService.create({
            type: 'collaborator',
            fromUserId: params.userId,
            toUserId: collaborator.userId,
            pageId: collaborator.pageId,
            content: `您的协作者角色已变更为：${params.role === 'editor' ? '编辑者' : params.role === 'commenter' ? '评论者' : '查看者'}`,
        })
        return result
    }

    async remove(params: { collaboratorId: string; userId: number }) {
        const collaborator = await this.collaboratorRepository.findOne({
            where: { collaboratorId: params.collaboratorId },
            relations: ['user'],
        })
        if (!collaborator) {
            throw new NotFoundException('collaborator not found')
        }

        const page = await this.pageRepository.findOne({
            where: { pageId: collaborator.pageId, isDeleted: false },
            relations: ['user'],
        })
        if (!page || (page.user.id !== params.userId && collaborator.userId !== params.userId)) {
            throw new ForbiddenError('您无权移除此协作者，仅文档所有者或协作者本人可执行此操作', ForbiddenCode.FORBIDDEN_ROLE_INSUFFICIENT)
        }

        await this.collaboratorRepository.remove(collaborator)
        await this.auditService.log({
            userId: params.userId,
            action: 'collaborator.remove',
            resourceType: 'page',
            resourceId: collaborator.pageId,
            details: { targetUserId: collaborator.userId },
        })
        if (collaborator.userId !== params.userId) {
            await this.notificationService.create({
                type: 'collaborator',
                fromUserId: params.userId,
                toUserId: collaborator.userId,
                pageId: collaborator.pageId,
                content: '您已被移除此文档的协作者',
            })
        }
        return { success: true }
    }
}
