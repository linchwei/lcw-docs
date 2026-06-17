import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity('templates')
export class TemplateEntity {
    constructor(partial: Partial<TemplateEntity>) {
        Object.assign(this, partial)
    }

    @PrimaryGeneratedColumn()
    id: number

    @Column({ unique: true, length: 50 })
    templateId: string

    @Column({ length: 100 })
    name: string

    @Column({ length: 50 })
    categoryId: string

    @Column({ length: 200 })
    description: string

    @Column({ length: 10 })
    emoji: string

    @Column({ type: 'text' })
    content: string

    @Column({ default: 0 })
    sortOrder: number

    @Column({ default: true })
    isActive: boolean

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date
}
