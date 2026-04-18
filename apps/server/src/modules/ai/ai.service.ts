import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant'
    content: string
}

@Injectable()
export class AiService {
    constructor(private readonly configService: ConfigService) {}

    async chatStream(messages: ChatMessage[]) {
        const apiKey = this.configService.get<string>('MINIMAX_API_KEY')
        if (!apiKey) {
            throw new Error('MINIMAX_API_KEY is not configured')
        }

        const response = await fetch('https://api.minimaxi.com/v1/text/chatcompletion_v2', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'MiniMax-M2.7',
                messages,
                stream: true,
            }),
        })

        return response
    }
}
