import { z } from 'zod'

export const createTagSchema = z
    .object({
        name: z.string(),
        color: z.string().optional(),
    })
    .required({ name: true })

export type CreateTagDto = z.infer<typeof createTagSchema>

export const updateTagSchema = z
    .object({
        tagId: z.string(),
        name: z.string().optional(),
        color: z.string().optional(),
    })
    .required({ tagId: true })

export type UpdateTagDto = z.infer<typeof updateTagSchema>

export const addPageTagSchema = z
    .object({
        pageId: z.string(),
        tagId: z.string(),
    })
    .required()

export type AddPageTagDto = z.infer<typeof addPageTagSchema>

export const batchGetPageTagsSchema = z
    .object({
        pageIds: z.array(z.string()).max(50),
    })
    .required()

export type BatchGetPageTagsDto = z.infer<typeof batchGetPageTagsSchema>
