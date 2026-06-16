/**
 * 文档摘要 Agent 的 Prompt 模板
 *
 * 摘要工作流分三个阶段，每个阶段使用不同的 Prompt：
 * 1. 分块摘要（CHUNK_SUMMARY_PROMPT）：对每个文档片段生成摘要
 * 2. 合并摘要（MERGE_SUMMARIES_PROMPT）：将各片段摘要合并为完整摘要
 * 3. 精炼摘要（REFINE_SUMMARY_PROMPT）：如果合并后的摘要过长，进行精炼
 *
 * 占位符说明：
 * - {content}: 文档片段内容
 * - {summaries}: 各片段摘要的拼接文本
 * - {summary}: 需要精炼的摘要文本
 *
 * @module prompts/summary
 */

/** 分块摘要提示词：对单个文档片段生成摘要 */
export const CHUNK_SUMMARY_PROMPT = `请为以下文档片段生成简洁的摘要，保留关键信息和核心观点。使用中文回复。

文档片段：
{content}`

/** 合并摘要提示词：将各片段摘要合并为完整摘要 */
export const MERGE_SUMMARIES_PROMPT = `请将以下各片段的摘要合并为一份完整、连贯的文档摘要。
要求：
1. 去除重复内容
2. 保持逻辑顺序
3. 突出核心观点
4. 摘要长度控制在 300-500 字

各片段摘要：
{summaries}`

/** 精炼摘要提示词：将过长的摘要压缩到 300 字以内 */
export const REFINE_SUMMARY_PROMPT = `请将以下摘要精炼为更简洁的版本，保留最核心的信息，控制在 300 字以内。

当前摘要：
{summary}`
