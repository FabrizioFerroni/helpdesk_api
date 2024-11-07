import { Exclude, Expose, Transform } from 'class-transformer';
import { TicketStatus } from '../../enum/ticket-status.enum';
import { CategoryEntity } from '@/api/category/entity/category.entity';
import { PriorityEntity } from '@/api/priority/entity/priority.entity';
import { UserEntity } from '@/api/users/entity/user.entity';

export class ResponseTicketsDto {
  @Expose({ name: 'id' })
  @Transform((value) => value.value.toString(), { toPlainOnly: true })
  id: string;

  @Expose()
  ticketCode: string;

  @Expose()
  title: string;

  @Expose()
  description: string;

  @Expose()
  status: string;

  @Expose()
  comments: string;

  @Expose({ name: 'category' })
  @Transform(({ value }) => (value ? value.name.toString() : null), {
    toPlainOnly: true,
  })
  category: CategoryEntity;

  @Expose({ name: 'priority' })
  @Transform(({ value }) => (value ? value.name.toString() : null), {
    toPlainOnly: true,
  })
  priority: PriorityEntity;

  @Expose({ name: 'creator' })
  @Transform(
    ({ value }) =>
      value
        ? `${value.firstName.toString()} ${value.lastName.toString()}`
        : null,
    {
      toPlainOnly: true,
    },
  )
  creator: UserEntity;

  @Expose({ name: 'assignedTechnician' })
  @Transform(
    ({ value }) =>
      value
        ? `${value.firstName.toString()} ${value.lastName.toString()}`
        : null,
    {
      toPlainOnly: true,
    },
  )
  assignedTechnician: UserEntity;

  @Expose()
  assignedDate: Date;

  @Expose()
  closedDate: Date;

  @Exclude()
  createdAt: Date;

  @Exclude()
  updatedAt: Date;

  @Exclude()
  deletedAt: Date;
}
