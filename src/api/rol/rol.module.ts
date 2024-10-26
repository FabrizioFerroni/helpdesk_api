import { Module } from '@nestjs/common';
import { RolEntity } from './entity/rol.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolService } from './service/rol.service';
import { RolInterfaceRepository } from './repository/rol.interface.repository';
import { RolRepository } from './repository/rol.repository';
import { TransformDto } from '@/shared/utils';
import { CoreModule } from '@/core/core.module';
import { RolController } from './controller/rol.controller';
import { CreateRolDto } from './dto/create-rol.dto';

@Module({
  imports: [TypeOrmModule.forFeature([RolEntity]), CoreModule],
  controllers: [RolController],
  providers: [
    RolService,
    {
      provide: RolInterfaceRepository,
      useClass: RolRepository,
    },
    TransformDto,
  ],
  exports: [RolService],
})
export class RolModule {
  constructor(private readonly rolService: RolService) {
    this.initializeNewRoles();
  }

  initializeNewRoles() {
    const isWeb: boolean = false;
    const rolesToAdd: CreateRolDto[] = [
      {
        rol: 'admin',
        description: 'Rol superior para administrar el sistema',
      },
      {
        rol: 'soporte',
        description: 'Rol soporte para los tecnicos del sistema',
      },
    ];

    for (const dto of rolesToAdd) {
      this.rolService.createRol(dto, isWeb);
    }
  }
}
