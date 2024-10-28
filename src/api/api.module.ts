import { Module } from '@nestjs/common';
import { RolModule } from './rol/rol.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [RolModule, UsersModule],
  controllers: [],
  providers: [],
  exports: [],
})
export class ApiModule {}
