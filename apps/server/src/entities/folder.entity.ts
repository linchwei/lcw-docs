import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'

import { UserEntity } from './user.entity'

@Entity({
    name: 'folder',
})
export class FolderEntity {
    constructor(partial: Partial<FolderEntity>) {
        Object.assign(this, partial)
    }

    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: 'varchar', length: 21, unique: true })
    folderId: string

    @Column({ type: 'varchar', length: 255 })
    name: string

    @Column({ type: 'varchar', length: 21, nullable: true })
    parentId: string | null

    @Column({ type: 'int', default: 0 })
    sortOrder: number

    @ManyToOne('UserEntity', 'folders')
    user: UserEntity

    @Column({ nullable: true, default: () => 'CURRENT_TIMESTAMP' })
    createdAt?: Date

    @Column({ type: 'timestamp', nullable: true, default: () => 'CURRENT_TIMESTAMP' })
    updatedAt?: Date
}
