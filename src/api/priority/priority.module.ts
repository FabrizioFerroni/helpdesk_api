import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PriorityEntity } from './entity/priority.entity';
import { CoreModule } from '@/core/core.module';
import { ConfigModule } from '@nestjs/config';
import { configApp } from '@/config/app/config.app';
import { TransformDto } from '@/shared/utils';
import { PriorityService } from './service/priority.service';
import { PriorityInterfaceRepository } from './repository/priority.interface.repository';
import { PriorityRepository } from './repository/priority.repository';
import { PriorityController } from './controller/priority.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PriorityEntity]),
    CoreModule,
    ConfigModule.forRoot({
      isGlobal: false,
      envFilePath: [`${process.cwd()}/.env`], //.${process.env.NODE_ENV}.local
      load: [configApp],
    }),
    UsersModule,
  ],
  controllers: [PriorityController],
  providers: [
    PriorityService,
    {
      provide: PriorityInterfaceRepository,
      useClass: PriorityRepository,
    },
    TransformDto,
  ],
  exports: [PriorityService],
})
export class PriorityModule {}
