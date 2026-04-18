import { Body, Controller, Delete, Get, Param, Post, Put, Query, Request, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger'
import { nanoid } from 'nanoid'

import { PageEntity } from '../../entities/page.entity'
import { UserEntity } from '../../entities/user.entity'
import { ZodValidationPipe } from '../../pipes/zod-validation.pipe'
import { CreatePageDto, createPageSchema, DeletePageDto, deletePageSchema, UpdatePageDto, updatePageSchema } from './page.dto'
import { PageService } from './page.service'

@ApiTags('页面')
@ApiBearerAuth('jwt')
@ApiUnauthorizedResponse({ description: '未认证' })
@Controller('page')
@UseGuards(AuthGuard('jwt'))
export class PageController {
    constructor(private readonly pageService: PageService) {}

    @ApiResponse({ status: 200, description: '成功', schema: { properties: { data: { type: 'object', description: '返回数据' }, success: { type: 'boolean', description: '是否成功' } } } })
    @ApiOperation({ summary: '获取页面图谱', description: '返回当前用户所有页面的树形结构图谱' })
    @Get('graph')
    async graph(@Request() req) {
        const graph = await this.pageService.graph({ userId: req.user.id })
        return { data: graph, success: true }
    }

    @ApiResponse({ status: 200, description: '成功', schema: { properties: { data: { type: 'object', description: '返回数据' }, success: { type: 'boolean', description: '是否成功' } } } })
    @ApiOperation({ summary: '搜索页面', description: '根据关键词搜索页面标题' })
    @ApiQuery({ name: 'q', description: '搜索关键词', required: true })
    @Get('search')
    async search(@Query('q') query: string, @Request() req) {
        const results = await this.pageService.search({ query, userId: req.user.id })
        return { data: results, success: true }
    }

    @ApiResponse({ status: 200, description: '成功', schema: { properties: { data: { type: 'object', description: '返回数据' }, success: { type: 'boolean', description: '是否成功' } } } })
    @ApiOperation({ summary: '获取已分享页面', description: '返回当前用户分享给其他人的页面列表' })
    @Get('shared')
    async shared(@Request() req) {
        const data = await this.pageService.shared({ userId: req.user.id })
        return { data, success: true }
    }

    @ApiResponse({ status: 200, description: '成功', schema: { properties: { data: { type: 'object', description: '返回数据' }, success: { type: 'boolean', description: '是否成功' } } } })
    @ApiOperation({ summary: '获取页面反向链接', description: '返回引用当前页面的其他页面列表' })
    @ApiParam({ name: 'pageId', description: '页面 ID' })
    @Get(':pageId/backlinks')
    async backlinks(@Param('pageId') pageId: string, @Request() req) {
        const data = await this.pageService.backlinks({ pageId, userId: req.user.id })
        return { data, success: true }
    }

    @ApiResponse({ status: 200, description: '成功', schema: { properties: { data: { type: 'object', description: '返回数据' }, success: { type: 'boolean', description: '是否成功' } } } })
    @ApiOperation({ summary: '获取回收站页面', description: '返回当前用户已软删除的页面列表' })
    @Get('trash')
    async trash(@Request() req) {
        const data = await this.pageService.trash({ userId: req.user.id })
        return { data, success: true }
    }

    @ApiResponse({ status: 200, description: '成功', schema: { properties: { data: { type: 'object', description: '返回数据' }, success: { type: 'boolean', description: '是否成功' } } } })
    @ApiOperation({ summary: '获取最近页面', description: '返回当前用户最近编辑的页面列表' })
    @Get('recent')
    async recent(@Request() req) {
        const data = await this.pageService.recent({ userId: req.user.id })
        return { data, success: true }
    }

    @ApiBody({ schema: { type: 'object', required: ['emoji', 'title'], properties: { emoji: { type: 'string', description: '页面图标' }, title: { type: 'string', description: '页面标题' } } } })
    @ApiResponse({ status: 200, description: '成功', schema: { properties: { data: { type: 'object', description: '返回数据' }, success: { type: 'boolean', description: '是否成功' } } } })
    @ApiOperation({ summary: '创建页面', description: '创建新页面，需提供 emoji 和标题' })
    @Post()
    async create(@Body(new ZodValidationPipe(createPageSchema)) body: CreatePageDto, @Request() req) {
        const user = new UserEntity()
        user.id = req.user.id
        const page = new PageEntity(body)
        Reflect.set<PageEntity, 'pageId'>(page, 'pageId', 'page' + nanoid(6))

        const newUser = await this.pageService.create({ ...page, user })
        return { data: newUser, success: true }
    }

    @ApiBody({ schema: { type: 'object', required: ['pageId'], properties: { pageId: { type: 'string', description: '页面ID' }, title: { type: 'string', description: '页面标题' }, emoji: { type: 'string', description: '页面图标' }, coverImage: { type: 'string', description: '封面图片URL', nullable: true }, folderId: { type: 'string', description: '文件夹ID', nullable: true } } } })
    @ApiResponse({ status: 200, description: '成功', schema: { properties: { data: { type: 'object', description: '返回数据' }, success: { type: 'boolean', description: '是否成功' } } } })
    @ApiOperation({ summary: '更新页面', description: '更新页面标题、emoji、封面或文件夹' })
    @Put()
    async update(@Body(new ZodValidationPipe(updatePageSchema)) body: UpdatePageDto) {
        const newPage = await this.pageService.update(body)
        return { data: newPage, success: true }
    }

    @ApiResponse({ status: 200, description: '成功', schema: { properties: { data: { type: 'object', description: '返回数据' }, success: { type: 'boolean', description: '是否成功' } } } })
    @ApiOperation({ summary: '切换收藏状态', description: '收藏或取消收藏页面' })
    @ApiParam({ name: 'pageId', description: '页面 ID' })
    @Put(':pageId/favorite')
    async toggleFavorite(@Param('pageId') pageId: string, @Request() req) {
        const page = await this.pageService.toggleFavorite({ pageId, userId: req.user.id })
        return { data: page, success: true }
    }

    @ApiResponse({ status: 200, description: '成功', schema: { properties: { data: { type: 'object', description: '返回数据' }, success: { type: 'boolean', description: '是否成功' } } } })
    @ApiOperation({ summary: '恢复页面', description: '从回收站恢复已软删除的页面' })
    @ApiParam({ name: 'pageId', description: '页面 ID' })
    @Post(':pageId/restore')
    async restore(@Param('pageId') pageId: string, @Request() req) {
        const result = await this.pageService.restore({ pageId, userId: req.user.id })
        return { data: result, success: true }
    }

    @ApiResponse({ status: 200, description: '成功', schema: { properties: { data: { type: 'object', description: '返回数据' }, success: { type: 'boolean', description: '是否成功' } } } })
    @ApiOperation({ summary: '获取单个页面', description: '根据页面 ID 获取页面详情' })
    @ApiParam({ name: 'pageId', description: '页面 ID' })
    @Get(':pageId')
    async fetch(@Param() params, @Request() req) {
        const page = await this.pageService.fetch({ pageId: params.pageId, userId: req.user.id })
        return { data: page, success: true }
    }

    @ApiResponse({ status: 200, description: '成功', schema: { properties: { data: { type: 'object', description: '返回数据' }, success: { type: 'boolean', description: '是否成功' } } } })
    @ApiOperation({ summary: '获取页面列表', description: '返回当前用户的所有页面列表' })
    @Get()
    async list(@Request() req) {
        const list = await this.pageService.list({ userId: req.user.id })
        return { data: list, success: true }
    }

    @ApiBody({ schema: { type: 'object', required: ['pageId'], properties: { pageId: { type: 'string', description: '页面ID' } } } })
    @ApiResponse({ status: 200, description: '成功', schema: { properties: { data: { type: 'object', description: '返回数据' }, success: { type: 'boolean', description: '是否成功' } } } })
    @ApiOperation({ summary: '软删除页面', description: '将页面移入回收站' })
    @Delete()
    async delete(@Body(new ZodValidationPipe(deletePageSchema)) body: DeletePageDto, @Request() req) {
        const result = await this.pageService.softDelete({ pageId: body.pageId, userId: req.user.id })
        return { data: result, success: true }
    }

    @ApiResponse({ status: 200, description: '成功', schema: { properties: { data: { type: 'object', description: '返回数据' }, success: { type: 'boolean', description: '是否成功' } } } })
    @ApiOperation({ summary: '永久删除页面', description: '从数据库中永久删除页面，不可恢复' })
    @ApiParam({ name: 'pageId', description: '页面 ID' })
    @Delete(':pageId/permanent')
    async permanentDelete(@Param('pageId') pageId: string, @Request() req) {
        const result = await this.pageService.permanentDelete({ pageId, userId: req.user.id })
        return { data: result, success: true }
    }
}
