import { TransformDto } from '@/shared/utils';
import { BadRequestException, Inject } from '@nestjs/common';
import {
  FindManyOptions,
  IsNull,
  Not,
  Repository,
  UpdateResult,
} from 'typeorm';
import { RolEntity } from '../entity/rol.entity';
import { ResponseRolDto } from '../dto/response/response-rol.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { RolInterfaceRepository } from './rol.interface.repository';
import { BaseAbstractRepository } from '@/config/database/mysql/mysql.base.repository';
import { RolMessagesError } from '../errors/error.messages';

export class RolRepository
  extends BaseAbstractRepository<RolEntity>
  implements RolInterfaceRepository
{
  constructor(
    @InjectRepository(RolEntity)
    public repository: Repository<RolEntity>,
    @Inject(TransformDto)
    private readonly transform: TransformDto<RolEntity, ResponseRolDto>,
  ) {
    super(repository);
  }

  async saveRol(data: RolEntity): Promise<RolEntity> {
    const create: RolEntity = this.create(data);
    const rolSaved: RolEntity = await this.save(create);

    if (!rolSaved) throw new BadRequestException(RolMessagesError.ROL_ERROR);

    return rolSaved;
  }

  async obtenerTodos(
    deletedAt?: boolean,
    skip?: number,
    take?: number,
  ): Promise<[RolEntity[], number]> {
    const options: FindManyOptions<RolEntity> = {
      skip,
      take,
    };

    if (deletedAt) {
      options.withDeleted = true;
      options.where = { deletedAt: Not(IsNull()) };
    } else {
      options.where = { deletedAt: IsNull() };
    }

    return await this.findAndCount(options);
  }

  async getRoleById(id: string): Promise<RolEntity> {
    return await this.findOneById(id);
  }

  async deleteRolById(id: string): Promise<UpdateResult> {
    return await this.softDelete(id);
  }

  async updateRol(id: string, data: RolEntity): Promise<UpdateResult> {
    return await this.update(id, data);
  }

  async obtenerRelaciones(): Promise<RolEntity[]> {
    const options = {
      relations: {},
    };
    return await this.findWithRelations(options);
  }

  async roleAlreadyExists(rol: string, id?: string): Promise<boolean> {
    let result: RolEntity;

    if (!id) {
      const options = {
        where: {
          rol: String(rol),
        },
      };

      result = await this.findByCondition(options);
    } else {
      const options = {
        where: {
          email: String(rol),
          id: Not(id),
        },
      };

      result = await this.findByCondition(options);
    }

    return !!result;
  }

  async existeReg(id: string, deleted?: boolean) {
    const options = {
      where: {
        id: id,
      },
      withDeleted: deleted,
    };

    return await this.exists(options);
  }

  async restoreRolById(id: string) {
    return await this.restore(id);
  }
}
