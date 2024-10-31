import { UserEntity } from '@/api/users/entity/user.entity';
import { BaseAbstractRepository } from '@/config/database/mysql/mysql.base.repository';
import { AuthInterfaceRepository } from './auth.interface.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export class AuthRepository
  extends BaseAbstractRepository<UserEntity>
  implements AuthInterfaceRepository
{
  constructor(
    @InjectRepository(UserEntity)
    public repository: Repository<UserEntity>,
  ) {
    super(repository);
  }

  async getUserByEmail(email: string): Promise<UserEntity> {
    const options = {
      where: {
        email: String(email),
      },
      relations: {
        rol: true,
      },
    };

    const user = await this.findByCondition(options);

    if (!user) {
      return null;
    }

    return user;
  }
}
