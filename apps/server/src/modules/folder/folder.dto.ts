import { z } from 'zod'

export const createFolderSchema = z
    .object({
        name: z.string(),
        parentId: z.string().optional(),
    })
    .required({ name: true })

export type CreateFolderDto = z.infer<typeof createFolderSchema>

export const updateFolderSchema = z
    .object({
        folderId: z.string(),
        name: z.string().optional(),
        parentId: z.string().nullable().optional(),
        sortOrder: z.number().optional(),
    })
    .required({ folderId: true })

export type UpdateFolderDto = z.infer<typeof updateFolderSchema>
