import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { SystemConfigEntity } from '../../entities/system-config.entity'

/** 首次部署时从环境变量自动初始化到数据库的配置项 */
const ENV_CONFIG_MAP: Array<{ envKey: string; dbKey: string; group: string }> = [
    { envKey: 'DEEPSEEK_API_KEY', dbKey: 'DEEPSEEK_API_KEY', group: 'llm' },
    { envKey: 'OPENAI_API_KEY', dbKey: 'OPENAI_API_KEY', group: 'llm' },
    { envKey: 'LLM_PROVIDER', dbKey: 'LLM_PROVIDER', group: 'llm' },
    { envKey: 'EMBEDDING_API_KEY', dbKey: 'EMBEDDING_API_KEY', group: 'embedding' },
    { envKey: 'EMBEDDING_PROVIDER', dbKey: 'EMBEDDING_PROVIDER', group: 'embedding' },
    { envKey: 'EMBEDDING_MODEL', dbKey: 'EMBEDDING_MODEL', group: 'embedding' },
    { envKey: 'EMBEDDING_DIMENSIONS', dbKey: 'EMBEDDING_DIMENSIONS', group: 'embedding' },
]

@Injectable()
export class SystemConfigService implements OnModuleInit {
    private readonly logger = new Logger(SystemConfigService.name)

    /** 内存缓存，避免频繁查询数据库 */
    private cache: Map<string, string | null> = new Map()

    /** 表是否可用（synchronize=false 时表可能不存在） */
    private tableReady = false

    constructor(
        @InjectRepository(SystemConfigEntity)
        private readonly repo: Repository<SystemConfigEntity>,
        private readonly configService: ConfigService
    ) {}

    /**
     * 模块初始化时，将环境变量中的配置自动写入数据库（如果数据库中尚未配置）
     * 如果 system_config 表不存在（synchronize=false），则跳过并回退到环境变量
     */
    async onModuleInit() {
        try {
            // 检查表是否存在
            await this.repo.count()
            this.tableReady = true
        } catch {
            this.logger.warn('system_config 表不存在，将回退到环境变量读取配置。请开启 DB_SYNCHRONIZE=true 或手动建表。')
            return
        }

        let synced = 0
        for (const { envKey, dbKey, group } of ENV_CONFIG_MAP) {
            const envValue = this.configService.get<string>(envKey)
            if (!envValue) continue

            try {
                const existing = await this.repo.findOne({ where: { key: dbKey } })
                if (!existing) {
                    await this.repo.save(this.repo.create({ key: dbKey, value: envValue, group }))
                    synced++
                }
            } catch {
                // 单条同步失败不影响其他配置
            }
        }
        if (synced > 0) {
            this.logger.log(`已从环境变量同步 ${synced} 项配置到数据库`)
        }

        // 预加载所有配置到缓存，确保 getSync 能命中缓存
        await this.warmUpCache()
    }

    /**
     * 将数据库中所有配置预加载到内存缓存
     *
     * 在 onModuleInit 时调用，确保 getSync（同步方法）能从缓存获取数据库中的值，
     * 而不是在缓存未命中时只能回退到环境变量。
     */
    private async warmUpCache() {
        if (!this.tableReady) return

        try {
            const allConfigs = await this.repo.find()
            for (const config of allConfigs) {
                this.cache.set(config.key, config.value)
            }
            if (allConfigs.length > 0) {
                this.logger.log(`已预加载 ${allConfigs.length} 项配置到缓存`)
            }
        } catch {
            // 预加载失败不影响服务运行，getSync 会回退到环境变量
        }
    }

    /**
     * 获取配置值，优先从数据库读取，回退到环境变量
     */
    async get(key: string): Promise<string | null> {
        if (this.cache.has(key)) {
            return this.cache.get(key)!
        }

        if (this.tableReady) {
            try {
                const entity = await this.repo.findOne({ where: { key } })
                const value = entity?.value ?? this.configService.get<string>(key) ?? null
                this.cache.set(key, value)
                return value
            } catch {
                // 数据库查询失败，回退到环境变量
            }
        }

        const value = this.configService.get<string>(key) ?? null
        this.cache.set(key, value)
        return value
    }

    /**
     * 同步获取配置值（从缓存或环境变量），用于无法使用 async 的场景
     */
    getSync(key: string): string | null {
        if (this.cache.has(key)) {
            return this.cache.get(key)!
        }
        return this.configService.get<string>(key) ?? null
    }

    /**
     * 设置配置值
     */
    async set(key: string, value: string, group: string = 'system'): Promise<SystemConfigEntity> {
        let entity = await this.repo.findOne({ where: { key } })
        if (entity) {
            entity.value = value
            entity.group = group
        } else {
            entity = this.repo.create({ key, value, group })
        }
        const saved = await this.repo.save(entity)

        // 更新缓存
        this.cache.set(key, value)

        this.logger.log(`配置已更新: ${key} (分组: ${group})`)
        return saved
    }

    /**
     * 获取指定分组的所有配置
     */
    async getByGroup(group: string): Promise<SystemConfigEntity[]> {
        return this.repo.find({ where: { group } })
    }

    /**
     * 获取所有配置
     */
    async getAll(): Promise<SystemConfigEntity[]> {
        return this.repo.find()
    }

    /**
     * 清除缓存并重新从数据库加载
     *
     * 清除后立即重新预热缓存，避免 getSync 缓存未命中时回退到环境变量
     */
    async clearCache() {
        this.cache.clear()
        await this.warmUpCache()
    }
}
