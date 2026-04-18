import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { json } from 'express'
import helmet from 'helmet'
import { join } from 'path'

import { Logger, ValidationPipe } from '@nestjs/common'

import { AppModule } from './app.module'
import { AllExceptionsFilter } from './fundamentals/common/filters/all-exceptions.filter'
import { initSentry } from './fundamentals/common/sentry/sentry.config'

async function bootstrap() {
    initSentry()

    const app = await NestFactory.create<NestExpressApplication>(AppModule)
    const logger = new Logger('Bootstrap')

    app.use(json({ limit: '1mb' }))
    app.use(
        helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net"],
                    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                    fontSrc: ["'self'", "https://fonts.gstatic.com"],
                    imgSrc: ["'self'", 'data:', 'blob:'],
                },
            },
        }),
    )

    app.enableCors({
        origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:5174'],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        credentials: true,
    })

    app.useGlobalFilters(new AllExceptionsFilter())

    app.useGlobalPipes(new ValidationPipe({ transform: true }))

    app.setGlobalPrefix('api')

    app.useStaticAssets(join(__dirname, '..', 'uploads'), { prefix: '/uploads/' })

    const swaggerOptions = new DocumentBuilder()
        .setTitle('LCW-Docs API 文档')
        .setDescription('LCW-Docs 企业级文档编辑器 RESTful API 文档，包含认证、页面管理、标签、分享、协作、评论、版本历史等全部接口')
        .setVersion('1.0')
        .addBearerAuth(undefined, 'jwt')
        .addTag('认证', '登录、登出、获取当前用户')
        .addTag('用户', '用户注册')
        .addTag('页面', '文档页面的增删改查、搜索、收藏、回收站')
        .addTag('标签', '标签管理与页面标签关联')
        .addTag('分享', '文档分享与访问')
        .addTag('协作者', '文档协作权限管理')
        .addTag('评论', '文档评论与回复')
        .addTag('文件夹', '文件夹管理')
        .addTag('AI 助手', 'AI 对话功能')
        .addTag('文件上传', '文件与图片上传')
        .addTag('通知', '消息通知管理')
        .addTag('版本历史', '文档版本管理与回滚')
        .addTag('审计日志', '操作审计记录')
        .addTag('应用', '应用管理')
        .addTag('文档同步', 'Yjs 文档操作同步')
        .addTag('健康检查', '服务健康状态')
        .addTag('监控指标', 'Prometheus 指标')
        .build()
    const document = SwaggerModule.createDocument(app, swaggerOptions)
    SwaggerModule.setup('doc', app, document)

    await app.listen(8082)
    logger.log('Server is running on http://localhost:8082')

    app.enableShutdownHooks()
}
bootstrap()
