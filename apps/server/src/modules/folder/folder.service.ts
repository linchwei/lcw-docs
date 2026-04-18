import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { nanoid } from 'nanoid'
import { Repository } from 'typeorm'

import { FolderEntity } from '../../entities/folder.entity'
import { UserEntity } from '../../entities/user.entity'

@Injectable()
export class FolderService {
    constructor(
        @InjectRepository(FolderEntity)
        private readonly folderRepository: Repository<FolderEntity>
    ) {}

    async create(params: { name: string; parentId?: string; userId: number }) {
        const user = new UserEntity()
        user.id = params.userId

        const folder = new FolderEntity({
            name: params.name,
            parentId: params.parentId || null,
            user,
        })
        folder.folderId = 'fld' + nanoid(6)

        return this.folderRepository.save(folder)
    }

    async list(params: { userId: number }) {
        return this.folderRepository.find({
            where: { user: { id: params.userId } },
            order: { sortOrder: 'ASC', createdAt: 'ASC' },
        })
    }

    async update(params: { folderId: string; name?: string; parentId?: string | null; sortOrder?: number; userId: number }) {
        const folder = await this.folderRepository.findOne({
            where: { folderId: params.folderId, user: { id: params.userId } },
        })
        if (!folder) {
            throw new NotFoundException('folder not found')
        }

        if (params.name !== undefined) folder.name = params.name
        if (params.parentId !== undefined) folder.parentId = params.parentId
        if (params.sortOrder !== undefined) folder.sortOrder = params.sortOrder
        folder.updatedAt = new Date()

        return this.folderRepository.save(folder)
    }

    async delete(params: { folderId: string; userId: number }) {
        const folder = await this.folderRepository.findOne({
            where: { folderId: params.folderId, user: { id: params.userId } },
        })
        if (!folder) {
            throw new NotFoundException('folder not found')
        }

        await this.folderRepository.delete({ parentId: folder.folderId })
        await this.folderRepository.remove(folder)
        return { success: true }
    }
}
