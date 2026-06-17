import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger'

import { AdminGuard } from '../../fundamentals/common/guards/admin.guard'
import { CreateCategoryDto, CreateTemplateDto, UpdateCategoryDto, UpdateTemplateDto } from './template.dto'
import { TemplateService } from './template.service'

@ApiTags('模板')
@ApiBearerAuth('jwt')
@ApiUnauthorizedResponse({ description: '未认证' })
@Controller()
export class TemplateController {
    constructor(private readonly templateService: TemplateService) {}

    // ===== Category endpoints =====

    @ApiOperation({ summary: '获取模板分类列表', description: '返回所有启用的模板分类，按排序字段排列' })
    @Get('template-categories')
    async findAllCategories() {
        const data = await this.templateService.findAllCategories()
        return { data, success: true }
    }

    @ApiOperation({ summary: '创建模板分类', description: '创建新的模板分类' })
    @UseGuards(AuthGuard('jwt'), AdminGuard)
    @Post('template-categories')
    async createCategory(@Body() dto: CreateCategoryDto) {
        const data = await this.templateService.createCategory(dto)
        return { data, success: true }
    }

    @ApiOperation({ summary: '更新模板分类', description: '根据 categoryId 更新模板分类' })
    @ApiParam({ name: 'categoryId', description: '分类 ID' })
    @UseGuards(AuthGuard('jwt'), AdminGuard)
    @Put('template-categories/:categoryId')
    async updateCategory(@Param('categoryId') categoryId: string, @Body() dto: UpdateCategoryDto) {
        const data = await this.templateService.updateCategory(categoryId, dto)
        return { data, success: true }
    }

    @ApiOperation({ summary: '删除模板分类', description: '软删除模板分类（设置 isActive=false）' })
    @ApiParam({ name: 'categoryId', description: '分类 ID' })
    @UseGuards(AuthGuard('jwt'), AdminGuard)
    @Delete('template-categories/:categoryId')
    async deleteCategory(@Param('categoryId') categoryId: string) {
        const data = await this.templateService.deleteCategory(categoryId)
        return { data, success: true }
    }

    // ===== Template endpoints =====

    @ApiOperation({ summary: '获取模板列表', description: '返回所有启用的模板，可按分类筛选，按排序字段排列' })
    @ApiQuery({ name: 'categoryId', description: '分类 ID（可选）', required: false })
    @Get('templates')
    async findAllTemplates(@Query('categoryId') categoryId?: string) {
        const data = await this.templateService.findAllTemplates(categoryId)
        return { data, success: true }
    }

    @ApiOperation({ summary: '获取单个模板', description: '根据 templateId 获取模板详情' })
    @ApiParam({ name: 'templateId', description: '模板 ID' })
    @Get('templates/:templateId')
    async findOneTemplate(@Param('templateId') templateId: string) {
        const data = await this.templateService.findOneTemplate(templateId)
        return { data, success: true }
    }

    @ApiOperation({ summary: '创建模板', description: '创建新的模板' })
    @UseGuards(AuthGuard('jwt'), AdminGuard)
    @Post('templates')
    async createTemplate(@Body() dto: CreateTemplateDto) {
        const data = await this.templateService.createTemplate(dto)
        return { data, success: true }
    }

    @ApiOperation({ summary: '更新模板', description: '根据 templateId 更新模板' })
    @ApiParam({ name: 'templateId', description: '模板 ID' })
    @UseGuards(AuthGuard('jwt'), AdminGuard)
    @Put('templates/:templateId')
    async updateTemplate(@Param('templateId') templateId: string, @Body() dto: UpdateTemplateDto) {
        const data = await this.templateService.updateTemplate(templateId, dto)
        return { data, success: true }
    }

    @ApiOperation({ summary: '删除模板', description: '软删除模板（设置 isActive=false）' })
    @ApiParam({ name: 'templateId', description: '模板 ID' })
    @UseGuards(AuthGuard('jwt'), AdminGuard)
    @Delete('templates/:templateId')
    async deleteTemplate(@Param('templateId') templateId: string) {
        const data = await this.templateService.deleteTemplate(templateId)
        return { data, success: true }
    }

    @ApiOperation({ summary: '导入种子数据', description: '当模板表为空时导入预设的分类和模板数据' })
    @UseGuards(AuthGuard('jwt'), AdminGuard)
    @Post('templates/seed')
    async seedData() {
        const data = await this.templateService.seedData()
        return { data, success: true }
    }
}
