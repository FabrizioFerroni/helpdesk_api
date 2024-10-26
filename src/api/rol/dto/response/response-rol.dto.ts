import { Exclude, Expose, Transform } from 'class-transformer';

export class ResponseRolDto {
  @Expose({ name: 'id' })
  @Transform((value) => value.value.toString(), { toPlainOnly: true })
  id: string;

  @Expose()
  rol: string;

  @Expose()
  description: string;

  @Exclude()
  createdAt: Date;

  @Exclude()
  updatedAt: Date;

  @Exclude()
  deletedAt: Date;
}
