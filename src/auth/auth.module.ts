import { TokenModule } from '@/api/token/token.module';
import { UserEntity } from '@/api/users/entity/user.entity';
import { UsersModule } from '@/api/users/users.module';
import { configApp } from '@/config/app/config.app';
import { CoreModule } from '@/core/core.module';
import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './service/auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { AuthRepository } from './repository/auth.repository';
import { AuthInterfaceRepository } from './repository/auth.interface.repository';
import { UserInterfaceRepository } from '@/api/users/repository/user.interface.repository';
import { UserRepository } from '@/api/users/repository/user.repository';
import { TransformDto } from '@/shared/utils';
import { AuthController } from './controller/auth.controller';
import { DecriptHeaderBodyMiddleware } from '@/core/middlewares/decriptheaderbody.middleware';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      useFactory: () => {
        return {
          secret: configApp().secret_jwt,
          signOptions: {
            expiresIn: '10m',
          },
        };
      },
    }),
    TokenModule,
    CoreModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: AuthInterfaceRepository,
      useClass: AuthRepository,
    },
    {
      provide: UserInterfaceRepository,
      useClass: UserRepository,
    },
    TransformDto,
    LocalStrategy,
    JwtStrategy,
  ],
  exports: [AuthInterfaceRepository, TransformDto],
})
export class AuthModule {
  // implements NestModule
  //TODO: Para probar que funcione se desactiva
  /* configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(DecriptHeaderBodyMiddleware)
      .forRoutes({ path: 'auth/*', method: RequestMethod.POST });
  } */
}
