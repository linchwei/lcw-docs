import { Injectable } from '@nestjs/common'
import * as client from 'prom-client'

const register = new client.Registry()
register.setDefaultLabels({ app: 'lcw-docs-server' })
client.collectDefaultMetrics({ register })

@Injectable()
export class MetricsService {
    private readonly httpRequestsTotal = new client.Counter({
        name: 'http_requests_total',
        help: 'Total number of HTTP requests',
        labelNames: ['method', 'route', 'status_code'],
        registers: [register],
    })

    private readonly httpRequestDuration = new client.Histogram({
        name: 'http_request_duration_seconds',
        help: 'Duration of HTTP requests in seconds',
        labelNames: ['method', 'route', 'status_code'],
        buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
        registers: [register],
    })

    private readonly wsConnectionsTotal = new client.Gauge({
        name: 'ws_connections_total',
        help: 'Current WebSocket connections',
        labelNames: ['doc_id'],
        registers: [register],
    })

    private readonly activeDocsTotal = new client.Gauge({
        name: 'active_docs_total',
        help: 'Number of documents with active connections',
        registers: [register],
    })

    recordHttpRequest(method: string, route: string, statusCode: number) {
        this.httpRequestsTotal.labels(method, route, String(statusCode)).inc()
    }

    observeHttpRequestDuration(method: string, route: string, statusCode: number, durationSeconds: number) {
        this.httpRequestDuration.labels(method, route, String(statusCode)).observe(durationSeconds)
    }

    setWsConnections(docId: string, count: number) {
        this.wsConnectionsTotal.labels(docId).set(count)
    }

    setActiveDocs(count: number) {
        this.activeDocsTotal.set(count)
    }

    async getMetrics(): Promise<string> {
        return register.metrics()
    }

    getContentType(): string {
        return register.contentType
    }
}
