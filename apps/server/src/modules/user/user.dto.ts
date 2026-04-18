import { z } from 'zod'

export const registerSchema = z
    .object({
        username: z.string().min(3).max(20),
        password: z.string().min(6).max(50),
    })
    .required()

export type RegisterDto = z.infer<typeof registerSchema>
