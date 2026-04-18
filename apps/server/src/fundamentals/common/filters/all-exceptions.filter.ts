import { Catch, ExceptionFilter, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common'

import { ForbiddenError } from '../exceptions/forbidden.exception'

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name)

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp()
        const response = ctx.getResponse()
        const request = ctx.getRequest()

        const status = exception instanceof HttpException
            ? exception.getStatus()
            : HttpStatus.INTERNAL_SERVER_ERROR

        const message = exception instanceof HttpException
            ? exception.message
            : 'Internal server error'

        if (status >= 500) {
            this.logger.error(
                `${request.method} ${request.url} - ${status} - ${exception instanceof Error ? exception.stack : exception}`,
            )
        }

        const body: Record<string, unknown> = {
            statusCode: status,
            message,
            timestamp: new Date().toISOString(),
            path: request.url,
        }

        if (exception instanceof ForbiddenError) {
            body.code = exception.code
        }

        response.status(status).json(body)
    }
}
