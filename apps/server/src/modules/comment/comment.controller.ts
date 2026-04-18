import { Body, Controller, Delete, Get, Param, Post, Put, Request, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger'

import { ZodValidationPipe } from '../../pipes/zod-validation.pipe'
import { CreateCommentDto, createCommentSchema, ReplyCommentDto, replyCommentSchema } from './comment.dto'
import { CommentService } from './comment.service'

@ApiTags('评论')
@Controller()
export class CommentController {
    constructor(private readonly commentService: CommentService) {}

    @ApiOperation({ summary: '创建评论', description: '在指定页面上创建评论，可关联锚点文本和位置' })
    @ApiBearerAuth('jwt')
    @ApiUnauthorizedResponse({ description: '未认证' })
    @ApiParam({ name: 'pageId', description: '页面 ID' })
    @ApiBody({ schema: { type: 'object', required: ['content'], properties: { content: { type: 'string', description: '评论内容' }, anchorText: { type: 'string', description: '锚点文本' }, anchorPos: { type: 'string', description: '锚点位置' } } } })
    @ApiResponse({ status: 200, description: '成功', schema: { properties: { data: { type: 'object', description: '返回数据' }, success: { type: 'boolean', description: '是否成功' } } } })
    @Post('page/:pageId/comment')
    @UseGuards(AuthGuard('jwt'))
    async create(@Param('pageId') pageId: string, @Body(new ZodValidationPipe(createCommentSchema)) body: CreateCommentDto, @Request() req) {
        const result = await this.commentService.create({
            pageId,
            content: body.content,
            anchorText: body.anchorText,
            anchorPos: body.anchorPos,
            userId: req.user.id,
        })
        return { data: result, success: true }
    }

    @ApiOperation({ summary: '获取页面评论', description: '返回指定页面的所有评论列表' })
    @ApiBearerAuth('jwt')
    @ApiParam({ name: 'pageId', description: '页面 ID' })
    @ApiResponse({ status: 200, description: '成功', schema: { properties: { data: { type: 'object', description: '返回数据' }, success: { type: 'boolean', description: '是否成功' } } } })
    @Get('page/:pageId/comments')
    @UseGuards(AuthGuard('jwt'))
    async findByPageId(@Param('pageId') pageId: string, @Request() req) {
        const data = await this.commentService.findByPageId({ pageId, userId: req.user.id })
        return { data, success: true }
    }

    @ApiOperation({ summary: '回复评论', description: '对指定评论进行回复' })
    @ApiBearerAuth('jwt')
    @ApiParam({ name: 'commentId', description: '评论 ID' })
    @ApiBody({ schema: { type: 'object', required: ['content'], properties: { content: { type: 'string', description: '回复内容' } } } })
    @ApiResponse({ status: 200, description: '成功', schema: { properties: { data: { type: 'object', description: '返回数据' }, success: { type: 'boolean', description: '是否成功' } } } })
    @Post('comment/:commentId/reply')
    @UseGuards(AuthGuard('jwt'))
    async reply(@Param('commentId') commentId: string, @Body(new ZodValidationPipe(replyCommentSchema)) body: ReplyCommentDto, @Request() req) {
        const result = await this.commentService.reply({
            parentId: commentId,
            content: body.content,
            userId: req.user.id,
        })
        return { data: result, success: true }
    }

    @ApiOperation({ summary: '解决评论', description: '将评论标记为已解决' })
    @ApiBearerAuth('jwt')
    @ApiParam({ name: 'commentId', description: '评论 ID' })
    @ApiResponse({ status: 200, description: '成功', schema: { properties: { data: { type: 'object', description: '返回数据' }, success: { type: 'boolean', description: '是否成功' } } } })
    @Put('comment/:commentId/resolve')
    @UseGuards(AuthGuard('jwt'))
    async resolve(@Param('commentId') commentId: string, @Request() req) {
        const result = await this.commentService.resolve({ commentId, userId: req.user.id })
        return { data: result, success: true }
    }

    @ApiOperation({ summary: '删除评论' })
    @ApiBearerAuth('jwt')
    @ApiParam({ name: 'commentId', description: '评论 ID' })
    @ApiResponse({ status: 200, description: '成功', schema: { properties: { data: { type: 'object', description: '返回数据' }, success: { type: 'boolean', description: '是否成功' } } } })
    @Delete('comment/:commentId')
    @UseGuards(AuthGuard('jwt'))
    async delete(@Param('commentId') commentId: string, @Request() req) {
        const result = await this.commentService.delete({ commentId, userId: req.user.id })
        return { data: result, success: true }
    }
}
