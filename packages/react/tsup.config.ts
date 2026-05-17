import { defineConfig } from 'tsup'
import { transformSync } from '@babel/core'

const reactCompilerPlugin = () => ({
    name: 'react-compiler',
    setup(build) {
        build.onLoad({ filter: /\.tsx$/ }, async (args) => {
            if (args.path.includes('node_modules')) return

            const fs = await import('fs/promises')
            const source = await fs.readFile(args.path, 'utf8')

            const result = transformSync(source, {
                filename: args.path,
                sourceMaps: true,
                plugins: [['babel-plugin-react-compiler', { target: '19' }]],
                presets: [
                    ['@babel/preset-react', { runtime: 'automatic' }],
                    ['@babel/preset-typescript'],
                ],
                babelrc: false,
                configFile: false,
            })

            return {
                contents: result.code,
                loader: 'js',
            }
        })
    },
})

export default defineConfig([
    {
        entry: ['src/index.ts'],
        format: ['esm'],
        ignoreWatch: ['**/*.md'],
        sourcemap: true,
        bundle: true,
        dts: {
            resolve: ['@lcw-doc/core'],
        },
        clean: true,
        minify: true,
        outDir: 'build/esm',
        esbuildPlugins: [reactCompilerPlugin()],
    },
])
