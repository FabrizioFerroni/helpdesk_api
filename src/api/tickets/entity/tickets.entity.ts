import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TicketStatus } from '../enum/ticket-status.enum';
import { PriorityEntity } from '@/api/priority/entity/priority.entity';
import { CategoryEntity } from '@/api/category/entity/category.entity';
import { UserEntity } from '@/api/users/entity/user.entity';

@Entity({ name: 'tickets' })
export class TicketsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: false, length: 15, name: 'ticket_code' })
  ticketCode: string;

  @Column({ type: 'varchar', length: 250, nullable: false })
  title: string;

  @Column({ type: 'text', nullable: false })
  description: string;

  @Column({ type: 'varchar', default: 'Abierto' })
  status: string;

  @Column({ type: 'text', nullable: true, name: 'comments' })
  comments: string;

  @ManyToOne(() => PriorityEntity, {
    cascade: ['soft-remove'],
    nullable: false,
  })
  @JoinColumn({ name: 'priority_id' })
  priority: PriorityEntity;

  @ManyToOne(() => CategoryEntity, {
    cascade: ['soft-remove'],
    nullable: false,
  })
  @JoinColumn({ name: 'category_id' })
  category: CategoryEntity;

  @ManyToOne(() => UserEntity, {
    cascade: ['soft-remove'],
    nullable: false,
  })
  @JoinColumn({ name: 'creator_id' })
  creator: UserEntity;

  @ManyToOne(() => UserEntity, {
    cascade: ['soft-remove'],
    nullable: true,
  })
  @JoinColumn({ name: 'assigned_technician_id' })
  assignedTechnician: UserEntity;

  @Column({ nullable: true, name: 'assigned_date' })
  assignedDate: Date;

  @Column({ nullable: true, name: 'closed_date' })
  closedDate: Date;

  @CreateDateColumn({ name: 'created_at', select: true })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', select: false })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', select: false })
  deletedAt?: Date;
}
