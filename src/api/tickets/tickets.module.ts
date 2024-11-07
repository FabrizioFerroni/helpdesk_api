import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketsEntity } from './entity/tickets.entity';
import { CoreModule } from '@/core/core.module';
import { configApp } from '@/config/app/config.app';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { CategoryModule } from '../category/category.module';
import { PriorityModule } from '../priority/priority.module';
import { TicketsInterfaceRepository } from './repository/ticket.interface.repository';
import { TicketsRepository } from './repository/ticket.repository';
import { TransformDto } from '@/shared/utils';
import { TicketService } from './service/ticket.service';
import { TicketController } from './controller/ticket.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([TicketsEntity]),
    CoreModule,
    ConfigModule.forRoot({
      isGlobal: false,
      envFilePath: [`${process.cwd()}/.env`], //.${process.env.NODE_ENV}.local
      load: [configApp],
    }),
    UsersModule,
    CategoryModule,
    PriorityModule,
  ],
  controllers: [TicketController],
  providers: [
    TicketService,
    {
      provide: TicketsInterfaceRepository,
      useClass: TicketsRepository,
    },
    TransformDto,
  ],
  exports: [TicketService],
})
export class TicketsModule {}
