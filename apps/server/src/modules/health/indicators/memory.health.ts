import { Injectable } from '@nestjs/common'
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus'

@Injectable()
export class MemoryHealthIndicator extends HealthIndicator {
    checkHeap(key: string, maxBytes: number): HealthIndicatorResult {
        const memoryUsage = process.memoryUsage()
        const isHealthy = memoryUsage.heapUsed < maxBytes
        return this.getStatus(key, isHealthy, {
            used: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
            limit: Math.round(maxBytes / 1024 / 1024) + 'MB',
        })
    }

    checkRSS(key: string, maxBytes: number): HealthIndicatorResult {
        const memoryUsage = process.memoryUsage()
        const isHealthy = memoryUsage.rss < maxBytes
        return this.getStatus(key, isHealthy, {
            used: Math.round(memoryUsage.rss / 1024 / 1024) + 'MB',
            limit: Math.round(maxBytes / 1024 / 1024) + 'MB',
        })
    }
}
