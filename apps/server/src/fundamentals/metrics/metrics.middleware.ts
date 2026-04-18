import { Injectable, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'

import { MetricsService } from './metrics.service'

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
    constructor(private readonly metricsService: MetricsService) {}

    use(req: Request, res: Response, next: NextFunction) {
        const start = process.hrtime.bigint()

        res.on('finish', () => {
            const durationNs = Number(process.hrtime.bigint() - start)
            const durationSeconds = durationNs / 1e9
            const route = req.route?.path || 'unknown'
            this.metricsService.recordHttpRequest(req.method, route, res.statusCode)
            this.metricsService.observeHttpRequestDuration(req.method, route, res.statusCode, durationSeconds)
        })

        next()
    }
}
