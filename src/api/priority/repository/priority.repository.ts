import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { BaseAbstractRepository } from '@/config/database/mysql/mysql.base.repository';
import {
  FindManyOptions,
  FindOneOptions,
  IsNull,
  Not,
  Repository,
  UpdateResult,
} from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PriorityInterfaceRepository } from './priority.interface.repository';
import { PriorityEntity } from '../entity/priority.entity';
import { PriorityMessagesError } from '../error/error.messages';

export class PriorityRepository
  extends BaseAbstractRepository<PriorityEntity>
  implements PriorityInterfaceRepository
{
  constructor(
    @InjectRepository(PriorityEntity)
    public repository: Repository<PriorityEntity>,
  ) {
    super(repository);
  }

  async getAllPriorities(
    skip?: number,
    take?: number,
    deletedAt?: boolean,
  ): Promise<[PriorityEntity[], number]> {
    const options: FindManyOptions<PriorityEntity> = {
      skip,
      take,
      order: {
        createdAt: 'DESC',
      },
    };

    if (deletedAt) {
      options.withDeleted = true;
      options.where = { deletedAt: Not(IsNull()) };
    } else {
      options.where = { deletedAt: IsNull() };
    }

    return await this.findAndCount(options);
  }

  async getPriorityById(
    id: string,
    deleted?: boolean,
  ): Promise<PriorityEntity> {
    const option = {
      where: {
        id: id,
      },
      withDeleted: deleted,
    };
    return await this.findByCondition(option);
  }

  async getPriorityByIdForStatus(
    id: string,
    status: boolean,
    deleted?: boolean,
  ): Promise<PriorityEntity> {
    const option = {
      where: {
        id: id,
        status: status,
      },
      withDeleted: deleted,
    };
    return await this.findByCondition(option);
  }

  async getPrioritiesForStatus(status: boolean): Promise<PriorityEntity[]> {
    const options: FindOneOptions<PriorityEntity> = {
      where: {
        status: status,
        deletedAt: IsNull(),
      },
    };

    const result = await this.findAll(options);

    return result;
  }

  async getPriorityByName(name: string): Promise<PriorityEntity> {
    const option = {
      where: {
        name: name,
        deletedAt: IsNull(),
      },
    };
    return await this.findByCondition(option);
  }

  async savePriority(data: PriorityEntity): Promise<PriorityEntity> {
    const create: PriorityEntity = this.create(data);
    const prioritySaved: PriorityEntity = await this.save(create);

    if (!prioritySaved)
      throw new BadRequestException(PriorityMessagesError.PRIORITY_ERROR);

    return prioritySaved;
  }

  async updatePriority(
    id: string,
    data: PriorityEntity,
  ): Promise<UpdateResult> {
    return await this.update(id, data);
  }

  async deletePriority(id: string): Promise<UpdateResult> {
    return await this.softDelete(id);
  }

  async restorePriority(id: string) {
    return await this.restore(id);
  }

  async obtainWithRelations(): Promise<PriorityEntity[]> {
    const options = {
      relations: {},
    };
    return await this.findWithRelations(options);
  }

  async priorityAlreadyExists(name: string, id?: string): Promise<boolean> {
    let result: PriorityEntity;

    if (!id) {
      const options = {
        where: {
          name: String(name),
        },
      };

      result = await this.findByCondition(options);
    } else {
      const options = {
        where: {
          name: String(name),
          id: Not(id),
        },
      };

      result = await this.findByCondition(options);
    }

    return !!result;
  }

  async priorityAlreadyExistsById(
    id: string,
    deleted?: boolean,
  ): Promise<boolean> {
    const options = {
      where: {
        id: id,
      },
      withDeleted: deleted,
    };

    return await this.exists(options);
  }
}
