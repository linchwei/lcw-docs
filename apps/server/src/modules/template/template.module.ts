import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TemplateCategoryEntity } from '../../entities/template-category.entity'
import { TemplateEntity } from '../../entities/template.entity'
import { TemplateController } from './template.controller'
import { TemplateService } from './template.service'

@Module({
    imports: [TypeOrmModule.forFeature([TemplateEntity, TemplateCategoryEntity])],
    controllers: [TemplateController],
    providers: [TemplateService],
    exports: [TemplateService],
})
export class TemplateModule {}
