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

    @Column({ nullable: true, default: () => 'CURRENT_TIMESTAMP' })
    createdAt?: Date
}
