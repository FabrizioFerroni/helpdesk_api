import { Module } from '@nestjs/common';
import { RolModule } from './rol/rol.module';
import { UsersModule } from './users/users.module';
import { TokenModule } from './token/token.module';
import { CategoryModule } from './category/category.module';

@Module({
  imports: [CategoryModule, RolModule, TokenModule, UsersModule],
  controllers: [],
  providers: [],
  exports: [UsersModule],
})
export class ApiModule {}
