import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity({
    name: 'comment',
})
export class CommentEntity {
    constructor(partial: Partial<CommentEntity>) {
        Object.assign(this, partial)
    }

    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: 'varchar', length: 21, unique: true })
    commentId: string

    @Column({ type: 'varchar', length: 80 })
    pageId: string

    @Column({ type: 'text' })
    content: string

    @Column({ type: 'varchar', nullable: true })
    anchorText: string | null

    @Column({ type: 'varchar', nullable: true })
    anchorPos: string | null

    @Column({ type: 'varchar', nullable: true })
    parentId: string | null

    @Column({ type: 'timestamp', nullable: true })
    resolvedAt: Date | null

    @Column()
    createdBy: number

    @Column({ nullable: true, default: () => 'CURRENT_TIMESTAMP' })
    createdAt?: Date

    @Column({ type: 'timestamp', nullable: true, default: () => 'CURRENT_TIMESTAMP' })
    updatedAt?: Date
}
