import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PriorityRepository } from '../repository/priority.repository';
import { PriorityInterfaceRepository } from '../repository/priority.interface.repository';
import { TransformDto } from '@/shared/utils';
import { PriorityEntity } from '../entity/priority.entity';
import { ResponsePriorityDto } from '../dto/response/response-priority.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PaginationService } from '@/core/services/pagination.service';
import { PriorityMessagesError } from '../error/error.messages';
import { separateUUIDUser } from '@/shared/utils/functions/separate-uuid';
import { PaginationDto } from '@/shared/utils/dtos/pagination.dto';
import { DefaultPageSize } from '@/shared/utils/constants/querying';
import { PaginationMeta } from '@/core/interfaces/pagination-meta.interface';
import { CreatePriorityDto } from '../dto/create-priority.dto';
import { plainToInstance } from 'class-transformer';
import { invalidateAllCacheKeys } from '@/shared/utils/functions/invalidate-cachekeys';
import { PriorityMessages } from '../messages/priority.messages';
import { UpdatePriorityDto } from '../dto/update-priority.dto';
import { UpdateResult } from 'typeorm';
import { ChangeStatusDto } from '@/shared/utils/dtos/change-status.dto';

const KEY: string = 'priorities';

@Injectable()
export class PriorityService {
  private readonly logger = new Logger(PriorityService.name, {
    timestamp: true,
  });

  constructor(
    @Inject(PriorityInterfaceRepository)
    private readonly priorityRepository: PriorityInterfaceRepository,
    @Inject(TransformDto)
    private readonly transform: TransformDto<
      PriorityEntity,
      ResponsePriorityDto
    >,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly paginationService: PaginationService,
  ) {}

  async verifyPriority(id: string, deleted?: boolean) {
    const priority = await this.priorityRepository.getPriorityById(id, deleted);

    if (!priority)
      throw new NotFoundException(PriorityMessagesError.PRIORITY_NOT_FOUND);

    return priority;
  }

  async validateNamelBD(name: string, id?: string): Promise<void> {
    const existInBD = await this.priorityRepository.priorityAlreadyExists(
      name,
      id,
    );

    if (existInBD) {
      throw new BadRequestException(
        PriorityMessagesError.PRIORITY_ALREADY_EXIST,
      );
    }
  }

  async getAllPriorities(
    usuario_id: string,
    param: PaginationDto,
    deletedAt?: boolean,
  ) {
    const { page, limit } = param;

    const cacheKey = `${KEY}_${separateUUIDUser(usuario_id)}-${page}-${limit}${deletedAt ? '_deleted' : ''}`;

    const take = limit ?? DefaultPageSize.PRIORITIES;
    const skip = this.paginationService.calculateOffset(limit, page);

    const priorityCache = await this.cacheManager.get<{
      priorities: PriorityEntity[];
      meta: PaginationMeta;
    }>(cacheKey);

    const [data, count] = await this.priorityRepository.getAllPriorities(
      skip,
      take,
      deletedAt,
    );

    const priorities: PriorityEntity[] = this.transform.transformDtoArray(
      data,
      ResponsePriorityDto,
    );

    const meta = this.paginationService.createMeta(limit, page, count);

    if (priorityCache) {
      const priorityCacheResp = this.transform.transformDtoArray(
        priorityCache.priorities,
        ResponsePriorityDto,
      );
      return { priorities: priorityCacheResp, meta: priorityCache.meta };
    }

    const response = { priorities, meta };
    await this.cacheManager.set(cacheKey, response);

    return response;
  }

  async getPrioritiesForStatus(status: string) {
    if (status === undefined) {
      throw new BadRequestException(PriorityMessagesError.INVALID_STATUS);
    }

    const statusToNumber = status === 'true' ? true : false;

    const priorities =
      await this.priorityRepository.getPrioritiesForStatus(statusToNumber);

    return this.transform.transformDtoArray(priorities, ResponsePriorityDto);
  }

