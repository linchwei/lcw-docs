import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity('template_categories')
export class TemplateCategoryEntity {
    constructor(partial: Partial<TemplateCategoryEntity>) {
        Object.assign(this, partial)
    }

    @PrimaryGeneratedColumn()
    id: number

    @Column({ unique: true, length: 50 })
    categoryId: string

    @Column({ length: 100 })
    name: string

    @Column({ length: 10 })
    emoji: string

    @Column({ default: 0 })
    sortOrder: number

    @Column({ default: true })
    isActive: boolean

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date
}
