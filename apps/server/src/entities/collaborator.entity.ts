import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'

import { UserEntity } from './user.entity'

@Entity({
    name: 'collaborator',
})
export class CollaboratorEntity {
    constructor(partial: Partial<CollaboratorEntity>) {
        Object.assign(this, partial)
    }

    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: 'varchar', length: 21, unique: true })
    collaboratorId: string

    @Column()
    userId: number

    @Column({ type: 'varchar', length: 80 })
    pageId: string

    @Column({ type: 'varchar', length: 20, default: 'editor' })
    role: string

    @ManyToOne('UserEntity')
    user: UserEntity

    @Column({ nullable: true, default: () => 'CURRENT_TIMESTAMP' })
    createdAt?: Date
}
