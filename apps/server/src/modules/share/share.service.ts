import { GoneException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import * as bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'
import { PostgresqlPersistence } from 'y-postgresql'
import { Repository } from 'typeorm'

import { PageEntity } from '../../entities/page.entity'
import { ShareEntity } from '../../entities/share.entity'

@Injectable()
export class ShareService {
    constructor(
        @InjectRepository(ShareEntity)
        private readonly shareRepository: Repository<ShareEntity>,
        @InjectRepository(PageEntity)
        private readonly pageRepository: Repository<PageEntity>,
        @Inject('YJS_POSTGRESQL_ADAPTER') private readonly yjsPostgresqlAdapter: PostgresqlPersistence
    ) {}

    async create(params: { pageId: string; permission: string; password?: string; expiresAt?: Date; userId: number }) {
        const share = new ShareEntity({
            pageId: params.pageId,
            permission: params.permission || 'view',
            expiresAt: params.expiresAt || null,
            createdBy: params.userId,
        })
        share.shareId = 'share' + nanoid(8)

        if (params.password) {
            share.password = await bcrypt.hash(params.password, 10)
        }

        const page = await this.pageRepository.findOne({
            where: { pageId: params.pageId, user: { id: params.userId }, isDeleted: false },
        })
        if (!page) {
            throw new NotFoundException('page not found')
        }

        return this.shareRepository.save(share)
    }

    async findByPageId(params: { pageId: string; userId: number }) {
        const page = await this.pageRepository.findOne({
            where: { pageId: params.pageId, user: { id: params.userId }, isDeleted: false },
        })
        if (!page) {
            throw new NotFoundException('page not found')
        }

        const shares = await this.shareRepository.find({
            where: { pageId: params.pageId },
        })

        return shares.map(({ password, ...rest }) => rest)
    }

    async delete(params: { shareId: string; userId: number }) {
        const share = await this.shareRepository.findOne({
            where: { shareId: params.shareId },
        })
        if (!share) {
            throw new NotFoundException('share not found')
        }

        const page = await this.pageRepository.findOne({
            where: { pageId: share.pageId, user: { id: params.userId } },
        })
        if (!page) {
            throw new NotFoundException('page not found')
        }

        await this.shareRepository.remove(share)
        return { success: true }
    }

    async access(params: { shareId: string; password?: string }) {
        const share = await this.shareRepository.findOne({
            where: { shareId: params.shareId },
        })
        if (!share) {
            throw new NotFoundException('share not found')
        }

        if (share.expiresAt && new Date() > share.expiresAt) {
            throw new GoneException('share link has expired')
        }

        if (share.password) {
            if (!params.password) {
                throw new UnauthorizedException('password is required')
            }
            const isPasswordValid = await bcrypt.compare(params.password, share.password)
            if (!isPasswordValid) {
                throw new UnauthorizedException('invalid password')
            }
        }

        const { password, ...result } = share
        return result
    }

    async getPageContent(params: { shareId: string; password?: string }) {
        const shareInfo = await this.access(params)

        const doc = await this.yjsPostgresqlAdapter.getYDoc(`doc-yjs-${shareInfo.pageId}`)
        const pageDoc = doc.getXmlFragment(`document-store-${shareInfo.pageId}`).toJSON()

        return pageDoc
    }
}
