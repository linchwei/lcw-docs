import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { ChatMessage } from './ai.dto'

const DEFAULT_MODEL = 'deepseek-v4-flash'

@Injectable()
export class AiService {
    constructor(private readonly configService: ConfigService) {}

    async chatStream(messages: ChatMessage[]) {
        const apiKey = this.configService.get<string>('DEEPSEEK_API_KEY')
        if (!apiKey) {
            throw new Error('DEEPSEEK_API_KEY is not configured')
        }

        const model = this.configService.get<string>('DEEPSEEK_MODEL') ?? DEFAULT_MODEL

        const response = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model,
                messages,
                stream: true,
            }),
        })

        return response
    }
}
