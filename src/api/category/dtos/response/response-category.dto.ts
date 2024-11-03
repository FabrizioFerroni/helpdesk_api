import { Exclude, Expose, Transform } from 'class-transformer';
import { CategoryType } from '../../enum/category.enum';
import { CategoryEntity } from '../../entity/category.entity';

export class ResponseCategoryDto {
  @Expose({ name: 'id' })
  @Transform((value) => value.value.toString(), { toPlainOnly: true })
  id: string;

  @Expose()
  name: string;

  @Expose()
  type: CategoryType;

  @Expose({ name: 'category' })
  @Transform(({ value }) => (value ? value.name.toString() : null), {
    toPlainOnly: true,
  })
  parent: CategoryEntity;

  @Expose()
  status: boolean;

  @Exclude()
  createdAt: Date;

  @Exclude()
  updatedAt: Date;

  @Exclude()
  deletedAt: Date;
}
