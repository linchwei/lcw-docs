import { z } from 'zod'

export const chatMessageSchema = z.object({
    role: z.enum(['system', 'user', 'assistant']),
    content: z.string(),
})

export const chatSchema = z.object({
    messages: z.array(chatMessageSchema),
})

export type ChatMessage = z.infer<typeof chatMessageSchema>
export type ChatDto = z.infer<typeof chatSchema>
