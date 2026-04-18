import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { CollaboratorEntity } from '../../entities/collaborator.entity'
import { PageEntity } from '../../entities/page.entity'
import { SyncController } from './sync.controller'
import { SyncService } from './sync.service'

@Module({
    imports: [TypeOrmModule.forFeature([PageEntity, CollaboratorEntity])],
    controllers: [SyncController],
    providers: [SyncService],
    exports: [SyncService],
})
export class SyncModule {}
