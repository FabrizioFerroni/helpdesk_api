import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { BaseAbstractRepository } from '@/config/database/mysql/mysql.base.repository';
import {
  FindManyOptions,
  IsNull,
  Not,
  Repository,
  UpdateResult,
} from 'typeorm';
import { UserEntity } from '../entity/user.entity';
import { UserInterfaceRepository } from './user.interface.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { UserMessagesError } from '../errors/error-messages';

export class UserRepository
  extends BaseAbstractRepository<UserEntity>
  implements UserInterfaceRepository
{
  constructor(
    @InjectRepository(UserEntity)
    public repository: Repository<UserEntity>,
  ) {
    super(repository);
  }

  async getAllUsers(
    skip?: number,
    take?: number,
    deletedAt?: boolean,
  ): Promise<[UserEntity[], number]> {
    const options: FindManyOptions<UserEntity> = {
      skip,
      take,
      relations: {
        rol: true,
      },
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

  async getUserById(id: string, deleted?: boolean): Promise<UserEntity> {
    const option = {
      where: {
        id: id,
      },
      relations: {
        rol: true,
      },
    };
    return await this.findByCondition(option);
  }

  async getUserByEmail(email: string): Promise<UserEntity> {
    const option = {
      where: {
        email: email,
      },
      relations: {
        rol: true,
      },
    };
    return await this.findByCondition(option);
  }

  async saveUser(data: UserEntity): Promise<UserEntity> {
    const create: UserEntity = this.create(data);
    const userSaved: UserEntity = await this.save(create);

    if (!userSaved) throw new BadRequestException(UserMessagesError.USER_ERROR);

    return userSaved;
  }

  async updateUser(id: string, data: UserEntity): Promise<UpdateResult> {
    return await this.update(id, data);
  }

  async deleteUser(id: string): Promise<UpdateResult> {
    return await this.softDelete(id);
  }

  async restoreUser(id: string) {
    return await this.restore(id);
  }

  async obtainWithRelations(): Promise<UserEntity[]> {
    const options = {
      relations: {},
    };
    return await this.findWithRelations(options);
  }

  async userAlreadyExists(email: string, id?: string): Promise<boolean> {
    let result: UserEntity;

    if (!id) {
      const options = {
        where: {
          email: String(email),
        },
      };

      result = await this.findByCondition(options);
    } else {
      const options = {
        where: {
          email: String(email),
          id: Not(id),
        },
      };

      result = await this.findByCondition(options);
    }

    return !!result;
  }

  async userAlreadyExistsById(id: string, deleted?: boolean): Promise<boolean> {
    const options = {
      where: {
        id: id,
      },
      withDeleted: deleted,
    };

    return await this.exists(options);
  }
}
