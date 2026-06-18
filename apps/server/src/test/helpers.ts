import { CanActivate, ExecutionContext, INestApplication, Injectable, ValidationPipe } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import * as bcrypt from 'bcryptjs'
import { DataSource, Like, Repository } from 'typeorm'

import { AppModule } from '../app.module'
import { UserEntity } from '../entities/user.entity'

let app: INestApplication

@Injectable()
class MockThrottlerGuard implements CanActivate {
    canActivate(_context: ExecutionContext): boolean {
        return true
    }
}

export async function createTestApp(): Promise<INestApplication> {
    const moduleFixture = await Test.createTestingModule({
        imports: [AppModule],
    })
        .overrideProvider(APP_GUARD)
        .useClass(MockThrottlerGuard)
        .compile()

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

    // 安全检查：确保连接的是测试数据库，防止误清空开发/生产数据
    const currentDatabase = dataSource.options.database as string
    if (!currentDatabase || !currentDatabase.includes('test')) {
        throw new Error(
            `❌ 安全检查失败：当前连接的数据库 "${currentDatabase}" 不是测试数据库！` +
                `测试只能操作数据库名包含 "test" 的数据库，请检查 NODE_ENV 是否设置为 "test"。`
        )
    }

    // 按外键依赖顺序清理，使用 TRUNCATE CASCADE 避免外键约束问题
    try {
        await dataSource.query(`
            TRUNCATE TABLE
                knowledge_bookmark,
                page_tag,
                tag,
                comment,
                share,
                collaborator,
                notification,
                version,
                folder,
                page,
                audit_log
            CASCADE
        `)
    } catch {
        // 如果某些表不存在则忽略
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
