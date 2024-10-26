import { Injectable } from '@nestjs/common';
import { BaseAbstractRepository } from '@/config/database/mysql/mysql.base.repository';
import { UpdateResult } from 'typeorm';
import { RolEntity } from '../entity/rol.entity';

@Injectable()
export abstract class RolInterfaceRepository extends BaseAbstractRepository<RolEntity> {
  abstract saveRol(data: RolEntity): Promise<RolEntity>;
  abstract obtenerTodos(
    deletedAt?: boolean,
    skip?: number,
    take?: number,
  ): Promise<[RolEntity[], number]>;
  abstract getRoleById(id: string, deleted?: boolean): Promise<RolEntity>;
  abstract deleteRolById(id: string): Promise<UpdateResult>;
  abstract updateRol(id: string, data: RolEntity): Promise<UpdateResult>;
  abstract obtenerRelaciones(): Promise<RolEntity[]>;
  abstract roleAlreadyExists(rol: string, id?: string): Promise<boolean>;
  abstract existeReg(id: string, deleted?: boolean): Promise<boolean>;
  abstract restoreRolById(id: string): Promise<UpdateResult>;
}
