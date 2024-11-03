import { ConfigModule } from '@nestjs/config';
import { configApp } from '../app/config.app';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolEntity } from '@/api/rol/entity/rol.entity';
import { UserEntity } from '@/api/users/entity/user.entity';
import { TokenEntity } from '@/api/token/entity/token.entity';
import { CategoryEntity } from '@/api/category/entity/category.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: false,
      load: [configApp],
      envFilePath: ['.env'],
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: configApp().database.host,
      port: configApp().database.port,
      username: configApp().database.username,
      password: configApp().database.password,
      database: configApp().database.database,
      entities: [RolEntity, UserEntity, TokenEntity, CategoryEntity],
      synchronize: true,
      verboseRetryLog: true,
    }),
  ],
})
export class DatabaseModule {}
