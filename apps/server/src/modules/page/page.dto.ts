import { z } from 'zod'

/**
 * 创建应用的数据传输对象
 */
export const createPageSchema = z
    .object({
        emoji: z.string(),
        title: z.string(),
    })
    .required()

export type CreatePageDto = z.infer<typeof createPageSchema>

/**
 * 删除应用的数据传输对象
 */
export const deletePageSchema = z
    .object({
        pageId: z.string(),
    })
    .required()

export type DeletePageDto = z.infer<typeof deletePageSchema>

export const updatePageSchema = z
    .object({
        pageId: z.string(),
        title: z.string().optional(),
        emoji: z.string().optional(),
        coverImage: z.string().nullable().optional(),
        folderId: z.string().nullable().optional(),
    })
    .required({ pageId: true })

export type UpdatePageDto = z.infer<typeof updatePageSchema>
