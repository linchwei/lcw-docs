import { Controller, Delete, Get, Param, Post, Request, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger'

import { NotificationService } from './notification.service'

@ApiTags('通知')
@ApiBearerAuth('jwt')
@ApiUnauthorizedResponse({ description: '未认证' })
@Controller('notification')
@UseGuards(AuthGuard('jwt'))
export class NotificationController {
    constructor(private readonly notificationService: NotificationService) {}

    @ApiOperation({ summary: '获取通知列表', description: '返回当前用户的所有通知' })
    @ApiResponse({ status: 200, description: '成功', schema: { properties: { data: { type: 'object', description: '返回数据' }, success: { type: 'boolean', description: '是否成功' } } } })
    @Get()
    async list(@Request() req) {
        const data = await this.notificationService.list({ userId: req.user.id })
        return { data, success: true }
    }

    @ApiOperation({ summary: '获取未读通知数', description: '返回当前用户的未读通知数量' })
    @ApiResponse({ status: 200, description: '成功', schema: { properties: { data: { type: 'object', description: '返回数据' }, success: { type: 'boolean', description: '是否成功' } } } })
    @Get('unread-count')
    async unreadCount(@Request() req) {
        const count = await this.notificationService.unreadCount({ userId: req.user.id })
        return { data: count, success: true }
    }

    @ApiOperation({ summary: '标记通知已读', description: '将指定通知标记为已读' })
    @ApiParam({ name: 'notificationId', description: '通知 ID' })
    @ApiResponse({ status: 200, description: '成功', schema: { properties: { data: { type: 'object', description: '返回数据' }, success: { type: 'boolean', description: '是否成功' } } } })
    @Post(':notificationId/read')
    async markRead(@Param('notificationId') notificationId: string, @Request() req) {
        const result = await this.notificationService.markRead({ notificationId, userId: req.user.id })
        return { data: result, success: true }
    }

    @ApiOperation({ summary: '标记所有通知已读', description: '将当前用户的所有通知标记为已读' })
    @ApiResponse({ status: 200, description: '成功', schema: { properties: { data: { type: 'object', description: '返回数据' }, success: { type: 'boolean', description: '是否成功' } } } })
    @Post('read-all')
    async markAllRead(@Request() req) {
        const result = await this.notificationService.markAllRead({ userId: req.user.id })
        return { data: result, success: true }
    }

    @ApiOperation({ summary: '删除通知' })
    @ApiParam({ name: 'notificationId', description: '通知 ID' })
    @ApiResponse({ status: 200, description: '成功', schema: { properties: { data: { type: 'object', description: '返回数据' }, success: { type: 'boolean', description: '是否成功' } } } })
    @Delete(':notificationId')
    async delete(@Param('notificationId') notificationId: string, @Request() req) {
        const result = await this.notificationService.delete({ notificationId, userId: req.user.id })
        return { data: result, success: true }
    }
}
