import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'

import { AdminGuard } from '../../fundamentals/common/guards/admin.guard'
import { SystemConfigService } from './system-config.service'

@ApiTags('系统配置')
@ApiBearerAuth('jwt')
@Controller('system-config')
@UseGuards(AuthGuard('jwt'), AdminGuard)
export class SystemConfigController {
    constructor(private readonly configService: SystemConfigService) {}

    @Get()
    @ApiOperation({ summary: '获取所有系统配置' })
    async getAll() {
        const configs = await this.configService.getAll()
        return {
            data: configs.map(c => ({
                key: c.key,
                value: c.value,
                group: c.group,
                updatedAt: c.updatedAt,
            })),
            success: true,
        }
    }

    @Put(':key')
    @ApiOperation({ summary: '更新系统配置' })
    async update(@Param('key') key: string, @Body() body: { value: string; group?: string }) {
        const config = await this.configService.set(key, body.value, body.group || 'system')
        return {
            data: { key: config.key, value: config.value, group: config.group },
            success: true,
        }
    }
}
