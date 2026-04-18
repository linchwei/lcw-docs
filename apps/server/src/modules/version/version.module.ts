import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { PageEntity } from '../../entities/page.entity'
import { VersionEntity } from '../../entities/version.entity'
import { VersionController } from './version.controller'
import { VersionScheduler } from './version.scheduler'
import { VersionService } from './version.service'

@Module({
    imports: [TypeOrmModule.forFeature([VersionEntity, PageEntity])],
    controllers: [VersionController],
    providers: [VersionService, VersionScheduler],
    exports: [VersionService],
})
export class VersionModule {}
