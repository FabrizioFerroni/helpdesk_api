import { RolEntity } from '@/api/rol/entity/rol.entity';
import { Exclude, Expose, Transform } from 'class-transformer';

export class AuthResponseDto {
  @Expose({ name: 'id' })
  @Transform((value) => value.value.toString(), { toPlainOnly: true })
  id: string;

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  email: string;

  @Exclude()
  password: string;

  @Expose()
  active: boolean;

  @Expose({ name: 'rol' })
  @Transform(({ value }) => value.rol.toString(), { toPlainOnly: true })
  rol: RolEntity;

  @Exclude()
  createdAt: Date;

  @Exclude()
  updatedAt: Date;

  @Exclude()
  deletedAt: Date;

  @Expose()
  access_token: string;

  @Expose()
  refresh_token: string;
}
