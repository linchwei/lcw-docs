import { z } from 'zod'

export const createCommentSchema = z
    .object({
        pageId: z.string(),
        content: z.string(),
        anchorText: z.string().optional(),
        anchorPos: z.string().optional(),
    })
    .required({ pageId: true, content: true })

export type CreateCommentDto = z.infer<typeof createCommentSchema>

export const replyCommentSchema = z.object({
    parentId: z.string(),
    content: z.string(),
})

export type ReplyCommentDto = z.infer<typeof replyCommentSchema>
