import { Catch, ArgumentsHost } from '@nestjs/common'
import { BaseExceptionFilter } from '@nestjs/core'
import * as Sentry from '@sentry/node'

@Catch()
export class SentryFilter extends BaseExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        if (exception instanceof Error) {
            Sentry.withScope((scope) => {
                const ctx = host.switchToHttp()
                const request = ctx.getRequest()
                scope.setTag('path', request.url)
                scope.setExtra('method', request.method)
                scope.setUser({ id: request.user?.id })
                Sentry.captureException(exception)
            })
        }

        super.catch(exception, host)
    }
}
