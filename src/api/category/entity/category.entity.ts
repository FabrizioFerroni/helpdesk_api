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
import { CategoryType } from '../enum/category.enum';

@Entity({ name: 'categories' })
export class CategoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'enum', enum: CategoryType })
  type: CategoryType;

  @ManyToOne(() => CategoryEntity, (category) => category.id, {
    nullable: true,
    cascade: ['soft-remove'],
  })
  @JoinColumn({ name: 'parent_id' })
  parent: CategoryEntity;

  @Column({ default: 0 })
  status: boolean;

  @CreateDateColumn({ name: 'created_at', select: true })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', select: false })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', select: false })
  deletedAt?: Date;
}
