import { Body, Controller, Delete, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger'

import { ZodValidationPipe } from '../../pipes/zod-validation.pipe'
import { CreateShareDto, createShareSchema } from './share.dto'
import { ShareService } from './share.service'

@ApiTags('分享')
@Controller('share')
export class ShareController {
    constructor(private readonly shareService: ShareService) {}

    @ApiOperation({ summary: '创建分享链接', description: '为指定页面创建分享链接，可设置权限、密码和过期时间' })
    @ApiBearerAuth('jwt')
    @ApiUnauthorizedResponse({ description: '未认证' })
    @ApiBody({ schema: { type: 'object', required: ['pageId'], properties: { pageId: { type: 'string', description: '页面ID' }, permission: { type: 'string', description: '分享权限', enum: ['view', 'comment', 'edit'], default: 'view' }, password: { type: 'string', description: '访问密码' }, expiresAt: { type: 'string', description: '过期时间' } } } })
    @ApiResponse({ status: 200, description: '成功', schema: { properties: { data: { type: 'object', description: '返回数据' }, success: { type: 'boolean', description: '是否成功' } } } })
    @Post()
    @UseGuards(AuthGuard('jwt'))
    async create(@Body(new ZodValidationPipe(createShareSchema)) body: CreateShareDto, @Request() req) {
        const result = await this.shareService.create({
            pageId: body.pageId,
            permission: body.permission,
            password: body.password,
            expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
            userId: req.user.id,
        })
        return { data: result, success: true }
    }

    @ApiOperation({ summary: '获取页面的分享信息', description: '根据页面 ID 查询该页面的分享链接' })
    @ApiBearerAuth('jwt')
    @ApiParam({ name: 'pageId', description: '页面 ID' })
    @ApiResponse({ status: 200, description: '成功', schema: { properties: { data: { type: 'object', description: '返回数据' }, success: { type: 'boolean', description: '是否成功' } } } })
    @Get('page/:pageId')
    @UseGuards(AuthGuard('jwt'))
    async findByPageId(@Param('pageId') pageId: string, @Request() req) {
        const data = await this.shareService.findByPageId({ pageId, userId: req.user.id })
        return { data, success: true }
    }

    @ApiOperation({ summary: '删除分享链接', description: '删除指定的分享链接' })
    @ApiBearerAuth('jwt')
    @ApiParam({ name: 'shareId', description: '分享 ID' })
    @ApiResponse({ status: 200, description: '成功', schema: { properties: { data: { type: 'object', description: '返回数据' }, success: { type: 'boolean', description: '是否成功' } } } })
    @Delete(':shareId')
    @UseGuards(AuthGuard('jwt'))
    async delete(@Param('shareId') shareId: string, @Request() req) {
        const result = await this.shareService.delete({ shareId, userId: req.user.id })
        return { data: result, success: true }
    }

    @ApiOperation({ summary: '访问分享信息', description: '通过分享 ID 访问分享信息，如设密码需提供' })
    @ApiParam({ name: 'shareId', description: '分享 ID' })
    @ApiQuery({ name: 'password', description: '访问密码（如设置）', required: false })
    @ApiResponse({ status: 200, description: '成功', schema: { properties: { data: { type: 'object', description: '返回数据' }, success: { type: 'boolean', description: '是否成功' } } } })
    @Get(':shareId/info')
    async access(@Param('shareId') shareId: string, @Query('password') password?: string) {
        const data = await this.shareService.access({ shareId, password })
        return { data, success: true }
    }

    @ApiOperation({ summary: '获取分享页面内容', description: '通过分享 ID 获取页面完整内容' })
    @ApiParam({ name: 'shareId', description: '分享 ID' })
    @ApiQuery({ name: 'password', description: '访问密码（如设置）', required: false })
    @ApiResponse({ status: 200, description: '成功', schema: { properties: { data: { type: 'object', description: '返回数据' }, success: { type: 'boolean', description: '是否成功' } } } })
    @Get(':shareId/content')
    async getPageContent(@Param('shareId') shareId: string, @Query('password') password?: string) {
        const data = await this.shareService.getPageContent({ shareId, password })
        return { data, success: true }
    }
}
