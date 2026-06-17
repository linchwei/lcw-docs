import { INestApplication, ValidationPipe } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import * as bcrypt from 'bcryptjs'
import { DataSource, Like, Repository } from 'typeorm'

import { AppModule } from '../app.module'
import { AuditLogEntity } from '../entities/audit-log.entity'
import { CollaboratorEntity } from '../entities/collaborator.entity'
import { CommentEntity } from '../entities/comment.entity'
import { FolderEntity } from '../entities/folder.entity'
import { NotificationEntity } from '../entities/notification.entity'
import { PageEntity } from '../entities/page.entity'
import { PageTagEntity } from '../entities/page-tag.entity'
import { ShareEntity } from '../entities/share.entity'
import { TagEntity } from '../entities/tag.entity'
import { UserEntity } from '../entities/user.entity'
import { VersionEntity } from '../entities/version.entity'

let app: INestApplication

export async function createTestApp(): Promise<INestApplication> {
    const moduleFixture = await Test.createTestingModule({
        imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.setGlobalPrefix('api')
    app.useGlobalPipes(new ValidationPipe({ transform: true }))
    await app.init()
    return app
}

export async function closeTestApp(): Promise<void> {
    if (app) {
        await app.close()
    }
}

export async function createTestUser(
    app: INestApplication,
    username = 'testuser',
    password = 'testpass123'
): Promise<{ user: Partial<UserEntity>; token: string }> {
    const userRepository = app.get('UserEntityRepository') as Repository<UserEntity>
    const hashedPassword = await bcrypt.hash(password, 10)
    const user = userRepository.create({
        username,
        password: hashedPassword,
    })
    await userRepository.save(user)

    const jwtService = app.get(JwtService)
    const token = jwtService.sign({ username: user.username, sub: user.id })

    const { password: __, ...result } = user
    return { user: result, token }
}

export async function cleanupUsers(app: INestApplication): Promise<void> {
    const dataSource = app.get(DataSource)
    await dataSource.getRepository(UserEntity).delete({ username: Like('test%') })
}

export async function cleanupAll(app: INestApplication): Promise<void> {
    const dataSource = app.get(DataSource)

    // 按外键依赖顺序清理
    const entities = [
        PageTagEntity,
        TagEntity,
        CommentEntity,
        ShareEntity,
        CollaboratorEntity,
        NotificationEntity,
        VersionEntity,
        FolderEntity,
        PageEntity,
        AuditLogEntity,
    ]
    for (const entity of entities) {
        await dataSource.getRepository(entity).delete({})
    }

    // 清理测试用户
    await dataSource.getRepository(UserEntity).delete({ username: Like('test%') })
}

export function generateExpiredToken(app: INestApplication): string {
    const jwtService = app.get(JwtService)
    return jwtService.sign({ username: 'expired', sub: 99999 }, { expiresIn: '0s' })
}

export function generateInvalidToken(): string {
    return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImhhY2tlciIsInN1YiI6OTk5OTksImlhdCI6MTAwMDAwMDAwMH0.invalid_signature'
}
