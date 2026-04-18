import { Body, Controller, Post } from '@nestjs/common'
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'

import { ZodValidationPipe } from '../../pipes/zod-validation.pipe'
import { RegisterDto, registerSchema } from './user.dto'
import { UserService } from './user.service'

@ApiTags('用户')
@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @ApiBody({ schema: { type: 'object', required: ['username', 'password'], properties: { username: { type: 'string', description: '用户名，3-20位', minLength: 3, maxLength: 20 }, password: { type: 'string', description: '密码，6-50位', minLength: 6, maxLength: 50 } } } })
    @ApiResponse({ status: 200, description: '注册成功', schema: { properties: { data: { type: 'object', properties: { id: { type: 'string' }, username: { type: 'string' } } }, success: { type: 'boolean' } } } })
    @ApiOperation({ summary: '用户注册', description: '创建新用户账号，用户名 3-20 位，密码 6-50 位' })
    @Post('register')
    async add(@Body(new ZodValidationPipe(registerSchema)) body: RegisterDto) {
        const newUser = await this.userService.register(body as { username: string; password: string })
        return { data: newUser, success: true }
    }
}
