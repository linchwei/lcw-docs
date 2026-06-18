import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { CollaboratorEntity } from '../../entities/collaborator.entity'
import { PageEntity } from '../../entities/page.entity'
import { RagModule } from '../ai/rag/rag.module'
import { PageController } from './page.controller'
import { PageService } from './page.service'

@Module({
    imports: [
        TypeOrmModule.forFeature([PageEntity, CollaboratorEntity]),
        RagModule,
    ],
    controllers: [PageController],
    providers: [PageService],
    exports: [PageService],
})
export class PageModule {}
