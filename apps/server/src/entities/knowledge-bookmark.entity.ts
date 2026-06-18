/**
 * 知识书签实体
 *
 * 用于存储用户在 AI 对话过程中收藏的知识片段。
 * 每条书签关联一个页面（sourcePageId）和可选的块（sourceBlockId），
 * 记录收藏时的标题、内容、提问以及所属对话线程。
 *
 * @module entities/knowledge-bookmark
 */
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'

import { UserEntity } from './user.entity'

/**
 * 知识书签实体类
 *
 * 记录用户从 AI 对话中收藏的知识片段，
 * 支持按页面、块定位来源，并保留原始提问和对话线程信息。
 */
@Entity({
    name: 'knowledge_bookmark',
})
export class KnowledgeBookmarkEntity {
    constructor(partial: Partial<KnowledgeBookmarkEntity>) {
        Object.assign(this, partial)
    }

    /** 主键 ID */
    @PrimaryGeneratedColumn()
    id: number

    /** 所属用户 ID */
    @Column()
    userId: number

    /** 所属用户关联 */
    @ManyToOne('UserEntity')
    user: UserEntity

    /** 来源页面 ID */
    @Column({ type: 'varchar', length: 21 })
    sourcePageId: string

    /** 来源块 ID（可选） */
    @Column({ type: 'varchar', length: 21, nullable: true })
    sourceBlockId: string | null

    /** 书签标题 */
    @Column({ type: 'varchar', length: 200 })
    title: string

    /** 书签内容 */
    @Column({ type: 'text' })
    content: string

    /** 用户原始提问（可选） */
    @Column({ type: 'text', nullable: true })
    question: string | null

    /** 所属对话线程 ID（可选） */
    @Column({ type: 'varchar', length: 100, nullable: true })
    threadId: string | null

    /** 创建时间 */
    @CreateDateColumn({ name: 'createdAt' })
    createdAt: Date
}
