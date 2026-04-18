# 服务端实时监控集成计划

## 现状评估

| 维度 | 当前状态 | 评级 |
|------|---------|------|
| 健康检查 | 仅基础 DB 检查，无 Terminus | ★☆☆☆☆ |
| 日志 | 仅 NestJS 内置 Logger，无结构化 | ★☆☆☆☆ |
| 指标收集 | 完全没有 | ☆☆☆☆☆ |
| 错误追踪 | 仅 500+ 控制台输出 | ★☆☆☆☆ |
| 性能监控 | 完全没有 | ☆☆☆☆☆ |
| 进程管理 | PM2 集群模式（有但无远程监控） | ★★★☆☆ |

---

## 实施方案

### 1. 结构化日志 — Winston + NestJS Logger

**目标**：JSON 格式日志、按级别输出、日志文件轮转

#### 1.1 安装依赖

```bash
pnpm add winston nest-winston
```

#### 1.2 创建 Winston 配置

**新建**: `apps/server/src/fundamentals/common/logger/winston.config.ts`

```typescript
import { utilities as nestWinstonModuleUtilities } from 'nest-winston'
import * as winston from 'winston'

const logFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
)

const consoleFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.ms(),
    nestWinstonModuleUtilities.format.nestLike('LCW-Docs', {
        colors: true,
        prettyPrint: true,
    }),
)

export const winstonConfig: winston.LoggerOptions = {
    transports: [
        new winston.transports.Console({
            format: process.env.NODE_ENV === 'production' ? logFormat : consoleFormat,
        }),
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            format: logFormat,
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: 5,
        }),
        new winston.transports.File({
            filename: 'logs/combined.log',
            format: logFormat,
            maxsize: 10 * 1024 * 1024,
            maxFiles: 10,
        }),
    ],
}
```

#### 1.3 集成到 AppModule

**修改**: `apps/server/src/app.module.ts`

```typescript
import { WinstonModule } from 'nest-winston'
import { winstonConfig } from './fundamentals/common/logger/winston.config'

@Module({
    imports: [
        // ... 其他模块
        WinstonModule.forRoot(winstonConfig),
    ],
})
```

#### 1.4 添加 HTTP 请求日志中间件

**新建**: `apps/server/src/fundamentals/common/middleware/request-logger.middleware.ts`

```typescript
import { Inject, Injectable, Logger, NestMiddleware } from '@nestjs/common'
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
```

#### 1.5 注册中间件

**修改**: `apps/server/src/app.module.ts` 添加 `configure()` 方法

```typescript
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(RequestLoggerMiddleware)
            .exclude('health')
            .forRoutes('*')
    }
}
```

---

### 2. 健康检查增强 — @nestjs/terminus

**目标**：完整健康检查，支持 Kubernetes 探针、数据库/内存/磁盘检查

#### 2.1 安装依赖

```bash
pnpm add @nestjs/terminus
```

#### 2.2 重写 HealthModule

**修改**: `apps/server/src/modules/health/health.module.ts`

```typescript
import { Module } from '@nestjs/common'
import { TerminusModule } from '@nestjs/terminus'
import { TypeOrmModule } from '@nestjs/typeorm'

import { HealthController } from './health.controller'
import { DatabaseHealthIndicator } from './indicators/database.health'
import { MemoryHealthIndicator } from './indicators/memory.health'

@Module({
    imports: [TerminusModule, TypeOrmModule.forFeature([])],
    controllers: [HealthController],
    providers: [DatabaseHealthIndicator, MemoryHealthIndicator],
})
export class HealthModule {}
```

#### 2.3 重写 HealthController

**修改**: `apps/server/src/modules/health/health.controller.ts`

```typescript
import { Controller, Get } from '@nestjs/common'
import { HealthCheck, HealthCheckService } from '@nestjs/terminus'

import { DatabaseHealthIndicator } from './indicators/database.health'
import { MemoryHealthIndicator } from './indicators/memory.health'

@Controller('health')
export class HealthController {
    constructor(
        private health: HealthCheckService,
        private db: DatabaseHealthIndicator,
        private memory: MemoryHealthIndicator,
    ) {}

    @Get()
    @HealthCheck()
    check() {
        return this.health.check([
            () => this.db.pingCheck('database'),
            () => this.memory.checkHeap('memory_heap', 512 * 1024 * 1024),
            () => this.memory.checkRSS('memory_rss', 512 * 1024 * 1024),
        ])
    }

    @Get('ready')
    @HealthCheck()
    readiness() {
        return this.health.check([
            () => this.db.pingCheck('database'),
        ])
    }

    @Get('live')
    @HealthCheck()
    liveness() {
        return this.health.check([])
    }
}
```

#### 2.4 创建健康指标

