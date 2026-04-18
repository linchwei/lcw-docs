import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'

import { UserEntity } from './user.entity'

@Entity({
    name: 'page',
})
export class PageEntity {
    constructor(partial: Partial<PageEntity>) {
        Object.assign(this, partial)
    }

    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: 'varchar', length: 80 })
    pageId: string

    @Column({ type: 'varchar', length: 4, default: '📄' })
    emoji: string

    @Column({ type: 'varchar', length: 255, default: '' })
    title: string

    @Column({ type: 'text', nullable: true })
    description: string

    @Column({ type: 'boolean', default: false })
    isFavorite: boolean

    @Column({ type: 'boolean', default: false })
    isDeleted: boolean

    @Column({ type: 'varchar', length: 21, nullable: true })
    folderId: string | null

    @Column({ type: 'varchar', length: 500, nullable: true })
    coverImage: string | null

    @Column({ type: 'timestamp', nullable: true })
    deletedAt: Date | null

    @Column({ nullable: true, default: () => 'CURRENT_TIMESTAMP' })
    createdAt?: Date

    @Column({ type: 'timestamp', nullable: true, default: () => 'CURRENT_TIMESTAMP' })
    updatedAt?: Date

    @ManyToOne('UserEntity', 'applications')
    user: UserEntity
}
