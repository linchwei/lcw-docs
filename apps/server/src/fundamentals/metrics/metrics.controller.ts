import { Controller, Get, Header } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'

import { MetricsService } from './metrics.service'

@ApiTags('监控指标')
@Controller('metrics')
export class MetricsController {
    constructor(private readonly metricsService: MetricsService) {}

    @ApiOperation({ summary: '获取 Prometheus 指标', description: '返回 Prometheus 格式的应用运行指标数据' })
    @Get()
    @Header('Content-Type', 'text/plain')
    getMetrics() {
        return this.metricsService.getMetrics()
    }
}
