import { z } from 'zod'

export const createShareSchema = z
    .object({
        pageId: z.string(),
        permission: z.enum(['view', 'comment', 'edit']).default('view'),
        password: z.string().optional(),
        expiresAt: z.string().optional(),
    })
    .required({ pageId: true })

export type CreateShareDto = z.infer<typeof createShareSchema>

export const accessShareSchema = z.object({
    shareId: z.string(),
    password: z.string().optional(),
})

export type AccessShareDto = z.infer<typeof accessShareSchema>
