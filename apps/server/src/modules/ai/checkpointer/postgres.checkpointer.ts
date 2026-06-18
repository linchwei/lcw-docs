/**
 * PostgreSQL Checkpointer 服务
 *
 * 使用 LangGraph 的 PostgresSaver 实现对话状态持久化。
 * Agent 工作流的每一步状态都会自动保存到数据库，
 * 支持跨会话恢复和 Human-in-the-Loop 暂停/继续。
 *
 * 表结构：PostgresSaver.setup() 会自动创建以下表：
 * - checkpoints: 存储每步的状态快照
 * - checkpoint_blobs: 存储大型二进制状态数据
 * - checkpoint_writes: 存储待写入的状态变更
 *
 * 降级策略：
 * - 如果 PostgreSQL 连接失败，checkpointer 为 null
 * - AiService 会降级为 MemorySaver（内存存储，重启丢失）
 * - 不阻塞服务启动，确保基本功能可用
 *
 * @module checkpointer/postgres
 */
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres'
import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class PostgresCheckpointerService implements OnModuleInit {
    private readonly logger = new Logger(PostgresCheckpointerService.name)

    /** PostgresSaver 实例，初始化失败时为 null */
    private checkpointer: PostgresSaver | null = null

    constructor(private configService: ConfigService) {}

    /**
     * 模块初始化时创建 Checkpointer 并建表
     *
     * 从环境变量构建 PostgreSQL 连接字符串，
     * 调用 setup() 创建 LangGraph 所需的表结构。
     *
     * 连接字符串格式：postgresql://user:password@host:port/database
     * 复用项目现有的数据库配置，无需额外配置。
     */
    async onModuleInit() {
        try {
            // 从环境变量读取数据库连接参数
            const dbHost = this.configService.get<string>('DB_HOST', 'localhost')
            const dbPort = this.configService.get<string>('DB_PORT', '5433')
            const dbUser = this.configService.get<string>('DB_USERNAME', 'postgres')
            const dbPass = this.configService.get<string>('DB_PASSWORD', 'postgres')
            const dbName = this.configService.get<string>('DB_DATABASE', 'postgres')

            // 构建连接字符串
            const connectionString = `postgresql://${dbUser}:${dbPass}@${dbHost}:${dbPort}/${dbName}`

            // 创建 PostgresSaver 实例并初始化表结构
            this.checkpointer = PostgresSaver.fromConnString(connectionString)
            await this.checkpointer.setup()

            this.logger.log('LangGraph Checkpointer 初始化完成')
        } catch (error) {
            this.logger.error('LangGraph Checkpointer 初始化失败', error)
            // Checkpointer 初始化失败不应阻塞服务启动
            // AiService 会降级为 MemorySaver 模式
            this.checkpointer = null
        }
    }

    /**
     * 获取 Checkpointer 实例
     *
     * @returns PostgresSaver 实例，如果初始化失败则返回 null
     *          调用方需要处理 null 的情况（降级为 MemorySaver）
     */
    getCheckpointer(): PostgresSaver | null {
        return this.checkpointer
    }
}
