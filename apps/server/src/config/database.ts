import { join } from 'path'

export default () => {
    const isProd = process.env.NODE_ENV === 'production'
    return {
        database: {
            type: 'postgres',
            host: process.env.DB_HOST || (isProd ? '172.28.49.109' : 'localhost'),
            port: parseInt(process.env.DB_PORT, 10) || 5433,
            username: process.env.DB_USERNAME || 'postgres',
            password: process.env.DB_PASSWORD || 'postgres',
            database: process.env.DB_DATABASE || 'postgres',
            entities: [join(__dirname, '../', '**/**.entity{.ts,.js}')],
            synchronize: isProd ? false : (process.env.DB_SYNCHRONIZE === 'true'),
            poolSize: parseInt(process.env.DB_POOL_SIZE, 10) || 20,
            connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT, 10) || 5000,
            extra: {
                max: parseInt(process.env.DB_POOL_SIZE, 10) || 20,
                connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT, 10) || 5000,
                idleTimeoutMillis: 30000,
            },
        },
    }
}
