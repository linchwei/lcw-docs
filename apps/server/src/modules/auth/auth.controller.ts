import { Controller, Get, Post, Request, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger'

import { AuthService } from './auth.service'

@ApiTags('认证')
@Controller()
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @ApiBody({ schema: { type: 'object', required: ['username', 'password'], properties: { username: { type: 'string', description: '用户名' }, password: { type: 'string', description: '密码' } } } })
    @ApiResponse({ status: 200, description: '登录成功', schema: { properties: { data: { type: 'object', properties: { access_token: { type: 'string', description: 'JWT令牌' } } }, success: { type: 'boolean' } } } })
    @ApiOperation({ summary: '用户登录', description: '使用用户名和密码登录，返回 JWT 令牌' })
    @UseGuards(AuthGuard('local'))
    @Post('/auth/login')
    async login(@Request() req) {
        return { data: await this.authService.login(req.user), success: true }
    }

    @ApiResponse({ status: 200, description: '登出成功', schema: { properties: { success: { type: 'boolean' } } } })
    @ApiOperation({ summary: '用户登出' })
    @ApiBearerAuth('jwt')
    @ApiUnauthorizedResponse({ description: '未认证' })
    @UseGuards(AuthGuard('jwt'))
    @Post('/auth/logout')
    async logout() {
        return { success: await this.authService.logout() }
    }

    @ApiResponse({ status: 200, description: '成功', schema: { properties: { data: { type: 'object', properties: { id: { type: 'string' }, username: { type: 'string' } } } } } })
    @ApiOperation({ summary: '获取当前用户信息', description: '返回当前登录用户的基本信息' })
    @ApiBearerAuth('jwt')
    @ApiUnauthorizedResponse({ description: '未认证' })
    @UseGuards(AuthGuard('jwt'))
    @Get('currentUser')
    currentUser(@Request() req) {
        return { data: req.user }
    }

    @ApiResponse({ status: 200, description: '成功', schema: { properties: { data: { type: 'object', properties: { id: { type: 'string' }, username: { type: 'string' } } } } } })
    @ApiOperation({ summary: '获取用户资料', description: '返回当前登录用户的完整资料' })
    @ApiBearerAuth('jwt')
    @ApiUnauthorizedResponse({ description: '未认证' })
    @UseGuards(AuthGuard('jwt'))
    @Get('me')
    getProfile(@Request() req) {
        return req.user
    }
}
