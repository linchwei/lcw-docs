import { Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger'

import { SyncService } from './sync.service'

@ApiTags('文档同步')
@ApiBearerAuth('jwt')
@ApiUnauthorizedResponse({ description: '未认证' })
@Controller()
@UseGuards(AuthGuard('jwt'))
export class SyncController {
    constructor(private readonly syncService: SyncService) {}

    @ApiOperation({ summary: '获取文档操作记录', description: '获取指定页面的 Yjs 操作记录，可通过 since 参数增量获取' })
    @ApiParam({ name: 'pageId', description: '页面 ID' })
    @ApiQuery({ name: 'since', description: '起始时间戳，增量获取', required: false })
    @ApiResponse({ status: 200, description: '成功', schema: { properties: { data: { type: 'object', description: '返回数据' }, success: { type: 'boolean', description: '是否成功' } } } })
    @Get('doc/:pageId/ops')
    async getOps(@Param('pageId') pageId: string, @Query('since') since: number, @Request() req) {
        const data = await this.syncService.getOps({ pageId, since: String(since || ''), userId: req.user.id })
        return { data, success: true }
    }

    @ApiOperation({ summary: '推送文档操作', description: '推送 Yjs 文档更新操作到服务器' })
    @ApiParam({ name: 'pageId', description: '页面 ID' })
    @ApiBody({ schema: { type: 'object', required: ['update'], properties: { update: { type: 'string', description: 'Yjs更新数据（Base64编码）' } } } })
    @ApiResponse({ status: 200, description: '成功', schema: { properties: { data: { type: 'object', description: '返回数据' }, success: { type: 'boolean', description: '是否成功' } } } })
    @Post('doc/:pageId/ops')
    async pushOps(@Param('pageId') pageId: string, @Body() body: { update: string }, @Request() req) {
        const result = await this.syncService.pushOps({ pageId, update: body.update, userId: req.user.id })
        return { data: result, success: true }
    }

    @ApiOperation({ summary: '获取文档快照', description: '获取指定页面的最新文档快照' })
    @ApiParam({ name: 'pageId', description: '页面 ID' })
    @ApiResponse({ status: 200, description: '成功', schema: { properties: { data: { type: 'object', description: '返回数据' }, success: { type: 'boolean', description: '是否成功' } } } })
    @Get('doc/:pageId/snapshot')
    async getSnapshot(@Param('pageId') pageId: string, @Request() req) {
        const data = await this.syncService.getSnapshot({ pageId, userId: req.user.id })
        return { data, success: true }
    }
}
