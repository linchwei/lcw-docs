import { Body, Controller, Delete, Get, Param, Post, Put, Request, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger'

import { ZodValidationPipe } from '../../pipes/zod-validation.pipe'
import { AddCollaboratorDto, addCollaboratorSchema, UpdateCollaboratorDto, updateCollaboratorSchema } from './collaborator.dto'
import { CollaboratorService } from './collaborator.service'

@ApiTags('协作者')
@ApiBearerAuth('jwt')
@ApiUnauthorizedResponse({ description: '未认证' })
@Controller()
@UseGuards(AuthGuard('jwt'))
export class CollaboratorController {
    constructor(private readonly collaboratorService: CollaboratorService) {}

    @ApiOperation({ summary: '获取页面协作者列表', description: '返回指定页面的所有协作者及其角色' })
    @ApiParam({ name: 'pageId', description: '页面 ID' })
    @ApiResponse({ status: 200, description: '成功', schema: { properties: { data: { type: 'object', description: '返回数据' }, success: { type: 'boolean', description: '是否成功' } } } })
    @Get('page/:pageId/collaborators')
    async list(@Param('pageId') pageId: string, @Request() req) {
        const data = await this.collaboratorService.list({ pageId, userId: req.user.id })
        return { data, success: true }
    }

    @ApiOperation({ summary: '添加协作者', description: '为指定页面添加协作者，角色可选 editor/commenter/viewer' })
    @ApiParam({ name: 'pageId', description: '页面 ID' })
    @ApiBody({ schema: { type: 'object', required: ['username', 'role'], properties: { username: { type: 'string', description: '协作用户名' }, role: { type: 'string', description: '协作角色', enum: ['editor', 'commenter', 'viewer'] } } } })
    @ApiResponse({ status: 200, description: '成功', schema: { properties: { data: { type: 'object', description: '返回数据' }, success: { type: 'boolean', description: '是否成功' } } } })
    @Post('page/:pageId/collaborator')
    async add(@Param('pageId') pageId: string, @Body(new ZodValidationPipe(addCollaboratorSchema)) body: AddCollaboratorDto, @Request() req) {
        const data = await this.collaboratorService.add({
            pageId,
            username: body.username,
            role: body.role,
            userId: req.user.id,
        })
        return { data, success: true }
    }

    @ApiOperation({ summary: '更新协作者角色', description: '修改协作者的权限角色' })
    @ApiParam({ name: 'collaboratorId', description: '协作者 ID' })
    @ApiBody({ schema: { type: 'object', required: ['role'], properties: { role: { type: 'string', description: '协作角色', enum: ['editor', 'commenter', 'viewer'] } } } })
    @ApiResponse({ status: 200, description: '成功', schema: { properties: { data: { type: 'object', description: '返回数据' }, success: { type: 'boolean', description: '是否成功' } } } })
    @Put('collaborator/:collaboratorId')
    async update(@Param('collaboratorId') collaboratorId: string, @Body(new ZodValidationPipe(updateCollaboratorSchema)) body: UpdateCollaboratorDto, @Request() req) {
        const data = await this.collaboratorService.update({
            collaboratorId,
            role: body.role,
            userId: req.user.id,
        })
        return { data, success: true }
    }

    @ApiOperation({ summary: '移除协作者', description: '将协作者从页面中移除' })
    @ApiParam({ name: 'collaboratorId', description: '协作者 ID' })
    @ApiResponse({ status: 200, description: '成功', schema: { properties: { data: { type: 'object', description: '返回数据' }, success: { type: 'boolean', description: '是否成功' } } } })
    @Delete('collaborator/:collaboratorId')
    async remove(@Param('collaboratorId') collaboratorId: string, @Request() req) {
        const result = await this.collaboratorService.remove({ collaboratorId, userId: req.user.id })
        return { data: result, success: true }
    }
}
