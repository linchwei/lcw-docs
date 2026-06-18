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

    @Column({ type: 'timestamptz', nullable: true })
    resolvedAt: Date | null

    @Column()
    createdBy: number

    @Column({ type: 'timestamptz', nullable: true, default: () => 'now()' })
    createdAt?: Date

    @Column({ type: 'timestamptz', nullable: true, default: () => 'now()' })
    updatedAt?: Date
}
