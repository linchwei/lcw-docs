import { Module } from '@nestjs/common'
import { TerminusModule } from '@nestjs/terminus'

import { HealthController } from './health.controller'
import { DatabaseHealthIndicator } from './indicators/database.health'
import { MemoryHealthIndicator } from './indicators/memory.health'

@Module({
    imports: [TerminusModule],
    controllers: [HealthController],
    providers: [DatabaseHealthIndicator, MemoryHealthIndicator],
})
export class HealthModule {}
