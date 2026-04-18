import { Inject, Injectable, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import { WINSTON_MODULE_PROVIDER } from 'nest-winston'
import { Logger as WinstonLogger } from 'winston'

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger
    ) {}

    use(req: Request, res: Response, next: NextFunction) {
        const { method, originalUrl, ip } = req
        const userAgent = req.get('user-agent') || ''
        const startTime = Date.now()

        res.on('finish', () => {
            const { statusCode } = res
            const duration = Date.now() - startTime
            this.logger.info('HTTP Request', {
                method,
                url: originalUrl,
                statusCode,
                duration,
                ip,
                userAgent,
            })
        })

        next()
    }
}
