import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { FolderEntity } from '../../entities/folder.entity'
import { FolderController } from './folder.controller'
import { FolderService } from './folder.service'

@Module({
    imports: [TypeOrmModule.forFeature([FolderEntity])],
    controllers: [FolderController],
    providers: [FolderService],
    exports: [FolderService],
})
export class FolderModule {}