**新建**: `apps/server/src/modules/health/indicators/database.health.ts`

```typescript
import { Injectable } from '@nestjs/common'
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus'
import { DataSource } from 'typeorm'

@Injectable()
export class DatabaseHealthIndicator extends HealthIndicator {
    constructor(private readonly dataSource: DataSource) {
        super()
    }

    async pingCheck(key: string): Promise<HealthIndicatorResult> {
        try {
            await this.dataSource.query('SELECT 1')
            return this.getStatus(key, true)
        } catch (error) {
            throw new HealthCheckError(
                'Database check failed',
                this.getStatus(key, false, { error: error.message }),
            )
        }
    }
}
```

**新建**: `apps/server/src/modules/health/indicators/memory.health.ts`

```typescript
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
```

---

### 3. Prometheus 指标收集

**目标**：暴露 /metrics 端点，收集 HTTP 请求指标、自定义业务指标

#### 3.1 安装依赖

```bash
pnpm add prom-client
```

#### 3.2 创建 MetricsModule

**新建**: `apps/server/src/fundamentals/metrics/metrics.module.ts`

```typescript
import { Global, Module } from '@nestjs/common'

import { MetricsService } from './metrics.service'

@Global()
@Module({
    providers: [MetricsService],
    exports: [MetricsService],
})
export class MetricsModule {}
```

#### 3.3 创建 MetricsService

**新建**: `apps/server/src/fundamentals/metrics/metrics.service.ts`

```typescript
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
```

#### 3.4 创建 MetricsController

**新建**: `apps/server/src/fundamentals/metrics/metrics.controller.ts`

```typescript
import { Controller, Get, Header, UseGuards } from '@nestjs/common'

import { MetricsService } from './metrics.service'

@Controller('metrics')
export class MetricsController {
    constructor(private readonly metricsService: MetricsService) {}

    @Get()
    @Header('Content-Type', 'text/plain')
    async getMetrics() {
        return this.metricsService.getMetrics()
    }
}
```

#### 3.5 创建 Metrics 中间件（自动收集 HTTP 指标）

**新建**: `apps/server/src/fundamentals/metrics/metrics.middleware.ts`

```typescript
import { Inject, Injectable, NestMiddleware } from '@nestjs/common'
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
            const route = req.route?.path || req.originalUrl
            this.metricsService.recordHttpRequest(req.method, route, res.statusCode)
            this.metricsService.observeHttpRequestDuration(req.method, route, res.statusCode, durationSeconds)
        })

        next()
    }
}
```

#### 3.6 注册到 AppModule

```typescript
imports: [
    // ...
    MetricsModule,
],
```

中间件注册：
```typescript
consumer
    .apply(MetricsMiddleware)
    .exclude('health', 'metrics')
    .forRoutes('*')
```

---

### 4. 错误追踪 — Sentry

**目标**：自动上报错误到 Sentry，含上下文信息

#### 4.1 安装依赖

```bash
pnpm add @sentry/node
```

#### 4.2 创建 Sentry 初始化

**新建**: `apps/server/src/fundamentals/common/sentry/sentry.config.ts`

```typescript
import * as Sentry from '@sentry/node'

export function initSentry() {
    const dsn = process.env.SENTRY_DSN
    if (!dsn) return

    Sentry.init({
        dsn,
        environment: process.env.NODE_ENV || 'development',
        tracesSampleRate: 1.0,
        profilesSampleRate: 1.0,
        integrations: [
            Sentry.httpIntegration(),
            Sentry.expressIntegration(),
        ],
    })
}
```

#### 4.3 在 main.ts 中初始化

**修改**: `apps/server/src/main.ts`

在 `bootstrap()` 函数最开头添加：

```typescript
import { initSentry } from './fundamentals/common/sentry/sentry.config'

async function bootstrap() {
    initSentry()
    // ... 其余不变
}
```

#### 4.4 创建 Sentry 全局过滤器

**新建**: `apps/server/src/fundamentals/common/sentry/sentry.filter.ts`

```typescript
import { Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common'
import { BaseExceptionFilter } from '@nestjs/core'
import * as Sentry from '@sentry/node'

@Catch()
export class SentryFilter extends BaseExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        if (exception instanceof Error) {
            Sentry.withScope((scope) => {
                const ctx = host.switchToHttp()
                const request = ctx.getRequest()
                scope.setTag('path', request.url)
                scope.setExtra('method', request.method)
                scope.setUser({ id: request.user?.id })
                Sentry.captureException(exception)
            })
        }

        super.catch(exception, host)
    }
}
```

#### 4.5 更新 .env.example

添加：
```
# Sentry (可选，错误追踪)
SENTRY_DSN=
```

---

### 5. WebSocket 连接监控

