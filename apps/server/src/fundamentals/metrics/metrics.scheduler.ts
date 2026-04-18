import { Injectable } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'

import { docs } from '../yjs-postgresql/utils'
import { MetricsService } from './metrics.service'

@Injectable()
export class MetricsScheduler {
    constructor(private readonly metricsService: MetricsService) {}

    @Cron('* * * * *')
    updateWsMetrics() {
        this.metricsService.setActiveDocs(docs.size)
    }
}
