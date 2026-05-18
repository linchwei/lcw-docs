import vuePlugin from 'esbuild-plugin-vue-next'
import { defineConfig } from 'tsup'

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: false,
    external: ['vue', '@lcw-doc/core', '@tiptap/core', '@tiptap/vue-3', '@tiptap/pm'],
    splitting: true,
    sourcemap: true,
    clean: true,
    esbuildPlugins: [vuePlugin()],
})
