import { Controller, Get } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator, MemoryHealthIndicator } from '@nestjs/terminus'

@ApiTags('健康检查')
@Controller('health')
export class HealthController {
    constructor(
        private health: HealthCheckService,
        private db: TypeOrmHealthIndicator,
        private memory: MemoryHealthIndicator,
    ) {}

    @ApiOperation({ summary: '健康检查', description: '检查数据库连接和内存状态' })
    @Get()
    @HealthCheck()
    check() {
        return this.health.check([
            () => this.db.pingCheck('database'),
            () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),
            () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024),
        ])
    }

    @ApiOperation({ summary: '就绪检查', description: '检查服务是否就绪（数据库连接正常）' })
    @Get('ready')
    @HealthCheck()
    readiness() {
        return this.health.check([() => this.db.pingCheck('database')])
    }

    @ApiOperation({ summary: '存活检查', description: '检查服务是否存活' })
    @Get('live')
    @HealthCheck()
    liveness() {
        return this.health.check([])
    }
}
