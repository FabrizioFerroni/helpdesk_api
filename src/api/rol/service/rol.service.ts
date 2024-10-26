import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { RolInterfaceRepository } from '../repository/rol.interface.repository';
import { TransformDto } from '@/shared/utils';
import { RolEntity } from '../entity/rol.entity';
import { ResponseRolDto } from '../dto/response/response-rol.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PaginationDto } from '@/shared/utils/dtos/pagination.dto';
import { PaginationService } from '@/core/services/pagination.service';
import { DefaultPageSize } from '@/shared/utils/constants/querying';
import { RolMessagesError } from '../errors/error.messages';
import { separateUUIDUser } from '@/shared/utils/functions/separate-uuid';
import { CreateRolDto } from '../dto/create-rol.dto';
import { PaginationMeta } from '@/core/interfaces/pagination-meta.interface';
import { plainToInstance } from 'class-transformer';
import { RolMessages } from '../messages/rol.messages';
import { UpdateRolDto } from '../dto/update-rol.dto';
import { UpdateResult } from 'typeorm';

const KEY: string = 'roles';
@Injectable()
export class RolService {
  private readonly logger = new Logger(RolService.name, {
    timestamp: true,
  });

  constructor(
    @Inject(RolInterfaceRepository)
    private readonly rolRepository: RolInterfaceRepository,
    @Inject(TransformDto)
    private readonly transform: TransformDto<RolEntity, ResponseRolDto>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly paginationService: PaginationService,
  ) {}

  async verifyRol(id: string) {
    const rol = await this.rolRepository.getRoleById(id);

    if (!rol) throw new NotFoundException(RolMessagesError.ROL_NOT_FOUND);

    return rol;
  }

  async invalidateAllCacheKeys(usuario_id?: string) {
    //TODO: Refactorizar esto para que elimine la data del usuario logueado y no elimine la data de otro usuario

    let keys: string[] = [];

    if (!usuario_id) {
      keys = await this.cacheManager.store.keys(`${KEY}-*`);
    } else {
      keys = await this.cacheManager.store.keys(
        `${KEY}_${separateUUIDUser(usuario_id)}-*`,
      );
    }

    for (const key of keys) {
      await this.cacheManager.del(key);
    }
  }

  async findAll(deletedAt: boolean, usuario_id: string, param: PaginationDto) {
    const { page, limit } = param;

    const cacheKey = `${KEY}_${separateUUIDUser(usuario_id)}-${page}-${limit}${deletedAt ? '_deleted' : ''}`;

    const take = limit ?? DefaultPageSize.ROLES;
    const skip = this.paginationService.calculateOffset(limit, page);

    const rolesCache = await this.cacheManager.get<{
      roles: RolEntity[];
      meta: PaginationMeta;
    }>(cacheKey);

    const [data, count] = await this.rolRepository.obtenerTodos(
      deletedAt,
      skip,
      take,
    );

    const roles: RolEntity[] = this.transform.transformDtoArray(
      data,
      ResponseRolDto,
    );

    const meta = this.paginationService.createMeta(limit, page, count);

    if (rolesCache) {
      const rolCacheResp = this.transform.transformDtoArray(
        rolesCache.roles,
        ResponseRolDto,
      );
      return { roles: rolCacheResp, meta: rolesCache.meta };
    }

    const response = { roles, meta };
    await this.cacheManager.set(cacheKey, response);

    return response;
  }

  async getById(id: string) {
    const rol = await this.rolRepository.getRoleById(id);

    if (!rol) {
      this.logger.warn(
        `No se ha encontrado un rol con el id: ${id} en nuestra base de datos.`,
      );
      throw new NotFoundException(RolMessagesError.ROL_NOT_FOUND);
    }

    return this.transform.transformDtoObject(rol, ResponseRolDto);
  }

  async createRol(dto: CreateRolDto, isWeb: boolean, usuario_id?: string) {
    const { rol, description } = dto;

    const exist: boolean = await this.rolRepository.roleAlreadyExists(rol);

    if (exist && isWeb) {
      throw new BadRequestException(RolMessagesError.ROL_ALREADY_EXISTS);
    }

    if (!exist) {
      const newRole = {
        rol,
        description,
      };

      const data = plainToInstance(RolEntity, newRole);

      const rolSaved = await this.rolRepository.saveRol(data);

      if (!rolSaved) {
        throw new BadRequestException(RolMessagesError.ROL_NOT_SAVED);
      }

      this.invalidateAllCacheKeys(usuario_id);

      return RolMessages.ROL_CREATED;
    }

    return;
  }

  async updateRol(
    id: string,
    dto: UpdateRolDto,
    isWeb: boolean,
    usuario_id?: string,
  ) {
    const { rol } = dto;

    await this.verifyRol(id);

    const roleToUpdated: Partial<RolEntity> = {};

    for (const key in dto) {
      if (dto[key] !== undefined && dto[key] !== null) {
        roleToUpdated[key] = dto[key];
      }
    }

    const exist: boolean = await this.rolRepository.roleAlreadyExists(rol);

    if (exist && isWeb) {
      throw new BadRequestException(RolMessagesError.ROL_ALREADY_EXISTS);
    }

    if (!exist) {
      const rolUpdated: UpdateResult = await this.rolRepository.updateRol(
        id,
        roleToUpdated as RolEntity,
      );

      if (!rolUpdated.affected) {
        throw new BadRequestException(RolMessagesError.ROL_NOT_SAVED);
      }

      this.invalidateAllCacheKeys(usuario_id);

      return RolMessages.ROL_UPDATED;
    }
  }

  async deleteRol(id: string, usuario_id?: string) {
    await this.verifyRol(id);

    const rolDeleted: UpdateResult = await this.rolRepository.deleteRolById(id);

    if (!rolDeleted.affected) {
      throw new BadRequestException(RolMessagesError.ROL_NOT_DELETED);
    }

    this.invalidateAllCacheKeys(usuario_id);

    return RolMessages.ROL_REMOVED;
  }

  async restoreRol(id: string, usuario_id?: string) {
    const rol = await this.rolRepository.existeReg(id, true);

    if (!rol) throw new NotFoundException(RolMessagesError.ROL_NOT_FOUND);

    const rolDeleted: UpdateResult =
      await this.rolRepository.restoreRolById(id);

    if (!rolDeleted.affected) {
      throw new BadRequestException(RolMessagesError.ROL_NOT_DELETED);
    }

    this.invalidateAllCacheKeys(usuario_id);

    return RolMessages.ROL_RESTORED;
  }
}
