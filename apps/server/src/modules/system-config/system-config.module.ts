import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'

import { SystemConfigEntity } from '../../entities/system-config.entity'
import { SystemConfigController } from './system-config.controller'
import { SystemConfigService } from './system-config.service'

@Module({
    imports: [ConfigModule, TypeOrmModule.forFeature([SystemConfigEntity])],
    controllers: [SystemConfigController],
    providers: [SystemConfigService],
    exports: [SystemConfigService],
})
export class SystemConfigModule {}
