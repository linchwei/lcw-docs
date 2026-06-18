/**
 * AI 模块 DTO 定义
 *
 * 定义所有 AI 端点的请求体 schema，
 * 使用 Zod 进行运行时验证，同时导出 TypeScript 类型。
 *
 * 端点与 Schema 对应关系：
 * - POST /ai/chat    → chatSchema
 * - POST /ai/summary → summarySchema
 * - POST /ai/outline → outlineSchema
 * - POST /ai/rewrite → rewriteSchema
 * - POST /ai/resume  → resumeSchema
 *
 * @module ai/dto
 */
import { z } from 'zod'

// ─── 通用 Schema ───

/** 聊天消息 schema */
export const chatMessageSchema = z.object({
    /** 消息角色 */
    role: z.enum(['system', 'user', 'assistant']),
    /** 消息内容 */
    content: z.string(),
})

/** LLM 提供商枚举（可选） */
export const providerSchema = z.enum(['openai', 'deepseek']).optional()

/** 对话线程 ID（用于 Checkpointer 持久化，可选） */
export const threadIdSchema = z.string().optional()

// ─── 结构化上下文 Schema ───

/** 文档大纲项 schema */
export const outlineItemSchema = z.object({
    /** 标题层级 */
    level: z.number(),
    /** 标题文本 */
    text: z.string(),
    /** 对应的 Block ID */
    blockId: z.string(),
})

/** Block schema */
export const blockItemSchema = z.object({
    /** Block 唯一标识 */
    id: z.string(),
    /** Block 类型 */
    type: z.string(),
    /** Block 的文本内容（部分类型如 divider 可能为空） */
    content: z.string().optional(),
    /** 标题层级（仅 heading 类型有值） */
    level: z.number().optional(),
})

/** 选区 schema */
export const selectionSchema = z.object({
    /** 选中的文本 */
    text: z.string(),
    /** 选区所在 blockId */
    blockId: z.string(),
    /** 选区前文 */
    before: z.string(),
    /** 选区后文 */
    after: z.string(),
})

/** 结构化上下文 schema（与前端 StructuredContext 接口对应） */
export const structuredContextSchema = z.object({
    /** 文档大纲 */
    outline: z.array(outlineItemSchema),
    /** 文档所有 block 的扁平列表 */
    blocks: z.array(blockItemSchema),
    /** 用户选区信息（可选） */
    selection: selectionSchema.optional(),
})

// ─── 端点 Schema ───

/** 通用对话 schema */
export const chatSchema = z.object({
    /** 对话消息列表 */
    messages: z.array(chatMessageSchema),
    /** 对话线程 ID（用于持久化） */
    threadId: threadIdSchema,
    /** LLM 提供商（可选，默认使用环境变量 LLM_PROVIDER） */
    provider: providerSchema,
    /** 结构化文档上下文（替代全文拼接） */
    context: structuredContextSchema.optional(),
})

/** 文档摘要 schema */
export const summarySchema = z.object({
    /** 待摘要的文档全文内容 */
    documentContent: z.string(),
    /** 对话线程 ID */
    threadId: threadIdSchema,
    /** LLM 提供商 */
    provider: providerSchema,
})

/** 大纲生成 schema */
export const outlineSchema = z.object({
    /** 文档主题 */
    topic: z.string(),
    /** 用户的额外要求（可选） */
    requirements: z.string().optional(),
    /** 对话线程 ID */
    threadId: threadIdSchema,
    /** LLM 提供商 */
    provider: providerSchema,
})

/** 文档改写 schema */
export const rewriteSchema = z.object({
    /** 用户选中的原始内容 */
    selectedContent: z.string(),
    /** 用户的改写指令 */
    instruction: z.string(),
    /** 选区上下文（前后 block 的内容） */
    context: z.string().optional(),
    /** 对话线程 ID */
    threadId: threadIdSchema,
    /** LLM 提供商 */
    provider: providerSchema,
})

/** 恢复中断的 Agent schema */
export const resumeSchema = z.object({
    /** 对话线程 ID（必传，用于定位暂停的 Agent 状态） */
    threadId: z.string(),
    /** 用户是否批准 */
    approved: z.boolean(),
    /** 用户修改的内容（如编辑后的大纲，可选） */
    modifications: z.any().optional(),
})

/** RAG 文档索引 schema */
export const indexDocumentSchema = z.object({
    /** 文档 pageId */
    pageId: z.string(),
    /** 文档 block 列表（与 StructuredContext.blocks 格式一致） */
    blocks: z.array(blockItemSchema),
})

/** RAG 语义搜索 schema */
export const semanticSearchSchema = z.object({
    /** 搜索查询 */
    query: z.string(),
    /** 返回结果数量上限，默认 5 */
    topK: z.number().optional(),
    /** 最低相似度阈值 (0-1)，默认 0.5 */
    minScore: z.number().optional(),
    /** 限定搜索范围到特定文档，不传则搜索所有文档 */
    pageId: z.string().optional(),
})

