import { BadRequestException } from '@nestjs/common';
import { BaseAbstractRepository } from '@/config/database/mysql/mysql.base.repository';
import {
  FindManyOptions,
  FindOneOptions,
  IsNull,
  Not,
  Repository,
  UpdateResult,
} from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { TicketsEntity } from '../entity/tickets.entity';
import { TicketsInterfaceRepository } from './ticket.interface.repository';
import { UserEntity } from '@/api/users/entity/user.entity';
import { TicketErrorMessages } from '../error/error.messages';

export class TicketsRepository
  extends BaseAbstractRepository<TicketsEntity>
  implements TicketsInterfaceRepository
{
  constructor(
    @InjectRepository(TicketsEntity)
    private readonly repository: Repository<TicketsEntity>,
  ) {
    super(repository);
  }

  async getAllTickets(
    skip: number,
    take: number,
    deletedAt?: boolean,
  ): Promise<[TicketsEntity[], number]> {
    const options: FindManyOptions<TicketsEntity> = {
      skip,
      take,
      order: {
        createdAt: 'DESC',
      },
      relations: ['priority', 'category', 'creator', 'assignedTechnician'],
    };

    if (deletedAt) {
      options.withDeleted = true;
      options.where = { deletedAt: Not(IsNull()) };
    } else {
      options.where = { deletedAt: IsNull() };
    }

    return await this.repository.findAndCount(options);
  }

  async getAllTicketsForUser(
    skip: number,
    take: number,
    { id }: UserEntity,
    deletedAt?: boolean,
  ): Promise<[TicketsEntity[], number]> {
    const options: FindManyOptions<TicketsEntity> = {
      skip,
      take,
      order: {
        createdAt: 'DESC',
      },
      relations: ['priority', 'category', 'creator', 'assignedTechnician'],
      where: {
        creator: {
          id,
        },
      },
    };
    if (deletedAt) {
      options.withDeleted = true;
      options.where = {
        deletedAt: Not(IsNull()),
      };
    } else {
      options.where = { deletedAt: IsNull() };
    }

    return await this.repository.findAndCount(options);
  }

  async getTicketById(id: string): Promise<TicketsEntity> {
    const options: FindOneOptions<TicketsEntity> = {
      where: { id },
      relations: ['priority', 'category', 'creator', 'assignedTechnician'],
    };

    return await this.repository.findOne(options);
  }

  async getTicketByCode(ticketCode: string): Promise<TicketsEntity> {
    const options: FindOneOptions<TicketsEntity> = {
      where: { ticketCode, deletedAt: IsNull() },
      relations: ['priority', 'category', 'creator', 'assignedTechnician'],
    };

    return await this.repository.findOne(options);
  }

  async createTicket(data: TicketsEntity): Promise<TicketsEntity> {
    const create: TicketsEntity = this.create(data);
    const ticketSaved: TicketsEntity = await this.save(create);

    if (!ticketSaved)
      throw new BadRequestException(TicketErrorMessages.TICKET_ERROR);

    return ticketSaved;
  }

  async updateTicket(id: string, data: TicketsEntity): Promise<UpdateResult> {
    return await this.update(id, data);
  }

  async deleteTicket(id: string): Promise<UpdateResult> {
    return await this.softDelete(id);
  }

  async restoreTicket(id: string): Promise<UpdateResult> {
    return await this.restore(id);
  }

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
