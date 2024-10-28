import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entity/user.entity';
import { CoreModule } from '@/core/core.module';
import { UserInterfaceRepository } from './repository/user.interface.repository';
import { UserRepository } from './repository/user.repository';
import { TransformDto } from '@/shared/utils';
import { UserService } from './service/user.service';
import { RolModule } from '../rol/rol.module';
import { UserController } from './controller/user.controller';
import { CreateUserDto } from './dto/create-user.dto';
import { ConfigModule } from '@nestjs/config';
import { configApp } from '@/config/app/config.app';
import { UpdateUserDto } from './dto/update-user.dto';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    CoreModule,
    RolModule,
    ConfigModule.forRoot({
      isGlobal: false,
      envFilePath: [`${process.cwd()}/.env`], //.${process.env.NODE_ENV}.local
      load: [configApp],
    }),
  ],
  controllers: [UserController],
  providers: [
    UserService,
    {
      provide: UserInterfaceRepository,
      useClass: UserRepository,
    },
    TransformDto,
  ],
  exports: [UserService],
})
export class UsersModule {
  constructor(private readonly userService: UserService) {
    this.initializeNewUsers();
  }

  async initializeNewUsers() {
    const isWeb: boolean = false;
    const userToAdd: CreateUserDto[] = [
      {
        firstName: 'Fabrizio',
        lastName: 'Ferroni',
        email: configApp().emailDefaultFabrizio,
        password: configApp().passwordDefaultFabrizio,
        confirm_password: configApp().passwordDefaultFabrizio,
        rol: 'admin',
        phone: null,
      },
      {
        firstName: 'Admin',
        lastName: 'Sistema',
        email: 'admin@example.com',
        password: configApp().passwordDefaultAdmin,
        confirm_password: configApp().passwordDefaultAdmin,
        rol: 'admin',
        phone: null,
      },
      {
        firstName: 'Soporte',
        lastName: 'Técnico',
        email: 'soporte@example.com',
        password: configApp().passwordDefaultSoporte,
        confirm_password: configApp().passwordDefaultSoporte,
        rol: 'soporte',
        phone: null,
      },
    ];

    for (const dto of userToAdd) {
      const { email } = dto;
      const userSaved = await this.userService.createNewUser(dto, isWeb);
      if (userSaved !== null) await this.activateNewUsers(email);
    }
  }

  async activateNewUsers(email: string) {
    const userBd = await this.userService.getUserByEmail(email);

    if (!userBd.active) {
      const update: Partial<UpdateUserDto> = {
        active: true,
      };

      this.userService.updateUser(userBd.id, update as UpdateUserDto);
    }
  }
}
