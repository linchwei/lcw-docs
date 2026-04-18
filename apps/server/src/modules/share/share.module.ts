import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { PageEntity } from '../../entities/page.entity'
import { ShareEntity } from '../../entities/share.entity'
import { ShareController } from './share.controller'
import { ShareService } from './share.service'

@Module({
    imports: [TypeOrmModule.forFeature([ShareEntity, PageEntity])],
    controllers: [ShareController],
    providers: [ShareService],
    exports: [ShareService],
})
export class ShareModule {}
