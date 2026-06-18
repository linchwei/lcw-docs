import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity({
    name: 'page_tag',
})
export class PageTagEntity {
    constructor(partial: Partial<PageTagEntity>) {
        Object.assign(this, partial)
    }

    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: 'varchar', length: 80 })
    pageId: string

    @Column({ type: 'varchar', length: 21 })
    tagId: string

    @Column({ type: 'timestamptz', nullable: true, default: () => 'now()' })
    createdAt?: Date
}
