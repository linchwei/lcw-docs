import { Body, Controller, Delete, Get, Param, Post, Put, Query, Request, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { Throttle } from '@nestjs/throttler'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger'

import { ZodValidationPipe } from '../../pipes/zod-validation.pipe'
import { AddPageTagDto, addPageTagSchema, BatchGetPageTagsDto, batchGetPageTagsSchema, CreateTagDto, createTagSchema, UpdateTagDto, updateTagSchema } from './tag.dto'
import { TagService } from './tag.service'

@ApiTags('标签')
@ApiBearerAuth('jwt')
@ApiUnauthorizedResponse({ description: '未认证' })
@Controller()
@UseGuards(AuthGuard('jwt'))
export class TagController {
    constructor(private readonly tagService: TagService) {}

    @ApiResponse({ status: 200, description: '成功', schema: { properties: { data: { type: 'object', description: '返回数据' }, success: { type: 'boolean', description: '是否成功' } } } })
    @ApiOperation({ summary: '获取标签列表', description: '返回当前用户的所有标签' })
    @Throttle({ default: { ttl: 10000, limit: 100 } })
    @Get('tags')
    async list(@Request() req) {
        const data = await this.tagService.list({ userId: req.user.id })
        return { data, success: true }
    }

    @ApiBody({ schema: { type: 'object', required: ['name'], properties: { name: { type: 'string', description: '标签名称' }, color: { type: 'string', description: '标签颜色（十六进制）' } } } })
    @ApiResponse({ status: 200, description: '成功', schema: { properties: { data: { type: 'object', description: '返回数据' }, success: { type: 'boolean', description: '是否成功' } } } })
    @ApiOperation({ summary: '创建标签', description: '创建新标签，需提供名称，颜色可选' })
    @Post('tag')
    async create(@Body(new ZodValidationPipe(createTagSchema)) body: CreateTagDto, @Request() req) {
        const data = await this.tagService.create({
            name: body.name,
            color: body.color,
            userId: req.user.id,
        })
        return { data, success: true }
    }

    @ApiBody({ schema: { type: 'object', required: ['tagId'], properties: { tagId: { type: 'string', description: '标签ID' }, name: { type: 'string', description: '标签名称' }, color: { type: 'string', description: '标签颜色' } } } })
    @ApiResponse({ status: 200, description: '成功', schema: { properties: { data: { type: 'object', description: '返回数据' }, success: { type: 'boolean', description: '是否成功' } } } })
    @ApiOperation({ summary: '更新标签', description: '更新标签名称或颜色' })
    @Put('tag')
    async update(@Body(new ZodValidationPipe(updateTagSchema)) body: UpdateTagDto, @Request() req) {
        const data = await this.tagService.update({
            tagId: body.tagId,
            name: body.name,
            color: body.color,
            userId: req.user.id,
        })
        return { data, success: true }
    }

    @ApiResponse({ status: 200, description: '成功', schema: { properties: { data: { type: 'object', description: '返回数据' }, success: { type: 'boolean', description: '是否成功' } } } })
    @ApiOperation({ summary: '删除标签' })
    @ApiParam({ name: 'tagId', description: '标签 ID' })
    @Delete('tag/:tagId')
    async delete(@Param('tagId') tagId: string, @Request() req) {
        const result = await this.tagService.delete({ tagId, userId: req.user.id })
        return { data: result, success: true }
    }

    @ApiBody({ schema: { type: 'object', required: ['pageId', 'tagId'], properties: { pageId: { type: 'string', description: '页面ID' }, tagId: { type: 'string', description: '标签ID' } } } })
    @ApiResponse({ status: 200, description: '成功', schema: { properties: { data: { type: 'object', description: '返回数据' }, success: { type: 'boolean', description: '是否成功' } } } })
    @ApiOperation({ summary: '为页面添加标签', description: '将标签关联到指定页面' })
    @Post('page-tag')
    async addPageTag(@Body(new ZodValidationPipe(addPageTagSchema)) body: AddPageTagDto, @Request() req) {
        const data = await this.tagService.addPageTag({
            pageId: body.pageId,
            tagId: body.tagId,
            userId: req.user.id,
        })
        return { data, success: true }
    }

    @ApiResponse({ status: 200, description: '成功', schema: { properties: { data: { type: 'object', description: '返回数据' }, success: { type: 'boolean', description: '是否成功' } } } })
    @ApiOperation({ summary: '移除页面标签', description: '取消标签与页面的关联' })
    @ApiQuery({ name: 'pageId', description: '页面 ID' })
    @ApiQuery({ name: 'tagId', description: '标签 ID' })
    @Delete('page-tag')
    async removePageTag(@Query('pageId') pageId: string, @Query('tagId') tagId: string, @Request() req) {
        const result = await this.tagService.removePageTag({
            pageId,
            tagId,
            userId: req.user.id,
        })
        return { data: result, success: true }
    }

    @ApiResponse({ status: 200, description: '成功', schema: { properties: { data: { type: 'object', description: '返回数据' }, success: { type: 'boolean', description: '是否成功' } } } })
    @ApiOperation({ summary: '获取页面的标签', description: '返回指定页面关联的所有标签' })
    @ApiParam({ name: 'pageId', description: '页面 ID' })
    @Throttle({ default: { ttl: 10000, limit: 100 } })
    @Get('page/:pageId/tags')
    async getPageTags(@Param('pageId') pageId: string) {
        const data = await this.tagService.getPageTags({ pageId })
        return { data, success: true }
    }

    @ApiBody({ schema: { type: 'object', required: ['pageIds'], properties: { pageIds: { type: 'array', description: '页面ID列表，最多50个', items: { type: 'string' }, maxItems: 50 } } } })
    @ApiResponse({ status: 200, description: '成功', schema: { properties: { data: { type: 'object', description: '返回数据' }, success: { type: 'boolean', description: '是否成功' } } } })
    @ApiOperation({ summary: '批量获取页面标签', description: '一次请求获取多个页面的标签，最多 50 个页面 ID' })
    @Post('page-tags/batch')
    @Throttle({ default: { ttl: 10000, limit: 100 } })
    async batchGetPageTags(@Body(new ZodValidationPipe(batchGetPageTagsSchema)) body: BatchGetPageTagsDto) {
        const data = await this.tagService.batchGetPageTags({ pageIds: body.pageIds })
        return { data, success: true }
    }

    @ApiResponse({ status: 200, description: '成功', schema: { properties: { data: { type: 'object', description: '返回数据' }, success: { type: 'boolean', description: '是否成功' } } } })
    @ApiOperation({ summary: '获取标签下的页面', description: '返回指定标签关联的所有页面' })
    @ApiParam({ name: 'tagId', description: '标签 ID' })
    @Throttle({ default: { ttl: 10000, limit: 100 } })
    @Get('tag/:tagId/pages')
    async getTagPages(@Param('tagId') tagId: string, @Request() req) {
        const data = await this.tagService.getTagPages({ tagId, userId: req.user.id })
        return { data, success: true }
    }
}
