import { afterAll, vi } from 'vitest'

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

afterAll(async () => {})
