import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { PageTagEntity } from '../../entities/page-tag.entity'
import { TagEntity } from '../../entities/tag.entity'
import { UserEntity } from '../../entities/user.entity'
import { TagController } from './tag.controller'
import { TagService } from './tag.service'

@Module({
    imports: [TypeOrmModule.forFeature([TagEntity, PageTagEntity, UserEntity])],
    controllers: [TagController],
    providers: [TagService],
    exports: [TagService],
})
export class TagModule {}
