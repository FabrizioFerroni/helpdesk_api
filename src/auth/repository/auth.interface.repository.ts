import { UserEntity } from '@/api/users/entity/user.entity';
import { BaseAbstractRepository } from '@/config/database/mysql/mysql.base.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export abstract class AuthInterfaceRepository extends BaseAbstractRepository<UserEntity> {
  abstract getUserByEmail(email: string): Promise<UserEntity>;
}
