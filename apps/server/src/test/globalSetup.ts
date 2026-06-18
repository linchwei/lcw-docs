/**
 * Vitest 全局初始化
 * 在所有测试文件之前执行，确保测试数据库存在
 */
export default async function setup() {
    // 动态导入 typeorm，避免在非测试环境中加载
    const { DataSource } = await import('typeorm')

    const testDbName = `${process.env.DB_DATABASE || 'postgres'}_test`

    // 连接到默认的 postgres 数据库来创建测试数据库
    const masterDs = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT, 10) || 5433,
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_DATABASE || 'postgres',
    })

    try {
        await masterDs.initialize()
        // 检查测试数据库是否已存在
        const result = await masterDs.query(`SELECT 1 FROM pg_database WHERE datname = '${testDbName}'`)
        if (result.length === 0) {
            await masterDs.query(`CREATE DATABASE "${testDbName}"`)
            console.log(`✅ 测试数据库 "${testDbName}" 创建成功`)
        }
    } catch (e) {
        console.error(`❌ 创建测试数据库失败:`, e)
        throw e
    } finally {
        await masterDs.destroy()
    }
}
