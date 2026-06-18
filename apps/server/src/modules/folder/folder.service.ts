import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { nanoid } from 'nanoid'
import { DataSource, In, Repository } from 'typeorm'

import { FolderEntity } from '../../entities/folder.entity'
import { PageEntity } from '../../entities/page.entity'
import { UserEntity } from '../../entities/user.entity'

@Injectable()
export class FolderService {
    constructor(
        @InjectRepository(FolderEntity)
        private readonly folderRepository: Repository<FolderEntity>,
        private readonly dataSource: DataSource
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
        // 使用事务保证原子性（查询和删除在同一事务中）
        await this.dataSource.transaction(async manager => {
            const pageRepo = manager.getRepository(PageEntity)
            const folderRepo = manager.getRepository(FolderEntity)

            const folder = await folderRepo.findOne({
                where: { folderId: params.folderId, user: { id: params.userId } },
            })
            if (!folder) {
                throw new NotFoundException('folder not found')
            }

            // 递归收集所有后代文件夹 ID
            const allDescendantIds = await this.collectDescendantFolderIds(folder.folderId, params.userId, folderRepo)

            // 将当前文件夹及所有后代文件夹中的页面移回根级
            const allFolderIds = [folder.folderId, ...allDescendantIds]
            await pageRepo.update({ folderId: In(allFolderIds), user: { id: params.userId } }, { folderId: null })

            // 批量删除所有后代文件夹
            if (allDescendantIds.length > 0) {
                await folderRepo.delete({
                    folderId: In(allDescendantIds),
                    user: { id: params.userId },
                })
            }

            // 删除当前文件夹
            await folderRepo.remove(folder)
        })

        return { success: true }
    }

    /**
     * 收集指定文件夹的所有后代文件夹 ID（单次查询 + 内存遍历，避免 N+1）
     */
    private async collectDescendantFolderIds(parentId: string, userId: number, folderRepo: Repository<FolderEntity>): Promise<string[]> {
        // 一次查询用户所有文件夹
        const allFolders = await folderRepo.find({
            where: { user: { id: userId } },
            select: ['folderId', 'parentId'],
        })

        // 构建 parentId -> children 映射
        const childrenMap = new Map<string, string[]>()
        for (const f of allFolders) {
            const key = f.parentId || ''
            const list = childrenMap.get(key) || []
            list.push(f.folderId)
            childrenMap.set(key, list)
        }

        // BFS 遍历收集后代
        const result: string[] = []
        const queue = [parentId]
        while (queue.length > 0) {
            const currentParentId = queue.shift()!
            const children = childrenMap.get(currentParentId) || []
            for (const childId of children) {
                result.push(childId)
                queue.push(childId)
            }
        }

        return result
    }
}
