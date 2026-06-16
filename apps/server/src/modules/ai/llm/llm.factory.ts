/**
 * LLM 模型工厂
 *
 * 根据配置创建不同提供商的 ChatModel 实例。
 * 当前支持 DeepSeek 和 OpenAI 两个提供商。
 *
 * 设计原则：
 * - DeepSeek API 兼容 OpenAI SDK 协议，统一使用 ChatOpenAI
 * - 通过 configuration.baseURL 切换 API 端点
 * - 工厂模式便于后续扩展新提供商（如 Anthropic、Gemini）
 *
 * 使用方式：
 * ```typescript
 * const factory = new LlmFactory(configService)
 * const llm = factory.create()                    // 使用默认提供商
 * const llm = factory.create({ provider: 'openai' }) // 指定提供商
 * ```
 *
 * @module llm/factory
 */
import { Injectable } from '@nestjs/common'
import { ChatOpenAI } from '@langchain/openai'
import { ConfigService } from '@nestjs/config'

import { LlmCreateOptions, LlmProvider, LLM_CONFIG } from './llm.types'

@Injectable()
export class LlmFactory {
    constructor(private configService: ConfigService) {}

    /**
     * 创建 ChatModel 实例
     *
     * 根据提供商配置创建对应的 ChatOpenAI 实例。
     * DeepSeek 通过切换 baseURL 实现兼容，无需额外 SDK。
     *
     * @param options - 创建参数，不传 provider 则使用环境变量 LLM_PROVIDER
     * @returns 配置好的 ChatOpenAI 实例，已启用流式输出
     * @throws 当提供商名称未知时抛出错误
     * @throws 当 API Key 未配置时抛出错误
     */
    create(options?: LlmCreateOptions) {
        // 确定提供商：优先使用参数，否则使用环境变量，默认 deepseek
        const provider = options?.provider || this.configService.get<string>('LLM_PROVIDER', 'deepseek')
        const config = LLM_CONFIG[provider as LlmProvider]

        if (!config) {
            throw new Error(`未知的 LLM 提供商: ${provider}，支持的提供商: ${Object.keys(LLM_CONFIG).join(', ')}`)
        }

        // 读取 API Key，未配置则抛出明确错误
        const apiKey = this.configService.get<string>(config.apiKeyEnv)
        if (!apiKey) {
            throw new Error(`LLM API Key 未配置: 请设置环境变量 ${config.apiKeyEnv}`)
        }

        // 读取模型名称，未配置则使用默认值
        const modelName = this.configService.get<string>(config.modelEnv, config.defaultModel)
        const temperature = options?.temperature ?? 0.7
        const streaming = options?.streaming ?? true

        // 构造 ChatOpenAI 参数
        const chatOpenAIOptions: Record<string, any> = {
            modelName,
            openAIApiKey: apiKey,
            temperature,
            streaming,
        }

        // DeepSeek 需要切换 baseURL（兼容 OpenAI 协议）
        if ('baseURL' in config) {
            chatOpenAIOptions.configuration = { baseURL: config.baseURL }
            // OpenAI SDK 内部在 streamEvents 时会检查 OPENAI_API_KEY 环境变量，
            // 即使已通过 openAIApiKey 参数传入，仍需设置环境变量以避免 Missing credentials 错误
            if (!process.env.OPENAI_API_KEY) {
                process.env.OPENAI_API_KEY = apiKey
            }
        }

        return new ChatOpenAI(chatOpenAIOptions)
    }
}
