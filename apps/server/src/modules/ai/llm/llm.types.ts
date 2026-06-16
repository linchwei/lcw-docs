/**
 * LLM 模块类型定义
 *
 * 定义 LLM 工厂和模型相关的 TypeScript 类型，
 * 确保类型安全，避免字符串硬编码。
 *
 * 设计原则：
 * - 使用联合类型约束提供商名称，防止拼写错误
 * - 使用 as const 确保配置对象不可变
 * - 每个配置项对应一个环境变量，便于运维管理
 *
 * @module llm/types
 */

/** 支持的 LLM 提供商类型 */
export type LlmProvider = 'openai' | 'deepseek'

/** LLM 创建参数 */
export interface LlmCreateOptions {
    /** 提供商名称，不传则使用环境变量 LLM_PROVIDER 的值（默认 deepseek） */
    provider?: LlmProvider

    /** 温度参数，控制输出随机性。0 = 确定性输出，1 = 高随机性。默认 0.7 */
    temperature?: number

    /** 是否启用流式输出。默认 true，SSE 场景必须启用 */
    streaming?: boolean
}

/**
 * LLM 模型配置映射
 *
 * 每个提供商的配置项：
 * - defaultModel: 默认模型名称（当环境变量未设置时使用）
 * - apiKeyEnv: API Key 对应的环境变量名
 * - modelEnv: 模型名对应的环境变量名
 * - baseURL: API 端点（仅 DeepSeek 需要，因为它兼容 OpenAI 协议但端点不同）
 */
export const LLM_CONFIG = {
    openai: {
        /** 默认模型名称 */
        defaultModel: 'gpt-4o-mini',
        /** API Key 环境变量名 */
        apiKeyEnv: 'OPENAI_API_KEY',
        /** 模型名环境变量名 */
        modelEnv: 'OPENAI_MODEL',
    },
    deepseek: {
        /** 默认模型名称 */
        defaultModel: 'deepseek-chat',
        /** API Key 环境变量名 */
        apiKeyEnv: 'DEEPSEEK_API_KEY',
        /** 模型名环境变量名 */
        modelEnv: 'DEEPSEEK_MODEL',
        /** DeepSeek API 端点，兼容 OpenAI 协议 */
        baseURL: 'https://api.deepseek.com',
    },
} as const
