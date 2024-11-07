import { Module } from '@nestjs/common';
import { RolModule } from './rol/rol.module';
import { UsersModule } from './users/users.module';
import { TokenModule } from './token/token.module';
import { CategoryModule } from './category/category.module';
import { PriorityModule } from './priority/priority.module';
import { TicketsModule } from './tickets/tickets.module';

@Module({
  imports: [
    CategoryModule,
    PriorityModule,
    RolModule,
    TicketsModule,
    TokenModule,
    UsersModule,
  ],
  controllers: [],
  providers: [],
  exports: [UsersModule],
})
export class ApiModule {}