**目标**：实时监控 WebSocket 连接数、活跃文档数

#### 5.1 在 doc-yjs.gateway.ts 中集成 MetricsService

**修改**: `apps/server/src/modules/doc-yjs/doc-yjs.gateway.ts`

在连接建立和断开时更新 Prometheus 指标：

```typescript
import { MetricsService } from '../../fundamentals/metrics/metrics.service'

// 在 connection 回调中
this.metricsService.setWsConnections(pageId, doc.conns.size)
this.metricsService.setActiveDocs(docs.size)

// 在 closeConn 中（utils.ts）
// 需要通过回调或事件通知 gateway 更新指标
```

#### 5.2 定时更新指标

**新建**: `apps/server/src/fundamentals/metrics/metrics.scheduler.ts`

```typescript
import { Injectable } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { docs } from '../yjs-postgresql/utils'
import { MetricsService } from './metrics.service'

@Injectable()
export class MetricsScheduler {
    constructor(private readonly metricsService: MetricsService) {}

    @Cron('*/10 * * * * *') // 每 10 秒
    updateWsMetrics() {
        let totalConnections = 0
        docs.forEach((doc) => {
            totalConnections += doc.conns.size
        })
        this.metricsService.setActiveDocs(docs.size)
    }
}
```

---

### 6. 监控仪表盘 — Grafana + Prometheus

**目标**：提供可视化监控仪表盘

#### 6.1 添加 Prometheus 到 Docker Compose

**修改**: `docker-compose.deploy.yml`

```yaml
  prometheus:
    image: prom/prometheus:latest
    container_name: lcw-docs-prometheus
    restart: unless-stopped
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:latest
    container_name: lcw-docs-grafana
    restart: unless-stopped
    depends_on:
      - prometheus
    volumes:
      - grafana_data:/var/lib/grafana
    ports:
      - "3000:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD:-admin}

volumes:
  postgres_data:
  prometheus_data:
  grafana_data:
```

#### 6.2 创建 Prometheus 配置

**新建**: `monitoring/prometheus.yml`

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'lcw-docs-server'
    static_configs:
      - targets: ['server:8082']
    metrics_path: '/api/metrics'
```

#### 6.3 创建 Grafana 仪表盘配置

**新建**: `monitoring/grafana/dashboards/server-dashboard.json`

（Grafana 仪表盘 JSON 配置，包含 HTTP 请求率、响应时间 P99、WebSocket 连接数、内存使用等面板）

---

## 实施顺序

| 步骤 | 内容 | 优先级 | 依赖 |
|------|------|--------|------|
| 1 | Winston 结构化日志 + 请求日志中间件 | P0 | 无 |
| 2 | @nestjs/terminus 健康检查增强 | P0 | 无 |
| 3 | Prometheus 指标收集 + /metrics 端点 | P1 | 无 |
| 4 | Sentry 错误追踪（可选） | P1 | SENTRY_DSN |
| 5 | WebSocket 连接监控指标 | P1 | 步骤 3 |
| 6 | Grafana + Prometheus Docker 集成 | P2 | 步骤 3 |

## 需要安装的依赖

```bash
cd apps/server
pnpm add winston nest-winston @nestjs/terminus prom-client @sentry/node
```

## 需要创建/修改的文件清单

| 操作 | 文件路径 |
|------|---------|
| 新建 | `src/fundamentals/common/logger/winston.config.ts` |
| 新建 | `src/fundamentals/common/middleware/request-logger.middleware.ts` |
| 新建 | `src/fundamentals/metrics/metrics.module.ts` |
| 新建 | `src/fundamentals/metrics/metrics.service.ts` |
| 新建 | `src/fundamentals/metrics/metrics.controller.ts` |
| 新建 | `src/fundamentals/metrics/metrics.middleware.ts` |
| 新建 | `src/fundamentals/metrics/metrics.scheduler.ts` |
| 新建 | `src/fundamentals/common/sentry/sentry.config.ts` |
| 新建 | `src/fundamentals/common/sentry/sentry.filter.ts` |
| 新建 | `src/modules/health/indicators/database.health.ts` |
| 新建 | `src/modules/health/indicators/memory.health.ts` |
| 新建 | `monitoring/prometheus.yml` |
| 修改 | `src/app.module.ts` — 注册 WinstonModule、MetricsModule、中间件 |
| 修改 | `src/main.ts` — 初始化 Sentry |
| 修改 | `src/modules/health/health.module.ts` — 使用 Terminus |
| 修改 | `src/modules/health/health.controller.ts` — 健康检查端点 |
| 修改 | `docker-compose.deploy.yml` — 添加 Prometheus + Grafana |
| 修改 | `apps/server/.env.example` — 添加 SENTRY_DSN |
