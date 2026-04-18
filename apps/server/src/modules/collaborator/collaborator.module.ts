import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { CollaboratorEntity } from '../../entities/collaborator.entity'
import { PageEntity } from '../../entities/page.entity'
import { UserEntity } from '../../entities/user.entity'
import { NotificationModule } from '../notification/notification.module'
import { CollaboratorController } from './collaborator.controller'
import { CollaboratorService } from './collaborator.service'

@Module({
    imports: [
        TypeOrmModule.forFeature([CollaboratorEntity, PageEntity, UserEntity]),
        NotificationModule,
    ],
    controllers: [CollaboratorController],
    providers: [CollaboratorService],
    exports: [CollaboratorService],
})
export class CollaboratorModule {}
