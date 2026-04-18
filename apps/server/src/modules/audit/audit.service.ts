import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { nanoid } from 'nanoid'
import { Repository } from 'typeorm'

import { AuditLogEntity } from '../../entities/audit-log.entity'

export interface AuditLogParams {
    userId?: number
    action: string
    resourceType: string
    resourceId: string
    details?: Record<string, any>
    ip?: string
    userAgent?: string
}

@Injectable()
export class AuditService {
    constructor(
        @InjectRepository(AuditLogEntity)
        private readonly auditRepository: Repository<AuditLogEntity>,
    ) {}

    async log(params: AuditLogParams): Promise<AuditLogEntity> {
        const entry = this.auditRepository.create({
            auditId: `aud${nanoid(6)}`,
            userId: params.userId ?? null,
            action: params.action,
            resourceType: params.resourceType,
            resourceId: params.resourceId,
            details: params.details ?? null,
            ip: params.ip ?? null,
            userAgent: params.userAgent ?? null,
        })
        return this.auditRepository.save(entry)
    }

    async findByResource(resourceType: string, resourceId: string, limit = 50): Promise<AuditLogEntity[]> {
        return this.auditRepository.find({
            where: { resourceType, resourceId },
            order: { createdAt: 'DESC' },
            take: limit,
        })
    }

    async findByUser(userId: number, limit = 50): Promise<AuditLogEntity[]> {
        return this.auditRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
            take: limit,
        })
    }
}
