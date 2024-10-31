import { Injectable } from '@nestjs/common';
import { BaseAbstractRepository } from '@/config/database/mysql/mysql.base.repository';
import { UpdateResult } from 'typeorm';
import { UserEntity } from '../entity/user.entity';

@Injectable()
export abstract class UserInterfaceRepository extends BaseAbstractRepository<UserEntity> {
  abstract getAllUsers(
    skip?: number,
    take?: number,
    deletedAt?: boolean,
  ): Promise<[UserEntity[], number]>;
  abstract getUserById(id: string, deleted?: boolean): Promise<UserEntity>;
  abstract getUserByEmail(email: string): Promise<UserEntity>;
  abstract saveUser(data: UserEntity): Promise<UserEntity>;
  abstract updateUser(id: string, data: UserEntity): Promise<UpdateResult>;
  abstract deleteUser(id: string): Promise<UpdateResult>;
  abstract restoreUser(id: string): Promise<UpdateResult>;
  abstract obtainWithRelations(): Promise<UserEntity[]>;
  abstract userAlreadyExists(email: string, id?: string): Promise<boolean>;
  abstract userAlreadyExistsById(
    id: string,
    deleted?: boolean,
  ): Promise<boolean>;
}
