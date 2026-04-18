import { z } from 'zod'

export const chatSchema = z.object({
    messages: z.array(
        z.object({
            role: z.enum(['system', 'user', 'assistant']),
            content: z.string(),
        })
    ),
})

export type ChatDto = z.infer<typeof chatSchema>
