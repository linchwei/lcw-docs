import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity('system_config')
export class SystemConfigEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ unique: true, length: 100 })
    key: string

    @Column({ type: 'text', nullable: true })
    value: string

    @Column({ length: 50, default: 'system' })
    group: string

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date
}
