import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity({
    name: 'share',
})
export class ShareEntity {
    constructor(partial: Partial<ShareEntity>) {
        Object.assign(this, partial)
    }

    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: 'varchar', length: 21, unique: true })
    shareId: string

    @Column({ type: 'varchar', length: 80 })
    pageId: string

    @Column({ type: 'varchar', length: 20, default: 'view' })
    permission: string

    @Column({ type: 'varchar', nullable: true })
    password: string

    @Column({ type: 'timestamp', nullable: true })
    expiresAt: Date | null

    @Column()
    createdBy: number

    @Column({ nullable: true, default: () => 'CURRENT_TIMESTAMP' })
    createdAt?: Date

    @Column({ type: 'timestamp', nullable: true, default: () => 'CURRENT_TIMESTAMP' })
    updatedAt?: Date
}
