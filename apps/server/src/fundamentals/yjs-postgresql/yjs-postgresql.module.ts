import { DynamicModule, Global, Logger, Module } from '@nestjs/common'
import { PostgresqlPersistence } from 'y-postgresql'
import * as Y from 'yjs'

import { setPersistence } from './utils'

export interface YjsPostgresqlOptions {
    host: string
    port: number
    user: string
    database: string
    password: string
    table: {
        name: string
        useIndex: boolean
        flushSize: number
    }
}

@Global()
@Module({})
export class YjsPostgresqlModule {
    static forRoot(options?: YjsPostgresqlOptions): DynamicModule {
        return {
            module: YjsPostgresqlModule,
            providers: [
                {
                    provide: 'YJS_POSTGRESQL_ADAPTER',
                    useFactory: async () => {
                        // 确保只初始化一次客户端
                        Logger.log('🚀 ~ yjs postgresql: ~ options:', options)
                        const isProd = process.env.NODE_ENV === 'production'
                        const pgdb = await PostgresqlPersistence.build(
                            {
                                host: process.env.DB_HOST || (isProd ? '172.28.49.109' : 'localhost'),
                                port: parseInt(process.env.DB_PORT, 10) || 5433,
                                user: process.env.DB_USERNAME || 'postgres',
                                database: process.env.DB_DATABASE || 'postgres',
                                password: process.env.DB_PASSWORD || 'postgres',
                            },
                            { tableName: 'yjs-writings', useIndex: false, flushSize: 200 }
                        )

                        setPersistence({
                            bindState: async (docName, ydoc) => {
                                Logger.log('🚀 ~ bindState: ~ docName:' + docName)
                                const persistedYdoc = await pgdb.getYDoc(docName)
                                Y.applyUpdate(ydoc, Y.encodeStateAsUpdate(persistedYdoc))
                                ydoc.on('update', async (update: Uint8Array) => {
                                    try {
                                        await pgdb.storeUpdate(docName, update)
                                    } catch (err) {
                                        console.error(`Failed to store Y.js update for ${docName}:`, err)
                                    }
                                })
                            },
                            writeState: async (docName, ydoc) => {
                                Logger.log('🚀 ~ writeState: ~ docName:' + docName)
                                try {
                                    const state = Y.encodeStateAsUpdate(ydoc)
                                    await pgdb.storeUpdate(docName, state)
                                } catch (err) {
                                    console.error(`Failed to write Y.js state for ${docName}:`, err)
                                }
                            },
                        })

                        return pgdb
                    },
                },
            ],
            exports: ['YJS_POSTGRESQL_ADAPTER'],
        }
    }
}
