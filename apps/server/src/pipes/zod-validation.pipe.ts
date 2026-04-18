import { BadRequestException, PipeTransform } from '@nestjs/common'
import { ZodSchema } from 'zod'

export class ZodValidationPipe implements PipeTransform {
    constructor(private schema: ZodSchema) {}

    transform(value: unknown) {
        try {
            const parsedValue = this.schema.parse(value)
            return parsedValue
        } catch (error: any) {
            console.error('ZodValidationPipe error:', JSON.stringify(error.errors || error.message), 'value:', JSON.stringify(value))
            throw new BadRequestException('Validation failed')
        }
    }
}
