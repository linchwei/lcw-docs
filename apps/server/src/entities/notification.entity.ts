import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'

import { UserEntity } from './user.entity'

@Entity({
    name: 'notification',
})
export class NotificationEntity {
    constructor(partial: Partial<NotificationEntity>) {
        Object.assign(this, partial)
    }

    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: 'varchar', length: 21, unique: true })
    notificationId: string

    @Column({ type: 'varchar', length: 20 })
    type: string

    @Column()
    fromUserId: number

    @Column()
    toUserId: number

    @Column({ type: 'varchar', length: 80 })
    pageId: string

    @Column({ type: 'varchar', length: 255, nullable: true })
    content: string | null

    @Column({ type: 'boolean', default: false })
    read: boolean

    @ManyToOne('UserEntity')
    fromUser: UserEntity

    @ManyToOne('UserEntity')
    toUser: UserEntity

    @Column({ nullable: true, default: () => 'CURRENT_TIMESTAMP' })
    createdAt?: Date
}
