import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { TypeOrmModule } from '@nestjs/typeorm'
import { WinstonModule } from 'nest-winston'

import databaseConfig from './config/database'
import { MetricsMiddleware } from './fundamentals/metrics/metrics.middleware'
import { MetricsModule } from './fundamentals/metrics/metrics.module'
import { winstonConfig } from './fundamentals/common/logger/winston.config'
import { RequestLoggerMiddleware } from './fundamentals/common/middleware/request-logger.middleware'
import { YjsPostgresqlModule } from './fundamentals/yjs-postgresql/yjs-postgresql.module'
import { AiModule } from './modules/ai/ai.module'
import { ApplicationModule } from './modules/application/application.module'
import { AuditModule } from './modules/audit/audit.module'
import { AuthModule } from './modules/auth/auth.module'
import { CollaboratorModule } from './modules/collaborator/collaborator.module'
import { DocYjsModule } from './modules/doc-yjs/doc-yjs.module'
import { FolderModule } from './modules/folder/folder.module'
import { HealthModule } from './modules/health/health.module'
import { NotificationModule } from './modules/notification/notification.module'
import { PageModule } from './modules/page/page.module'
import { CommentModule } from './modules/comment/comment.module'
import { ShareModule } from './modules/share/share.module'
import { TagModule } from './modules/tag/tag.module'
import { UploadModule } from './modules/upload/upload.module'
import { UserModule } from './modules/user/user.module'
import { VersionModule } from './modules/version/version.module'
import { SyncModule } from './modules/sync/sync.module'

@Module({
    imports: [
        ConfigModule.forRoot({ load: [databaseConfig] }),
        ScheduleModule.forRoot(),
        WinstonModule.forRoot(winstonConfig),
        ThrottlerModule.forRoot([
            {
                name: 'short',
                ttl: 1000,
                limit: 3,
            },
            {
                name: 'medium',
                ttl: 10000,
                limit: 20,
            },
            {
                name: 'long',
                ttl: 60000,
                limit: 100,
            },
        ]),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (config: ConfigService) => {
                return config.get('database')
            },
            inject: [ConfigService],
        }),
        MetricsModule,
        AuthModule,
        AuditModule,
        CollaboratorModule,
        UserModule,
        ApplicationModule,
        DocYjsModule,
        FolderModule,
        HealthModule,
        NotificationModule,
        PageModule,
        CommentModule,
        ShareModule,
        TagModule,
        UploadModule,
        AiModule,
        VersionModule,
        SyncModule,
        YjsPostgresqlModule.forRoot(),
    ],
    providers: [
        {
            provide: 'APP_GUARD',
            useClass: ThrottlerGuard,
        },
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(RequestLoggerMiddleware, MetricsMiddleware)
            .exclude('health', 'metrics')
            .forRoutes('*')
    }
}
