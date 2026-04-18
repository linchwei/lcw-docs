"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("vitest/config");
exports.default = (0, config_1.defineConfig)({
    test: {
        environment: 'node',
        globals: true,
        include: ['src/**/*.spec.ts'],
        setupFiles: ['src/test/setup.ts'],
        testTimeout: 30000,
        hookTimeout: 30000,
    },
});
//# sourceMappingURL=vitest.config.js.map