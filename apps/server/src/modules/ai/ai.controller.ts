import { Body, Controller, Post, Request, Res, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger'
import type { Response } from 'express'

import { ZodValidationPipe } from '../../pipes/zod-validation.pipe'
import { ChatDto, chatSchema } from './ai.dto'
import { AiService } from './ai.service'

@ApiTags('AI 助手')
@ApiBearerAuth('jwt')
@ApiUnauthorizedResponse({ description: '未认证' })
@Controller('ai')
@UseGuards(AuthGuard('jwt'))
export class AiController {
    constructor(private readonly aiService: AiService) {}

    @ApiOperation({ summary: 'AI 对话', description: '发送消息与 AI 助手对话，返回 SSE 流式响应' })
    @ApiBody({
        schema: {
            type: 'object',
            required: ['messages'],
            properties: {
                messages: {
                    type: 'array',
                    description: '对话消息列表',
                    items: {
                        type: 'object',
                        required: ['role', 'content'],
                        properties: {
                            role: { type: 'string', description: '消息角色', enum: ['system', 'user', 'assistant'] },
                            content: { type: 'string', description: '消息内容' }
                        }
                    }
                }
            }
        }
    })
    @ApiResponse({ status: 200, description: '成功，返回SSE流式响应', schema: { properties: { data: { type: 'object', description: '返回数据' }, success: { type: 'boolean', description: '是否成功' } } } })
    @Post('chat')
    async chat(@Body(new ZodValidationPipe(chatSchema)) body: ChatDto, @Request() req, @Res() res: Response) {
        const upstream = await this.aiService.chatStream(body.messages as import('./ai.service').ChatMessage[])

        res.setHeader('Content-Type', 'text/event-stream')
        res.setHeader('Cache-Control', 'no-cache')
        res.setHeader('Connection', 'keep-alive')
        res.setHeader('X-Accel-Buffering', 'no')
        res.flushHeaders()

        if (!upstream.body) {
            res.end()
            return
        }

        const reader = upstream.body.getReader()
        const pump = async () => {
            while (true) {
                const { done, value } = await reader.read()
                if (done) break
                res.write(value)
            }
            res.end()
        }
        pump().catch(() => res.end())
    }
}
