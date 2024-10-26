import { Module } from '@nestjs/common';
import { RolModule } from './rol/rol.module';

@Module({
  imports: [RolModule],
  controllers: [],
  providers: [],
  exports: [],
})
export class ApiModule {}
