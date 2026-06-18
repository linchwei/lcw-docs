import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { TemplateEntity } from '../../entities/template.entity'
import { TemplateCategoryEntity } from '../../entities/template-category.entity'
import { CreateCategoryDto, CreateTemplateDto, UpdateCategoryDto, UpdateTemplateDto } from './template.dto'
import { getSeedCategories, getSeedTemplates } from './template.seed'

@Injectable()
export class TemplateService {
    private readonly logger = new Logger(TemplateService.name)

    constructor(
        @InjectRepository(TemplateEntity)
        private readonly templateRepository: Repository<TemplateEntity>,
        @InjectRepository(TemplateCategoryEntity)
        private readonly categoryRepository: Repository<TemplateCategoryEntity>
    ) {}

    async findAllCategories(): Promise<TemplateCategoryEntity[]> {
        return this.categoryRepository.find({
            where: { isActive: true },
            order: { sortOrder: 'ASC' },
        })
    }

    async createCategory(dto: CreateCategoryDto): Promise<TemplateCategoryEntity> {
        const category = new TemplateCategoryEntity({
            categoryId: dto.categoryId,
            name: dto.name,
            emoji: dto.emoji,
            sortOrder: dto.sortOrder ?? 0,
            isActive: dto.isActive ?? true,
        })
        return this.categoryRepository.save(category)
    }

    async updateCategory(categoryId: string, dto: UpdateCategoryDto): Promise<TemplateCategoryEntity> {
        const category = await this.categoryRepository.findOne({ where: { categoryId } })
        if (!category) {
            throw new NotFoundException('Category not found')
        }

        const updateData: Partial<TemplateCategoryEntity> = { ...dto, updatedAt: new Date() }
        await this.categoryRepository.update({ categoryId }, updateData)

        return this.categoryRepository.findOne({ where: { categoryId } })
    }

    async deleteCategory(categoryId: string): Promise<{ success: boolean }> {
        const category = await this.categoryRepository.findOne({ where: { categoryId } })
        if (!category) {
            throw new NotFoundException('Category not found')
        }

        await this.categoryRepository.update({ categoryId }, { isActive: false, updatedAt: new Date() })
        return { success: true }
    }

    async findAllTemplates(categoryId?: string): Promise<TemplateEntity[]> {
        const where: any = { isActive: true }
        if (categoryId) {
            where.categoryId = categoryId
        }
        return this.templateRepository.find({
            where,
            order: { sortOrder: 'ASC' },
        })
    }

    async findOneTemplate(templateId: string): Promise<TemplateEntity> {
        const template = await this.templateRepository.findOne({
            where: { templateId, isActive: true },
        })
        if (!template) {
            throw new NotFoundException('Template not found')
        }
        return template
    }

    async createTemplate(dto: CreateTemplateDto): Promise<TemplateEntity> {
        const template = new TemplateEntity({
            templateId: dto.templateId,
            name: dto.name,
            categoryId: dto.categoryId,
            description: dto.description,
            emoji: dto.emoji,
            content: dto.content,
            sortOrder: dto.sortOrder ?? 0,
            isActive: dto.isActive ?? true,
        })
        return this.templateRepository.save(template)
    }

    async updateTemplate(templateId: string, dto: UpdateTemplateDto): Promise<TemplateEntity> {
        const template = await this.templateRepository.findOne({ where: { templateId } })
        if (!template) {
            throw new NotFoundException('Template not found')
        }

        const updateData: Partial<TemplateEntity> = { ...dto, updatedAt: new Date() }
        await this.templateRepository.update({ templateId }, updateData)

        return this.templateRepository.findOne({ where: { templateId } })
    }

    async deleteTemplate(templateId: string): Promise<{ success: boolean }> {
        const template = await this.templateRepository.findOne({ where: { templateId } })
        if (!template) {
            throw new NotFoundException('Template not found')
        }

        await this.templateRepository.update({ templateId }, { isActive: false, updatedAt: new Date() })
        return { success: true }
    }

    async seedData(): Promise<{ categories: number; templates: number }> {
        const existingCategories = await this.categoryRepository.count()
        const existingTemplates = await this.templateRepository.count()

        if (existingCategories > 0 || existingTemplates > 0) {
            return { categories: existingCategories, templates: existingTemplates }
        }

        const categories = getSeedCategories()
        await this.categoryRepository.save(categories)

        const templates = getSeedTemplates()
        await this.templateRepository.save(templates)

        return { categories: categories.length, templates: templates.length }
    }
}