  async getPriorityById(id: string) {
    const priority = await this.verifyPriority(id, false);

    if (!priority) {
      this.logger.warn(
        `No se ha encontrado la prioridad con el id: ${id} en nuestra base de datos`,
      );

      throw new NotFoundException(PriorityMessagesError.PRIORITY_NOT_FOUND);
    }

    return this.transform.transformDtoObject(priority, ResponsePriorityDto);
  }

  async createPriority(dto: CreatePriorityDto, usuario_id?: string) {
    const { name } = dto;

    await this.validateNamelBD(name);

    const newPriority = {
      name,
      status: true,
    };

    const data: PriorityEntity = plainToInstance(PriorityEntity, newPriority);

    const priorityNew = await this.priorityRepository.savePriority(data);

    if (!priorityNew) {
      throw new InternalServerErrorException(
        PriorityMessagesError.INTERNAL_SERVER_ERROR,
      );
    }

    invalidateAllCacheKeys(this.cacheManager, KEY, usuario_id);

    return PriorityMessages.PRIORITY_CREATED;
  }

  async updatePriority(
    id: string,
    data: UpdatePriorityDto,
    usuario_id?: string,
  ) {
    const { name } = data;

    await this.validateNamelBD(name, id);

    const priorityToUpdate: Partial<PriorityEntity> = {};

    for (const key in data) {
      if (data[key] !== undefined && data[key] !== null) {
        priorityToUpdate[key] = data[key];
      }
    }

    const priorityUpdate = await this.priorityRepository.updatePriority(
      id,
      priorityToUpdate as PriorityEntity,
    );

    if (!priorityUpdate) {
      return PriorityMessagesError.PRIORITY_ERROR;
    }

    invalidateAllCacheKeys(this.cacheManager, KEY, usuario_id);

    return PriorityMessages.PRIORITY_UPDATED;
  }

  async activeOrDesactivePriority(
    id: string,
    { status }: ChangeStatusDto,
    usuario_id?: string,
  ) {
    const category = await this.verifyPriority(id);

    if (!category) {
      this.logger.warn(
        `activeOrDesactivePriority: No se ha encontrado una prioridad con el id: ${id} en nuestra base de datos`,
      );

      throw new NotFoundException(PriorityMessagesError.PRIORITY_NOT_FOUND);
    }

    const priorityToUpdate: Partial<PriorityEntity> = { status };

    const categoryUpdateResult = await this.priorityRepository.updatePriority(
      id,
      priorityToUpdate as PriorityEntity,
    );

    if (!categoryUpdateResult.affected) {
      throw new BadRequestException(PriorityMessagesError.PRIORITY_ERROR);
    }

    invalidateAllCacheKeys(this.cacheManager, KEY, usuario_id);

    let msgResult: string;

    status
      ? (msgResult = PriorityMessages.PRIORITY_ACTIVED)
      : (msgResult = PriorityMessages.PRIORITY_DESACTIVED);

    return msgResult;
  }

  async deletePriority(id: string, usuario_id?: string) {
    await this.verifyPriority(id, false);

    const categoryDeleted: UpdateResult =
      await this.priorityRepository.deletePriority(id);

    if (!categoryDeleted.affected) {
      throw new BadRequestException(PriorityMessagesError.PRIORITY_NOT_DELETED);
    }

    invalidateAllCacheKeys(this.cacheManager, KEY, usuario_id);

    return PriorityMessages.PRIORITY_REMOVED;
  }

  async restorePriority(id: string, usuario_id?: string) {
    const priorityExist =
      await this.priorityRepository.priorityAlreadyExistsById(id, true);

    const category = await this.verifyPriority(id, true);

    if (!priorityExist) {
      this.logger.warn(
        `No se ha encontrado una prioridad con el id: ${id} en nuestra base de datos`,
      );

      throw new NotFoundException(PriorityMessagesError.PRIORITY_NOT_FOUND);
    }

    const priorityDeleted: UpdateResult =
      await this.priorityRepository.restorePriority(id);

    if (!priorityDeleted.affected) {
      throw new BadRequestException(
        PriorityMessagesError.PRIORITY_NOT_RESTORED,
      );
    }

    invalidateAllCacheKeys(this.cacheManager, KEY, usuario_id);

    return PriorityMessages.PRIORITY_RESTORED;
  }
}
