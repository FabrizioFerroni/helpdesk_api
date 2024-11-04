import { BaseAbstractRepository } from '@/config/database/mysql/mysql.base.repository';
import { PriorityEntity } from '../entity/priority.entity';
import { Injectable } from '@nestjs/common';
import { UpdateResult } from 'typeorm';

@Injectable()
export abstract class PriorityInterfaceRepository extends BaseAbstractRepository<PriorityEntity> {
  abstract getAllPriorities(
    skip?: number,
    take?: number,
    deletedAt?: boolean,
  ): Promise<[PriorityEntity[], number]>;
  abstract getPriorityById(
    id: string,
    deleted?: boolean,
  ): Promise<PriorityEntity>;
  abstract getPriorityByIdForStatus(
    id: string,
    status: boolean,
    deleted?: boolean,
  ): Promise<PriorityEntity>;
  abstract getPrioritiesForStatus(status: boolean): Promise<PriorityEntity[]>;
  abstract getPriorityByName(name: string): Promise<PriorityEntity>;
  abstract savePriority(data: PriorityEntity): Promise<PriorityEntity>;
  abstract updatePriority(
    id: string,
    data: PriorityEntity,
  ): Promise<UpdateResult>;
  abstract deletePriority(id: string): Promise<UpdateResult>;
  abstract restorePriority(id: string): Promise<UpdateResult>;
  abstract obtainWithRelations(): Promise<PriorityEntity[]>;
  abstract priorityAlreadyExists(name: string, id?: string): Promise<boolean>;
  abstract priorityAlreadyExistsById(
    id: string,
    deleted?: boolean,
  ): Promise<boolean>;
}
