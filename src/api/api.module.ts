import { Module } from '@nestjs/common';
import { RolModule } from './rol/rol.module';
import { UsersModule } from './users/users.module';
import { TokenModule } from './token/token.module';

@Module({
  imports: [RolModule, UsersModule, TokenModule],
  controllers: [],
  providers: [],
  exports: [UsersModule],
})
export class ApiModule {}
