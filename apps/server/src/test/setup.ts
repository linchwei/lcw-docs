import { afterAll, vi } from 'vitest'

// 安全检查：防止在非测试环境中意外运行测试导致数据被清空
if (process.env.NODE_ENV !== 'test') {
    console.error('❌ 致命错误：测试只能在 NODE_ENV=test 环境下运行！')
    console.error(`当前 NODE_ENV=${process.env.NODE_ENV || '(未设置)'}`)
    process.exit(1)
}

// Mock ws 模块，避免 DocYjsGateway 在测试环境中初始化 WebSocket Server 失败
vi.mock('ws', () => ({
    Server: class MockServer {
        on() {}
        close() {}
    },
    WebSocket: class MockWebSocket {
        send() {}
        close() {}
    },
}))

// 测试环境禁用限流，避免并发请求触发 429
vi.mock('@nestjs/throttler', async () => {
    const actual = await vi.importActual<typeof import('@nestjs/throttler')>('@nestjs/throttler')
    return {
        ...actual,
        ThrottlerGuard: class MockThrottlerGuard {
            canActivate() {
                return true
            }
        },
    }
})

afterAll(async () => {})