// === 知识库模块 Schema ===

/** 知识库问答请求（支持跨文档搜索） */
export const knowledgeChatSchema = z.object({
    messages: z.array(chatMessageSchema).min(1, '消息列表不能为空'),
    threadId: z.string().optional(),
    pageId: z.string(),
    provider: z.enum(['openai', 'deepseek']).optional(),
    context: structuredContextSchema.optional(),
    /** 搜索范围：current=当前文档, all=全部文档 */
    scope: z.enum(['current', 'all']).default('current'),
})

/** 知识库索引状态查询 */
export const knowledgeStatusSchema = z.object({
    pageId: z.string(),
})

/** 知识库索引触发 */
export const knowledgeIndexSchema = z.object({
    pageId: z.string(),
    blocks: z.array(blockItemSchema).min(1, '文档块列表不能为空'),
})

/** 自动标签生成 */
export const autoTagSchema = z.object({
    pageId: z.string(),
    context: structuredContextSchema.optional(),
})

/** 知识图谱生成 */
export const knowledgeGraphSchema = z.object({
    pageId: z.string(),
    context: structuredContextSchema.optional(),
})

/** 知识卡片保存 */
export const saveKnowledgeCardSchema = z.object({
    title: z.string().min(1).max(200),
    content: z.string().min(1),
    sourcePageId: z.string(),
    folderId: z.string().optional(),
    tags: z.array(z.string()).optional(),
})

/** 智能摘要生成 */
export const smartSummarySchema = z.object({
    pageId: z.string(),
    context: structuredContextSchema.optional(),
})

/** 学习路径推荐 */
export const learningPathSchema = z.object({
    pageId: z.string(),
    context: structuredContextSchema.optional(),
})

/** 知识收藏 - 创建 */
export const createBookmarkSchema = z.object({
    sourcePageId: z.string(),
    sourceBlockId: z.string().optional(),
    title: z.string().min(1).max(200),
    content: z.string().min(1),
    question: z.string().optional(),
    threadId: z.string().optional(),
})

/** 知识收藏 - 列表查询 */
export const listBookmarksSchema = z.object({
    page: z.number().min(1).default(1),
    pageSize: z.number().min(1).max(50).default(20),
})

/** 知识收藏 - 搜索 */
export const searchBookmarksSchema = z.object({
    query: z.string().min(1),
})

/** 对话历史 - 列表查询 */
export const listThreadsSchema = z.object({
    page: z.number().min(1).default(1),
    pageSize: z.number().min(1).max(50).default(20),
})

/** 对话历史 - 删除 */
export const deleteThreadSchema = z.object({
    threadId: z.string(),
})

/** 关联文档查询 */
export const relatedDocumentsSchema = z.object({
    pageId: z.string(),
    topK: z.number().min(1).max(20).default(5),
})

/** 知识库全局搜索 */
export const knowledgeGlobalSearchSchema = z.object({
    query: z.string().min(1),
    topK: z.number().min(1).max(20).default(10),
    minScore: z.number().min(0).max(1).default(0.5),
})

// ─── 类型导出 ───

export type ChatMessage = z.infer<typeof chatMessageSchema>
export type ChatDto = z.infer<typeof chatSchema>
export type SummaryDto = z.infer<typeof summarySchema>
export type OutlineDto = z.infer<typeof outlineSchema>
export type RewriteDto = z.infer<typeof rewriteSchema>
export type ResumeDto = z.infer<typeof resumeSchema>
export type StructuredContextDto = z.infer<typeof structuredContextSchema>
export type IndexDocumentDto = z.infer<typeof indexDocumentSchema>
export type SemanticSearchDto = z.infer<typeof semanticSearchSchema>
export type KnowledgeChatDto = z.infer<typeof knowledgeChatSchema>
export type KnowledgeStatusDto = z.infer<typeof knowledgeStatusSchema>
export type KnowledgeIndexDto = z.infer<typeof knowledgeIndexSchema>
export type AutoTagDto = z.infer<typeof autoTagSchema>
export type KnowledgeGraphDto = z.infer<typeof knowledgeGraphSchema>
export type SaveKnowledgeCardDto = z.infer<typeof saveKnowledgeCardSchema>
export type SmartSummaryDto = z.infer<typeof smartSummarySchema>
export type LearningPathDto = z.infer<typeof learningPathSchema>
export type CreateBookmarkDto = z.infer<typeof createBookmarkSchema>
export type ListBookmarksDto = z.infer<typeof listBookmarksSchema>
export type SearchBookmarksDto = z.infer<typeof searchBookmarksSchema>
export type ListThreadsDto = z.infer<typeof listThreadsSchema>
export type DeleteThreadDto = z.infer<typeof deleteThreadSchema>
export type RelatedDocumentsDto = z.infer<typeof relatedDocumentsSchema>
export type KnowledgeGlobalSearchDto = z.infer<typeof knowledgeGlobalSearchSchema>
