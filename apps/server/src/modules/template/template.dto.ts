import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator'

export class CreateTemplateDto {
    @IsString()
    @IsNotEmpty()
    templateId: string

    @IsString()
    @IsNotEmpty()
    name: string

    @IsString()
    @IsNotEmpty()
    categoryId: string

    @IsString()
    @IsNotEmpty()
    description: string

    @IsString()
    emoji: string

    @IsString()
    @IsNotEmpty()
    content: string

    @IsNumber()
    @IsOptional()
    sortOrder?: number

    @IsBoolean()
    @IsOptional()
    isActive?: boolean
}

export class UpdateTemplateDto {
    @IsString()
    @IsOptional()
    name?: string

    @IsString()
    @IsOptional()
    categoryId?: string

    @IsString()
    @IsOptional()
    description?: string

    @IsString()
    @IsOptional()
    emoji?: string

    @IsString()
    @IsOptional()
    content?: string

    @IsNumber()
    @IsOptional()
    sortOrder?: number

    @IsBoolean()
    @IsOptional()
    isActive?: boolean
}

export class CreateCategoryDto {
    @IsString()
    @IsNotEmpty()
    categoryId: string

    @IsString()
    @IsNotEmpty()
    name: string

    @IsString()
    emoji: string

    @IsNumber()
    @IsOptional()
    sortOrder?: number

    @IsBoolean()
    @IsOptional()
    isActive?: boolean
}

export class UpdateCategoryDto {
    @IsString()
    @IsOptional()
    name?: string

    @IsString()
    @IsOptional()
    emoji?: string

    @IsNumber()
    @IsOptional()
    sortOrder?: number

    @IsBoolean()
    @IsOptional()
    isActive?: boolean
}
