import { configApp } from '@/config/app/config.app';
import { CoreModule } from '@/core/core.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryEntity } from './entity/category.entity';
import { CategoryInterfaceRepository } from './repository/category.interface.repository';
import { CategoryRepository } from './repository/category.repository';
import { TransformDto } from '@/shared/utils';
import { CategoryService } from './service/category.service';
import { CategoryController } from './controller/category.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CategoryEntity]),
    CoreModule,
    ConfigModule.forRoot({
      isGlobal: false,
      envFilePath: [`${process.cwd()}/.env`], //.${process.env.NODE_ENV}.local
      load: [configApp],
    }),
    UsersModule,
  ],
  controllers: [CategoryController],
  providers: [
    CategoryService,
    {
      provide: CategoryInterfaceRepository,
      useClass: CategoryRepository,
    },
    TransformDto,
  ],
  exports: [CategoryService],
})
export class CategoryModule {}
