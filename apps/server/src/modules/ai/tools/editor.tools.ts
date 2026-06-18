/**
 * 文档写入工具集
 *
 * 将编辑器的文档写入能力封装为 LangGraph Tool。
 *
 * ⚠️ 关键设计：工具不直接修改文档！
 * AI Agent 调用写入工具时，生成操作指令返回给前端，
 * 前端以 Diff 模式展示，用户审批后执行。
 * 这参考了 Cursor 的 Cmd+K Diff 审批机制。
 *
 * 数据流：
 * 1. Agent 调用 insert_blocks / update_block / delete_block
 * 2. 工具返回操作指令（JSON 格式，包含操作类型和内容）
 * 3. 指令通过 SSE 的 tool_call 事件推送到前端
 * 4. 前端展示 Diff 预览
 * 5. 用户点击"接受" → 前端调用编辑器 API 执行
 * 6. 用户点击"拒绝" → 忽略该操作
 *
 * @module tools/editor
 */
import { tool } from '@langchain/core/tools'
import { z } from 'zod'

/**
 * 在指定位置插入 Block
 *
 * Agent 生成内容后，通过此工具指定插入位置和内容。
 * 前端收到后展示 Diff 预览，用户审批后执行。
 */
export const insertBlocks = tool(
    async ({ blocks, afterBlockId }) => {
        // 不直接执行操作，返回操作指令供前端审批
        return JSON.stringify({
            type: 'insert_blocks',
            afterBlockId,
            blocks,
            message: `建议在 ${afterBlockId === 'end' ? '文档末尾' : `block ${afterBlockId} 后`} 插入 ${blocks.length} 个内容块`,
        })
    },
    {
        name: 'insert_blocks',
        description: '在文档指定位置插入新的内容块。afterBlockId 可以是 blockId（在该 block 后插入）或 "end"（文档末尾）',
        schema: z.object({
            blocks: z
                .array(
                    z.object({
                        type: z.enum(['heading', 'paragraph', 'bulletListItem', 'numberedListItem', 'codeBlock', 'blockquote']),
                        content: z.string().describe('Block 的文本内容'),
                        level: z.number().optional().describe('标题层级 1-3，仅 heading 类型需要'),
                        language: z.string().optional().describe('代码语言，仅 codeBlock 类型需要'),
                    })
                )
                .describe('要插入的 block 列表'),
            afterBlockId: z.string().describe('在哪个 block 后面插入，或 "end" 表示文档末尾'),
        }),
    }
)

/**
 * 更新指定 Block 内容
 *
 * Agent 修改已有 block 时使用。返回新旧内容对比，
 * 前端展示 Diff 预览。
 */
export const updateBlock = tool(
    async ({ blockId, newContent }) => {
        return JSON.stringify({
            type: 'update_block',
            blockId,
            newContent,
            message: `建议更新 block ${blockId} 的内容`,
        })
    },
    {
        name: 'update_block',
        description: '更新文档中指定 block 的内容，前端会展示 Diff 供用户审批',
        schema: z.object({
            blockId: z.string().describe('要更新的 block ID'),
            newContent: z.string().describe('新的内容文本'),
        }),
    }
)

/**
 * 删除指定 Block
 *
 * 删除操作需要特别谨慎，前端会展示确认对话框。
 */
export const deleteBlock = tool(
    async ({ blockId }) => {
        return JSON.stringify({
            type: 'delete_block',
            blockId,
            message: `建议删除 block ${blockId}`,
        })
    },
    {
        name: 'delete_block',
        description: '删除文档中指定的 block，前端会要求用户确认。请谨慎使用此工具。',
        schema: z.object({
            blockId: z.string().describe('要删除的 block ID'),
        }),
    }
)

/** 导出所有文档写入工具，供 Agent 注册使用 */
export const editorWriteTools = [insertBlocks, updateBlock, deleteBlock]
