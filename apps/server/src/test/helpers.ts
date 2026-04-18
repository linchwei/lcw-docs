import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import * as bcrypt from 'bcryptjs'
import { Repository } from 'typeorm'
import { JwtService } from '@nestjs/jwt'

import { AppModule } from '../app.module'
import { UserEntity } from '../entities/user.entity'

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
    password = 'testpass123',
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

    const { password: _, ...result } = user
    return { user: result, token }
}

export async function cleanupUsers(app: INestApplication): Promise<void> {
    const userRepository = app.get('UserEntityRepository') as Repository<UserEntity>
    await userRepository.query(`DELETE FROM "user" WHERE username LIKE 'test%'`)
}

export async function cleanupAll(app: INestApplication): Promise<void> {
    const userRepository = app.get('UserEntityRepository') as Repository<UserEntity>
    await userRepository.query(`DELETE FROM "page_tag"`)
    await userRepository.query(`DELETE FROM "tag"`)
    await userRepository.query(`DELETE FROM "comment"`)
    await userRepository.query(`DELETE FROM "share"`)
    await userRepository.query(`DELETE FROM "collaborator"`)
    await userRepository.query(`DELETE FROM "notification"`)
    await userRepository.query(`DELETE FROM "version"`)
    await userRepository.query(`DELETE FROM "folder"`)
    await userRepository.query(`DELETE FROM "page"`)
    await userRepository.query(`DELETE FROM "audit_log"`)
    await userRepository.query(`DELETE FROM "user" WHERE username LIKE 'test%'`)
}

export function generateExpiredToken(app: INestApplication): string {
    const jwtService = app.get(JwtService)
    return jwtService.sign(
        { username: 'expired', sub: 99999 },
        { expiresIn: '0s' },
    )
}

export function generateInvalidToken(): string {
    return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImhhY2tlciIsInN1YiI6OTk5OTksImlhdCI6MTAwMDAwMDAwMH0.invalid_signature'
}
