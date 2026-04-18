import { Body, Controller, Delete, Get, Param, Post, Request, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger'

import { ZodValidationPipe } from '../../pipes/zod-validation.pipe'
import { CreateVersionDto, createVersionSchema } from './version.dto'
import { VersionService } from './version.service'

@ApiTags('版本历史')
@ApiBearerAuth('jwt')
@ApiUnauthorizedResponse({ description: '未认证' })
@Controller()
@UseGuards(AuthGuard('jwt'))
export class VersionController {
    constructor(private readonly versionService: VersionService) {}

    @ApiOperation({ summary: '创建版本', description: '为指定页面创建一个新版本快照' })
    @ApiParam({ name: 'pageId', description: '页面 ID' })
    @ApiBody({ schema: { type: 'object', required: ['pageId'], properties: { pageId: { type: 'string', description: '页面ID' }, description: { type: 'string', description: '版本描述' } } } })
    @ApiResponse({ status: 200, description: '成功', schema: { properties: { data: { type: 'object', description: '返回数据' }, success: { type: 'boolean', description: '是否成功' } } } })
    @Post('page/:pageId/version')
    async create(@Param('pageId') pageId: string, @Body(new ZodValidationPipe(createVersionSchema)) body: CreateVersionDto, @Request() req) {
        const result = await this.versionService.create({ pageId, description: body.description, userId: req.user.id })
        return { data: result, success: true }
    }

    @ApiOperation({ summary: '获取页面版本列表', description: '返回指定页面的所有版本历史' })
    @ApiParam({ name: 'pageId', description: '页面 ID' })
    @ApiResponse({ status: 200, description: '成功', schema: { properties: { data: { type: 'object', description: '返回数据' }, success: { type: 'boolean', description: '是否成功' } } } })
    @Get('page/:pageId/versions')
    async findByPageId(@Param('pageId') pageId: string, @Request() req) {
        const data = await this.versionService.findByPageId({ pageId, userId: req.user.id })
        return { data, success: true }
    }

    @ApiOperation({ summary: '获取单个版本', description: '根据版本 ID 获取版本详情' })
    @ApiParam({ name: 'versionId', description: '版本 ID' })
    @ApiResponse({ status: 200, description: '成功', schema: { properties: { data: { type: 'object', description: '返回数据' }, success: { type: 'boolean', description: '是否成功' } } } })
    @Get('version/:versionId')
    async findOne(@Param('versionId') versionId: string, @Request() req) {
        const data = await this.versionService.findOne({ versionId, userId: req.user.id })
        return { data, success: true }
    }

    @ApiOperation({ summary: '删除版本', description: '删除指定的版本记录' })
    @ApiParam({ name: 'versionId', description: '版本 ID' })
    @ApiResponse({ status: 200, description: '成功', schema: { properties: { data: { type: 'object', description: '返回数据' }, success: { type: 'boolean', description: '是否成功' } } } })
    @Delete('version/:versionId')
    async delete(@Param('versionId') versionId: string, @Request() req) {
        const result = await this.versionService.delete({ versionId, userId: req.user.id })
        return { data: result, success: true }
    }

    @ApiOperation({ summary: '回滚到指定版本', description: '将页面内容回滚到指定版本' })
    @ApiParam({ name: 'pageId', description: '页面 ID' })
    @ApiParam({ name: 'versionId', description: '目标版本 ID' })
    @ApiResponse({ status: 200, description: '成功', schema: { properties: { data: { type: 'object', description: '返回数据' }, success: { type: 'boolean', description: '是否成功' } } } })
    @Post('page/:pageId/version/:versionId/rollback')
    async rollback(@Param('pageId') pageId: string, @Param('versionId') versionId: string, @Request() req) {
        const result = await this.versionService.rollback({ pageId, versionId, userId: req.user.id })
        return { data: result, success: true }
    }

    @ApiOperation({ summary: '比较两个版本差异', description: '返回两个版本之间的内容差异' })
    @ApiParam({ name: 'pageId', description: '页面 ID' })
    @ApiParam({ name: 'v1', description: '版本 1 ID' })
    @ApiParam({ name: 'v2', description: '版本 2 ID' })
    @ApiResponse({ status: 200, description: '成功', schema: { properties: { data: { type: 'object', description: '返回数据' }, success: { type: 'boolean', description: '是否成功' } } } })
    @Get('page/:pageId/version/:v1/diff/:v2')
    async diff(@Param('pageId') pageId: string, @Param('v1') v1: string, @Param('v2') v2: string, @Request() req) {
        const data = await this.versionService.diff({ pageId, versionId1: v1, versionId2: v2, userId: req.user.id })
        return { data, success: true }
    }
}
