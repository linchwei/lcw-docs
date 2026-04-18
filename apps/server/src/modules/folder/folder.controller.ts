import { Body, Controller, Delete, Get, Param, Post, Put, Request, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger'

import { ZodValidationPipe } from '../../pipes/zod-validation.pipe'
import { CreateFolderDto, createFolderSchema, UpdateFolderDto, updateFolderSchema } from './folder.dto'
import { FolderService } from './folder.service'

@ApiTags('文件夹')
@ApiBearerAuth('jwt')
@ApiUnauthorizedResponse({ description: '未认证' })
@Controller('folder')
@UseGuards(AuthGuard('jwt'))
export class FolderController {
    constructor(private readonly folderService: FolderService) {}

    @ApiOperation({ summary: '获取文件夹列表', description: '返回当前用户的所有文件夹' })
    @ApiResponse({ status: 200, description: '成功', schema: { properties: { data: { type: 'object', description: '返回数据' }, success: { type: 'boolean', description: '是否成功' } } } })
    @Get()
    async list(@Request() req) {
        const data = await this.folderService.list({ userId: req.user.id })
        return { data, success: true }
    }

    @ApiOperation({ summary: '创建文件夹', description: '创建新文件夹，可指定父文件夹' })
    @ApiBody({ schema: { type: 'object', required: ['name'], properties: { name: { type: 'string', description: '文件夹名称' }, parentId: { type: 'string', description: '父文件夹ID' } } } })
    @ApiResponse({ status: 200, description: '成功', schema: { properties: { data: { type: 'object', description: '返回数据' }, success: { type: 'boolean', description: '是否成功' } } } })
    @Post()
    async create(@Body(new ZodValidationPipe(createFolderSchema)) body: CreateFolderDto, @Request() req) {
        const result = await this.folderService.create({
            name: body.name,
            parentId: body.parentId,
            userId: req.user.id,
        })
        return { data: result, success: true }
    }

    @ApiOperation({ summary: '更新文件夹', description: '更新文件夹名称、父文件夹或排序' })
    @ApiBody({ schema: { type: 'object', required: ['folderId'], properties: { folderId: { type: 'string', description: '文件夹ID' }, name: { type: 'string', description: '文件夹名称' }, parentId: { type: 'string', description: '父文件夹ID', nullable: true }, sortOrder: { type: 'number', description: '排序顺序' } } } })
    @ApiResponse({ status: 200, description: '成功', schema: { properties: { data: { type: 'object', description: '返回数据' }, success: { type: 'boolean', description: '是否成功' } } } })
    @Put()
    async update(@Body(new ZodValidationPipe(updateFolderSchema)) body: UpdateFolderDto, @Request() req) {
        const result = await this.folderService.update({
            folderId: body.folderId,
            name: body.name,
            parentId: body.parentId,
            sortOrder: body.sortOrder,
            userId: req.user.id,
        })
        return { data: result, success: true }
    }

    @ApiOperation({ summary: '删除文件夹' })
    @ApiParam({ name: 'folderId', description: '文件夹 ID' })
    @ApiResponse({ status: 200, description: '成功', schema: { properties: { data: { type: 'object', description: '返回数据' }, success: { type: 'boolean', description: '是否成功' } } } })
    @Delete(':folderId')
    async delete(@Param('folderId') folderId: string, @Request() req) {
        const result = await this.folderService.delete({ folderId, userId: req.user.id })
        return { data: result, success: true }
    }
}
