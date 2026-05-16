import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
    plugins: [vue(), tailwindcss()],
    resolve: {
        alias: { '@': path.resolve(__dirname, './src') },
    },
    server: {
        port: 5174,
        proxy: {
            '/api': { target: 'http://localhost:8082', changeOrigin: true },
            '/doc-yjs-': { target: 'ws://localhost:8082', ws: true },
        },
    },
})
