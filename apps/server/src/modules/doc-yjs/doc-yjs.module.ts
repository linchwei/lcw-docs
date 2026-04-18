import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'

import { CollaboratorEntity } from '../../entities/collaborator.entity'
import { PageEntity } from '../../entities/page.entity'
import { ShareModule } from '../share/share.module'
import { DocYjsGateway } from './doc-yjs.gateway'

@Module({
    imports: [ConfigModule, ShareModule, TypeOrmModule.forFeature([PageEntity, CollaboratorEntity])],
    providers: [DocYjsGateway],
    exports: [],
})
export class DocYjsModule {}
