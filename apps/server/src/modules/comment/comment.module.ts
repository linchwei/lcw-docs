import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { CommentEntity } from '../../entities/comment.entity'
import { PageEntity } from '../../entities/page.entity'
import { CommentController } from './comment.controller'
import { CommentService } from './comment.service'

@Module({
    imports: [TypeOrmModule.forFeature([CommentEntity, PageEntity])],
    controllers: [CommentController],
    providers: [CommentService],
    exports: [CommentService],
})
export class CommentModule {}
