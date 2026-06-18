import { BadRequestException, Controller, Post, Request, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger'

import { UploadService } from './upload.service'

@ApiTags('文件上传')
@ApiBearerAuth('jwt')
@ApiUnauthorizedResponse({ description: '未认证' })
@Controller('upload')
@UseGuards(AuthGuard('jwt'))
export class UploadController {
    constructor(private readonly uploadService: UploadService) {}

    @ApiOperation({ summary: '上传文件', description: '上传文件或图片，支持 multipart/form-data，字段名为 file' })
    @ApiConsumes('multipart/form-data')
    @ApiResponse({
        status: 200,
        description: '上传成功',
        schema: {
            properties: {
                data: { type: 'object', properties: { url: { type: 'string', description: '文件访问URL' } } },
                success: { type: 'boolean', description: '是否成功' },
            },
        },
    })
    @Post()
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(@UploadedFile() file: any, @Request() _req) {
        if (!file) {
            throw new BadRequestException('No file uploaded')
        }
        const result = await this.uploadService.saveFile(file)
        return { data: result, success: true }
    }
}
