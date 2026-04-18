import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'

import { UserModule } from '../user/user.module'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { JwtStrategy } from './jwt.strategy'
import { LocalStrategy } from './local.strategy'

@Module({
    imports: [
        PassportModule,
        ConfigModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                const isProd = process.env.NODE_ENV === 'production'
                const secret = configService.get<string>('JWT_SECRET')
                if (isProd && !secret) {
                    throw new Error('JWT_SECRET environment variable must be set in production')
                }
                if (!secret) {
                    console.warn('WARNING: JWT_SECRET is not set. Using default secret. This is insecure for production!')
                }
                return {
                    secret: secret || 'dev-secret-key-change-in-production',
                    signOptions: { expiresIn: '24h' },
                }
            },
        }),
        UserModule,
    ],
    controllers: [AuthController],
    providers: [AuthService, LocalStrategy, JwtStrategy],
    exports: [AuthService],
})
export class AuthModule {}
