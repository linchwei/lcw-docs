import { z } from 'zod'

export const createVersionSchema = z
    .object({
        pageId: z.string(),
        description: z.string().optional(),
    })
    .required({ pageId: true })

export type CreateVersionDto = z.infer<typeof createVersionSchema>
