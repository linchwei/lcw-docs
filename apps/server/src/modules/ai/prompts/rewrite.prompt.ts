/**
 * 文档改写 Agent 的 Prompt 模板
 *
 * 改写工作流分两个阶段：
 * 1. 上下文分析（ANALYZE_CONTEXT_PROMPT）：理解选区在文档中的语义位置
 * 2. 内容改写（REWRITE_PROMPT）：根据用户指令改写选区内容
 *
 * 占位符说明：
 * - {context}: 选区前后的文档上下文
 * - {selectedContent}: 用户选中的原始内容
 * - {instruction}: 用户的改写指令
 *
 * @module prompts/rewrite
 */

/** 上下文分析提示词：理解选区在文档中的语义位置 */
export const ANALYZE_CONTEXT_PROMPT = `请分析以下文档上下文，理解选区在文档中的语义位置和作用。

上下文：
{context}

请简要说明选区内容在文档中的作用和与上下文的关系。`

/** 内容改写提示词：根据用户指令改写选区内容 */
export const REWRITE_PROMPT = `请根据用户的要求改写以下内容。

原始内容：
{selectedContent}

改写要求：
{instruction}

上下文（供参考，不要直接修改）：
{context}

要求：
1. 严格遵循用户的改写指令
2. 保持与上下文的风格一致
3. 只输出改写后的内容，不要添加解释`
