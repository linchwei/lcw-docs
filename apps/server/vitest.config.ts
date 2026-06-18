import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        environment: 'node',
        globals: true,
        include: ['src/**/*.spec.ts'],
        setupFiles: ['src/test/setup.ts'],
        testTimeout: 30000,
        hookTimeout: 30000,
        // 将 supertest 和 ws 标记为 CJS 依赖，确保正确加载
        deps: {
            interopDefault: true,
        },
    },
})
