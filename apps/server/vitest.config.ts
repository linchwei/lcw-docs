import { defineConfig } from 'vitest/config'

// 确保 Vitest 启动时就设置测试环境变量，使数据库配置使用测试数据库
process.env.NODE_ENV = 'test'

export default defineConfig({
    test: {
        environment: 'node',
        globals: true,
        include: ['src/**/*.spec.ts'],
        setupFiles: ['src/test/setup.ts'],
        globalSetup: ['src/test/globalSetup.ts'],
        testTimeout: 30000,
        hookTimeout: 30000,
        // 测试文件共享同一数据库，必须顺序执行以避免并行冲突
        fileParallelism: false,
        // 将 supertest 和 ws 标记为 CJS 依赖，确保正确加载
        deps: {
            interopDefault: true,
        },
    },
})
