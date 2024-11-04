import { Module } from '@nestjs/common';
import { RolModule } from './rol/rol.module';
import { UsersModule } from './users/users.module';
import { TokenModule } from './token/token.module';
import { CategoryModule } from './category/category.module';
import { PriorityModule } from './priority/priority.module';

@Module({
  imports: [
    CategoryModule,
    RolModule,
    TokenModule,
    UsersModule,
    PriorityModule,
  ],
  controllers: [],
  providers: [],
  exports: [UsersModule],
})
export class ApiModule {}
