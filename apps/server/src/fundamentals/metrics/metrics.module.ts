import { Global, Module } from '@nestjs/common'

import { MetricsController } from './metrics.controller'
import { MetricsScheduler } from './metrics.scheduler'
import { MetricsService } from './metrics.service'

@Global()
@Module({
    controllers: [MetricsController],
    providers: [MetricsService, MetricsScheduler],
    exports: [MetricsService],
})
export class MetricsModule {}
