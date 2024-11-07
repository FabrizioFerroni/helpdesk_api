import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { TicketsInterfaceRepository } from '../repository/ticket.interface.repository';
import { TransformDto } from '@/shared/utils';
import { TicketsEntity } from '../entity/tickets.entity';
import { ResponseTicketsDto } from '../dtos/response/response-ticket.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PaginationService } from '@/core/services/pagination.service';
import { PaginationDto } from '@/shared/utils/dtos/pagination.dto';
import { separateUUIDUser } from '@/shared/utils/functions/separate-uuid';
import { DefaultPageSize } from '@/shared/utils/constants/querying';
import { PaginationMeta } from '@/core/interfaces/pagination-meta.interface';
import { UserService } from '@/api/users/service/user.service';
import { CategoryService } from '@/api/category/service/category.service';
import { PriorityService } from '@/api/priority/service/priority.service';
import { UserMessagesError } from '@/api/users/errors/error-messages';
import { TicketErrorMessages } from '../error/error.messages';
import { CreateTicketDto } from '../dtos/create-ticket.dto';
import { CategoryMessagesError } from '@/api/category/error/error.messages';
import { PriorityMessagesError } from '@/api/priority/error/error.messages';
import { plainToInstance } from 'class-transformer';
import { invalidateAllCacheKeys } from '@/shared/utils/functions/invalidate-cachekeys';
import { TicketsMessages } from '../messages/tickets.messages';
import { generateRandomWord } from '@/shared/utils/functions/generateRandomWords';
import { ChangeStatusTicketDto } from '../dtos/change-status-ticket.dto';
import { TicketStatus } from '../enum/ticket-status.enum';
import { AssignTechDto } from '../dtos/assign-tech.dto';
import { UpdateResult } from 'typeorm';

const KEY: string = 'tickets';

@Injectable()
export class TicketService {
  private readonly logger = new Logger(TicketService.name, {
    timestamp: true,
  });

  constructor(
    @Inject(TicketsInterfaceRepository)
    private readonly ticketsRepository: TicketsInterfaceRepository,
    @Inject(TransformDto)
    private readonly transform: TransformDto<TicketsEntity, ResponseTicketsDto>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly paginationService: PaginationService,
    @Inject(UserService)
    private readonly userService: UserService,
    @Inject(CategoryService)
    private readonly categoryService: CategoryService,
    @Inject(PriorityService)
    private readonly priorityService: PriorityService,
  ) {}

  transformArray(data: TicketsEntity[]) {
    return this.transform.transformDtoArray(data, ResponseTicketsDto);
  }

  transformObject(data: TicketsEntity) {
    return this.transform.transformDtoObject(data, ResponseTicketsDto);
  }

  async getAllTickets(
    usuario_id: string,
    param: PaginationDto,
    deletedAt?: boolean,
  ) {
    const { page, limit } = param;

    const cacheKey = `${KEY}_${separateUUIDUser(usuario_id)}-${page}-${limit}${deletedAt ? '_deleted' : ''}`;

    const take = limit ?? DefaultPageSize.TICKETS;
    const skip = this.paginationService.calculateOffset(limit, page);

    const ticketCache = await this.cacheManager.get<{
      tickets: TicketsEntity[];
      meta: PaginationMeta;
    }>(cacheKey);

    const [data, count] = await this.ticketsRepository.getAllTickets(
      skip,
      take,
      deletedAt,
    );

    data.forEach(({ creator, assignedTechnician }) => {
      delete creator.password;

      if (assignedTechnician) delete assignedTechnician.password;
    });

    const tickets: TicketsEntity[] = this.transformArray(data);

    const meta = this.paginationService.createMeta(limit, page, count);

    if (ticketCache) {
      const ticketCacheResp = this.transformArray(ticketCache.tickets);
      return { tickets: ticketCacheResp, meta: ticketCache.meta };
    }

    const response = { tickets, meta };
    await this.cacheManager.set(cacheKey, response);

    return response;
  }

  async getAllTicketsForUser(
    usuario_id: string,
    param: PaginationDto,
    deletedAt?: boolean,
  ) {
    const { page, limit } = param;
    const cacheKey = `${KEY}_${separateUUIDUser(usuario_id)}-${page}-${limit}${deletedAt ? '_deleted' : ''}`;

    const take = limit ?? DefaultPageSize.TICKETS;
    const skip = this.paginationService.calculateOffset(limit, page);

    const ticketCache = await this.cacheManager.get<{
      tickets: TicketsEntity[];
      meta: PaginationMeta;
    }>(cacheKey);

    const user = await this.userService.getUserById(usuario_id);

    if (!user) {
      throw new NotFoundException(UserMessagesError.USER_NOT_FOUND);
    }

    const [data, count] = await this.ticketsRepository.getAllTicketsForUser(
      skip,
      take,
      user,
      deletedAt,
    );

    data.forEach(({ creator, assignedTechnician }) => {
      delete creator.password;

      if (assignedTechnician) delete assignedTechnician.password;
    });

    const tickets: TicketsEntity[] = this.transformArray(data);

    const meta = this.paginationService.createMeta(limit, page, count);

    if (ticketCache) {
      const ticketCacheResp = this.transformArray(ticketCache.tickets);
      return { tickets: ticketCacheResp, meta: ticketCache.meta };
    }

    const response = { tickets, meta };
    await this.cacheManager.set(cacheKey, response);

    return response;
  }

