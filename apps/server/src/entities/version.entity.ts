import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity({
    name: 'version',
})
export class VersionEntity {
    constructor(partial: Partial<VersionEntity>) {
        Object.assign(this, partial)
    }

    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: 'varchar', length: 21, unique: true })
    versionId: string

    @Column({ type: 'varchar', length: 80 })
    pageId: string

    @Column({ type: 'text' })
    snapshot: string

    @Column({ type: 'text', nullable: true })
    stateUpdate: string | null

    @Column({ type: 'varchar', length: 255, nullable: true })
    description: string | null

    @Column({ type: 'varchar', length: 20, default: 'manual' })
    source: string

    @Column()
    createdBy: number

    @Column({ nullable: true, default: () => 'CURRENT_TIMESTAMP' })
    createdAt?: Date
}
