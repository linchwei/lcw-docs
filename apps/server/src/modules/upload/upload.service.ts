import { Injectable } from '@nestjs/common'
import { createWriteStream, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

export interface IUploadFile {
    fieldname: string
    originalname: string
    encoding: string
    mimetype: string
    size: number
    destination?: string
    filename?: string
    path?: string
    buffer: Buffer
}

@Injectable()
export class UploadService {
    private readonly uploadDir = join(process.cwd(), 'uploads')

    constructor() {
        if (!existsSync(this.uploadDir)) {
            mkdirSync(this.uploadDir, { recursive: true })
        }
    }

    async saveFile(file: IUploadFile): Promise<{ url: string }> {
        const ext = file.originalname.substring(file.originalname.lastIndexOf('.'))
        const filename = `${Date.now()}${ext}`
        const filepath = join(this.uploadDir, filename)

        return new Promise<{ url: string }>((resolve, reject) => {
            const writeStream = createWriteStream(filepath)
            writeStream.write(file.buffer)
            writeStream.end()

            writeStream.on('finish', () => {
                resolve({ url: `/uploads/${filename}` })
            })

            writeStream.on('error', error => {
                reject(error)
            })
        })
    }
}