  async getTicketById(id: string, deleted?: boolean): Promise<TicketsEntity> {
    const ticket = await this.ticketsRepository.getTicketById(id, deleted);

    if (!ticket) {
      this.logger.warn(
        `No se ha encontrado el ticket con el id: ${id} en nuestra base de datos`,
      );
      throw new NotFoundException(TicketErrorMessages.TICKET_NOT_FOUND);
    }

    return this.transformObject(ticket);
  }

  async getTicketByTicketCode(ticketCode: string): Promise<TicketsEntity> {
    const ticket = await this.ticketsRepository.getTicketByCode(ticketCode);

    if (!ticket) {
      this.logger.warn(
        `No se ha encontrado el ticket con el ticket code: ${ticketCode} en nuestra base de datos`,
      );
      throw new NotFoundException(TicketErrorMessages.TICKET_NOT_FOUND);
    }

    return this.transformObject(ticket);
  }

  async createTicket(
    dto: CreateTicketDto,
    usuario_id: string,
  ): Promise<string> {
    const { title, description, category_id, priority_id } = dto;

    const user = await this.userService.getUserById(usuario_id);

    if (!user) {
      throw new NotFoundException(UserMessagesError.USER_NOT_FOUND);
    }

    const category = await this.categoryService.getCategoryById(category_id);

    if (!category) {
      throw new NotFoundException(CategoryMessagesError.CATEGORY_NOT_FOUND);
    }

    const priority = await this.priorityService.getPriorityById(priority_id);

    if (!priority) {
      throw new NotFoundException(PriorityMessagesError.PRIORITY_NOT_FOUND);
    }

    const ticketCode = generateRandomWord(15);

    const comments: string = `El usuario: ${user.firstName} ${user.lastName} abrió un nuevo ticket`;

    const newTicket = {
      ticketCode: ticketCode.toLocaleLowerCase(),
      title,
      description,
      category,
      priority,
      creator: user,
      comments,
    };

    const data: TicketsEntity = plainToInstance(TicketsEntity, newTicket);

    const ticketNew = await this.ticketsRepository.createTicket(data);

    if (!ticketNew) {
      throw new InternalServerErrorException(
        TicketErrorMessages.INTERNAL_SERVER_ERROR,
      );
    }

    //TODO: Cargar documentos y guardarlo en otra tabla.

    invalidateAllCacheKeys(this.cacheManager, KEY, usuario_id);

    return TicketsMessages.TICKET_CREATED;
  }

  async changeStatusTicket(
    id: string,
    dto: ChangeStatusTicketDto,
    usuario_id?: string,
  ) {
    const { comments, status } = dto;

    console.log(status);

    const ticket = await this.ticketsRepository.getTicketById(id);

    if (!ticket) {
      throw new NotFoundException(TicketErrorMessages.TICKET_NOT_FOUND);
    }

    const ticketToUpdate: Partial<TicketsEntity> = { status, comments };

    const ticketUpdateResult = await this.ticketsRepository.updateTicket(
      id,
      ticketToUpdate as TicketsEntity,
    );

    if (!ticketUpdateResult.affected) {
      throw new BadRequestException(PriorityMessagesError.PRIORITY_ERROR);
    }

    invalidateAllCacheKeys(this.cacheManager, KEY, usuario_id);

    return TicketsMessages.TICKET_CHANGE_STATUS;
  }

  async assingTech(id: string, dto: AssignTechDto, usuario_id?: string) {
    const { assigned_tech_id } = dto;

    const ticket = await this.ticketsRepository.getTicketById(id);

    if (!ticket) {
      throw new NotFoundException(TicketErrorMessages.TICKET_NOT_FOUND);
    }
    //Hasta aca todo ok.

    const user = await this.userService.getUserById(assigned_tech_id);

    if (!user) {
      throw new NotFoundException(UserMessagesError.USER_NOT_FOUND);
    }

    const ticketToUpdate: Partial<TicketsEntity> = {
      assignedDate: new Date(),
      assignedTechnician: user,
    };

    const ticketUpdateResult = await this.ticketsRepository.updateTicket(
      id,
      ticketToUpdate as TicketsEntity,
    );

    if (!ticketUpdateResult.affected) {
      throw new BadRequestException(PriorityMessagesError.PRIORITY_ERROR);
    }

    invalidateAllCacheKeys(this.cacheManager, KEY, usuario_id);

    return TicketsMessages.TICKET_CHANGE_STATUS;
  }

  async deleteTicket(id: string, usuario_id?: string) {
    const ticket = await this.ticketsRepository.getTicketById(id, false);

    if (!ticket) {
      throw new NotFoundException(TicketErrorMessages.TICKET_NOT_FOUND);
    }

    const deleteResult: UpdateResult =
      await this.ticketsRepository.deleteTicket(id);

    if (!deleteResult.affected) {
      throw new BadRequestException(TicketErrorMessages.TICKET_ERROR);
    }

    invalidateAllCacheKeys(this.cacheManager, KEY, usuario_id);

    return TicketsMessages.TICKET_REMOVED;
  }

  async restoreTicket(id: string, usuario_id?: string) {
    const ticketExist = await this.ticketsRepository.ticketAlreadyExistsById(
      id,
      true,
    );

    if (!ticketExist) {
      this.logger.warn(
        `No se ha encontrado un ticket con el id: ${id} en nuestra base de datos`,
      );

      throw new NotFoundException(TicketErrorMessages.TICKET_NOT_FOUND);
    }

    const ticketRestored: UpdateResult =
      await this.ticketsRepository.restoreTicket(id);

    if (!ticketRestored.affected) {
      throw new BadRequestException(TicketErrorMessages.TICKET_NOT_RESTORED);
    }

    invalidateAllCacheKeys(this.cacheManager, KEY, usuario_id);

    return TicketsMessages.TICKET_RESTORED;
  }
}
