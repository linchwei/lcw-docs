import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { nanoid } from 'nanoid'
import { Repository } from 'typeorm'

import { NotificationEntity } from '../../entities/notification.entity'
import { UserEntity } from '../../entities/user.entity'

@Injectable()
export class NotificationService {
    constructor(
        @InjectRepository(NotificationEntity)
        private readonly notificationRepository: Repository<NotificationEntity>,
        @InjectRepository(UserEntity)
        private readonly userRepository: Repository<UserEntity>
    ) {}

    async create(params: { type: string; fromUserId: number; toUserId: number; pageId: string; content?: string }) {
        const fromUser = new UserEntity()
        fromUser.id = params.fromUserId

        const toUser = new UserEntity()
        toUser.id = params.toUserId

        const notification = new NotificationEntity({
            type: params.type,
            fromUserId: params.fromUserId,
            toUserId: params.toUserId,
            pageId: params.pageId,
            content: params.content || null,
            fromUser,
            toUser,
        })
        notification.notificationId = 'ntf' + nanoid(6)

        return this.notificationRepository.save(notification)
    }

    async list(params: { userId: number }) {
        return this.notificationRepository.find({
            where: { toUserId: params.userId },
            relations: ['fromUser'],
            order: { createdAt: 'DESC' },
        })
    }

    async unreadCount(params: { userId: number }) {
        return this.notificationRepository.count({
            where: { toUserId: params.userId, read: false },
        })
    }

    async markRead(params: { notificationId: string; userId: number }) {
        const notification = await this.notificationRepository.findOne({
            where: { notificationId: params.notificationId, toUserId: params.userId },
        })
        if (!notification) return null

        notification.read = true
        return this.notificationRepository.save(notification)
    }

    async markAllRead(params: { userId: number }) {
        await this.notificationRepository.update(
            { toUserId: params.userId, read: false },
            { read: true }
        )
        return { success: true }
    }

    async delete(params: { notificationId: string; userId: number }) {
        const notification = await this.notificationRepository.findOne({
            where: { notificationId: params.notificationId, toUserId: params.userId },
        })
        if (!notification) return null

        await this.notificationRepository.remove(notification)
        return { success: true }
    }
}
