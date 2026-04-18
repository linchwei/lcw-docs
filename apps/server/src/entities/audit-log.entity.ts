import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'

import { UserEntity } from './user.entity'

@Entity('audit_log')
export class AuditLogEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ name: 'audit_id', type: 'varchar', length: 21, unique: true })
    auditId: string

    @Column({ name: 'user_id', type: 'integer', nullable: true })
    userId: number | null

    @Column({ type: 'varchar', length: 50 })
    action: string

    @Column({ name: 'resource_type', type: 'varchar', length: 50 })
    resourceType: string

    @Column({ name: 'resource_id', type: 'varchar', length: 80 })
    resourceId: string

    @Column({ type: 'jsonb', nullable: true })
    details: Record<string, any> | null

    @Column({ type: 'varchar', length: 45, nullable: true })
    ip: string | null

    @Column({ name: 'user_agent', type: 'varchar', length: 500, nullable: true })
    userAgent: string | null

    @ManyToOne(() => UserEntity, { eager: true })
    user: UserEntity

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date
}
