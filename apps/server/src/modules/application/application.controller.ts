import { Body, Controller, Delete, Get, Post, Put, Request, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger'

import { ZodValidationPipe } from '../../pipes/zod-validation.pipe'
import { CreateApplicationDto, createApplicationSchema, DeleteApplicationDto, deleteApplicationSchema } from './application.dto'
import { ApplicationService } from './application.service'

@ApiTags('应用')
@ApiBearerAuth('jwt')
@ApiUnauthorizedResponse({ description: '未认证' })
@Controller('application')
@UseGuards(AuthGuard('jwt'))
export class ApplicationController {
    constructor(private readonly applicationService: ApplicationService) {}

    @ApiOperation({ summary: '创建应用', description: '创建新应用，类型可选 vanilla/react/vue' })
    @ApiBody({ schema: { type: 'object', required: ['type', 'name'], properties: { type: { type: 'string', description: '应用类型', enum: ['vanilla', 'react', 'vue'] }, name: { type: 'string', description: '应用名称' } } } })
    @ApiResponse({ status: 200, description: '成功', schema: { properties: { data: { type: 'object', description: '返回数据' }, success: { type: 'boolean', description: '是否成功' } } } })
    @Post()
    async create(@Body(new ZodValidationPipe(createApplicationSchema)) body: CreateApplicationDto, @Request() req) {
        const result = await this.applicationService.create({ ...body, userId: req.user.id })
        return { data: result, success: true }
    }

    @ApiOperation({ summary: '更新应用', description: '更新应用配置信息' })
    @ApiBody({ schema: { type: 'object', properties: { appId: { type: 'string', description: '应用ID' }, name: { type: 'string', description: '应用名称' }, config: { type: 'object', description: '应用配置' } } } })
    @ApiResponse({ status: 200, description: '成功', schema: { properties: { data: { type: 'object', description: '返回数据' }, success: { type: 'boolean', description: '是否成功' } } } })
    @Put()
    async update(@Body() body: any, @Request() req) {
        const result = await this.applicationService.update({ ...body, userId: req.user.id })
        return { data: result, success: true }
    }

    @ApiOperation({ summary: '获取应用列表', description: '返回当前用户的所有应用' })
    @ApiResponse({ status: 200, description: '成功', schema: { properties: { data: { type: 'object', description: '返回数据' }, success: { type: 'boolean', description: '是否成功' } } } })
    @Get()
    async list(@Request() req) {
        const data = await this.applicationService.list({ userId: req.user.id })
        return { data, success: true }
    }

    @ApiOperation({ summary: '删除应用' })
    @ApiBody({ schema: { type: 'object', required: ['appId'], properties: { appId: { type: 'string', description: '应用ID' } } } })
    @ApiResponse({ status: 200, description: '成功', schema: { properties: { data: { type: 'object', description: '返回数据' }, success: { type: 'boolean', description: '是否成功' } } } })
    @Delete()
    async delete(@Body(new ZodValidationPipe(deleteApplicationSchema)) body: DeleteApplicationDto, @Request() req) {
        const result = await this.applicationService.delete({ appId: body.appId, userId: req.user.id })
        return { data: result, success: true }
    }
}
