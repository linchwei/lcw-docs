import { ForbiddenException } from '@nestjs/common'

export enum ForbiddenCode {
    FORBIDDEN_NO_ACCESS = 'FORBIDDEN_NO_ACCESS',
    FORBIDDEN_NOT_OWNER = 'FORBIDDEN_NOT_OWNER',
    FORBIDDEN_ROLE_INSUFFICIENT = 'FORBIDDEN_ROLE_INSUFFICIENT',
    FORBIDDEN_SELF_OPERATION = 'FORBIDDEN_SELF_OPERATION',
}

export class ForbiddenError extends ForbiddenException {
    code: ForbiddenCode

    constructor(message: string, code: ForbiddenCode) {
        super(message)
        this.code = code
    }
}
