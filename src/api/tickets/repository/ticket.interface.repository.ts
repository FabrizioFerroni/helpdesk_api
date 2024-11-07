import { BaseAbstractRepository } from '@/config/database/mysql/mysql.base.repository';
import { Injectable } from '@nestjs/common';
import { TicketsEntity } from '../entity/tickets.entity';
import { UserEntity } from '@/api/users/entity/user.entity';
import { UpdateResult } from 'typeorm';

@Injectable()
export abstract class TicketsInterfaceRepository extends BaseAbstractRepository<TicketsEntity> {
  abstract getAllTickets(
    skip: number,
    take: number,
    deletedAt?: boolean,
  ): Promise<[TicketsEntity[], number]>;

  abstract getAllTicketsForUser(
    skip: number,
    take: number,
    usuario: UserEntity,
    deletedAt?: boolean,
  ): Promise<[TicketsEntity[], number]>;

  abstract getTicketById(id: string, deleted?: boolean): Promise<TicketsEntity>;

  abstract getTicketByCode(ticketCode: string): Promise<TicketsEntity>;

  abstract createTicket(data: TicketsEntity): Promise<TicketsEntity>;

  abstract updateTicket(id: string, data: TicketsEntity): Promise<UpdateResult>;

  abstract deleteTicket(id: string): Promise<UpdateResult>;

  abstract restoreTicket(id: string): Promise<UpdateResult>;

  async ticketAlreadyExistsById(
    id: string,
    deleted?: boolean,
  ): Promise<boolean> {
    const options = {
      where: {
        id: id,
      },
      withDeleted: deleted,
    };

    return await this.exists(options);
  }
}
