import { z } from 'zod'

export const addCollaboratorSchema = z
    .object({
        username: z.string(),
        role: z.enum(['editor', 'commenter', 'viewer']),
    })
    .required()

export type AddCollaboratorDto = z.infer<typeof addCollaboratorSchema>

export const updateCollaboratorSchema = z
    .object({
        role: z.enum(['editor', 'commenter', 'viewer']),
    })
    .required()

export type UpdateCollaboratorDto = z.infer<typeof updateCollaboratorSchema>
