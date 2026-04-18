import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { CollaboratorEntity } from '../../entities/collaborator.entity'
import { PageEntity } from '../../entities/page.entity'
import { PageController } from './page.controller'
import { PageService } from './page.service'

@Module({
    imports: [TypeOrmModule.forFeature([PageEntity, CollaboratorEntity])],
    controllers: [PageController],
    providers: [PageService],
    exports: [],
})
export class PageModule {}
