import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'

/** 管理员权限守卫，检查用户 role 是否为 admin */
@Injectable()
export class AdminGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest()
        const user = request.user

        if (!user || user.role !== 'admin') {
            throw new ForbiddenException('需要管理员权限')
        }

        return true
    }
}
