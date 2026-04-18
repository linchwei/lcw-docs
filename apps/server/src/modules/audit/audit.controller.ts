import { Controller, Get, Param, Query, Request, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger'

import { AuditService } from './audit.service'

@ApiTags('审计日志')
@Controller()
export class AuditController {
    constructor(private readonly auditService: AuditService) {}

    @ApiOperation({ summary: '获取页面审计日志', description: '返回指定页面的操作审计记录' })
    @ApiBearerAuth('jwt')
    @ApiUnauthorizedResponse({ description: '未认证' })
    @ApiParam({ name: 'pageId', description: '页面 ID' })
    @ApiQuery({ name: 'limit', description: '返回条数限制', required: false })
    @ApiResponse({ status: 200, description: '成功', schema: { properties: { data: { type: 'array', description: '审计日志列表', items: { type: 'object', properties: { action: { type: 'string', description: '操作类型' }, userId: { type: 'string', description: '操作用户ID' }, timestamp: { type: 'string', description: '操作时间' } } } }, success: { type: 'boolean', description: '是否成功' } } } })
    @Get('page/:pageId/audit_log')
    @UseGuards(AuthGuard('jwt'))
    getPageAuditLog(@Param('pageId') pageId: string, @Query('limit') limit: number, @Request() req) {
        return this.auditService.findByResource('page', pageId, limit || 50)
    }
}
