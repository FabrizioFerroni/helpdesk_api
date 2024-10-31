import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { UserInterfaceRepository } from '../repository/user.interface.repository';
import { TransformDto } from '@/shared/utils';
import { UserEntity } from '../entity/user.entity';
import { ResponseUserDto } from '../dto/response/response-user.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { plainToInstance } from 'class-transformer';
import { separateUUIDUser } from '@/shared/utils/functions/separate-uuid';
import { PaginationDto } from '@/shared/utils/dtos/pagination.dto';
import { DefaultPageSize } from '@/shared/utils/constants/querying';
import { PaginationService } from '@/core/services/pagination.service';
import { PaginationMeta } from '@/core/interfaces/pagination-meta.interface';
import { UserMessagesError } from '../errors/error-messages';
import { CreateUserDto } from '../dto/create-user.dto';
import {
  hashPassword,
  validatePassword,
} from '@/shared/utils/functions/validate-passwords';
import { UserMesages } from '../messages/user.message';
import { RolService } from '@/api/rol/service/rol.service';
import { ResponseRolDto } from '@/api/rol/dto/response/response-rol.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UpdateResult } from 'typeorm';
import { CreateTokenDto } from '@/api/token/dto/create-token.dto';
import { AuthMessagesError } from '@/auth/error/error-messages';
import { PayloadDto } from '@/auth/dto/payload.dto';
import { MailService } from '@/core/services/mail.service';
import { TokenService } from '@/api/token/service/token.service';
import { configApp } from '@/config/app/config.app';

const KEY: string = 'users';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name, {
    timestamp: true,
  });

  private bodyMail: Record<string, string> = {};

  constructor(
    @Inject(UserInterfaceRepository)
    private readonly userRepository: UserInterfaceRepository,
    @Inject(TransformDto)
    private readonly transform: TransformDto<UserEntity, ResponseUserDto>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly paginationService: PaginationService,
    private readonly rolService: RolService,
    private readonly mailService: MailService,
    private readonly tokenService: TokenService,
  ) {}

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

  async verifyUser(id: string) {
    const user = await this.userRepository.getUserById(id);

    if (!user) throw new NotFoundException(UserMessagesError.USER_NOT_FOUND);

    return user;
  }

  async validateEmailBD(email: string, id?: string): Promise<void> {
    const existInBD = await this.userRepository.userAlreadyExists(email, id);

    if (existInBD) {
      throw new BadRequestException(UserMessagesError.USER_ALREADY_EXIST);
    }
  }

  async getAllUsers(
    usuario_id: string,
    param: PaginationDto,
    deletedAt?: boolean,
  ) {
    const { page, limit } = param;

    const cacheKey = `${KEY}_${separateUUIDUser(usuario_id)}-${page}-${limit}${deletedAt ? '_deleted' : ''}`;

    const take = limit ?? DefaultPageSize.USERS;
    const skip = this.paginationService.calculateOffset(limit, page);

    const userCache = await this.cacheManager.get<{
      users: UserEntity[];
      meta: PaginationMeta;
    }>(cacheKey);

    const [data, count] = await this.userRepository.getAllUsers(
      skip,
      take,
      deletedAt,
    );

    data.forEach((user) => delete user.password);

    const users: UserEntity[] = this.transform.transformDtoArray(
      data,
      ResponseUserDto,
    );

    const meta = this.paginationService.createMeta(limit, page, count);

    if (userCache) {
      const userCacheResp = this.transform.transformDtoArray(
        userCache.users,
        ResponseUserDto,
      );
      return { users: userCacheResp, meta: userCache.meta };
    }

    const response = { users, meta };
    await this.cacheManager.set(cacheKey, response);

    return response;
  }

  async getUserById(id: string) {
    const user = await this.userRepository.getUserById(id);
    delete user.password;

    if (!user) {
      this.logger.warn(
        `No se ha encontrado un usuario con el id: ${id} en nuestra base de datos`,
      );
      throw new NotFoundException(UserMessagesError.USER_NOT_FOUND);
    }

    return this.transform.transformDtoObject(user, ResponseUserDto);
  }

  async getUserByEmail(email: string) {
    const user = await this.userRepository.getUserByEmail(email);
    delete user.password;

    if (!user) {
      this.logger.warn(
        `No se ha encontrado un usuario con el email: ${email} en nuestra base de datos`,
      );
      throw new NotFoundException(UserMessagesError.USER_NOT_FOUND);
    }

    return this.transform.transformDtoObject(user, ResponseUserDto);
  }

  async getRolesForUser(id: string): Promise<string[]> {
    // Encuentra el usuario y carga el rol
    const user = await this.userRepository.getUserById(id);

    // Verifica si el usuario existe
    if (!user || !user.rol) {
      throw new Error('User or role not found');
    }

    // Devuelve un array con el nombre del rol
    return [user.rol.rol];
  }

  async createNewUser(dto: CreateUserDto, isWeb: boolean, usuario_id?: string) {
    const { firstName, lastName, email, phone, rol } = dto;

    if (dto.password) dto.password = await hashPassword(dto.password);

    const exist = await this.userRepository.userAlreadyExists(email);

    if (exist && isWeb) {
      throw new BadRequestException(UserMessagesError.USER_ALREADY_EXIST);
    }

    if (!exist) {
      const emailLW = email.toLowerCase();
      if (isWeb) {
        const token_id = crypto.randomUUID();

        const payload: PayloadDto = {
          email,
          id: token_id,
        };

        const token = this.tokenService.generateJWTToken(payload, false, '24h');

        this.bodyMail.email = emailLW;
        this.bodyMail.nombre = firstName;
        this.bodyMail.lastname = lastName;
        this.bodyMail.url = `${configApp().appHost}/verify/${token}`;
        this.bodyMail.subject =
          'Gracias por registrarte, por favor confirma tu correo electronico';

        const responseMail = await this.mailService.sendMail(
          'register',
          this.bodyMail,
        );

        if (!responseMail.ok) {
          this.logger.warn(responseMail.message);
          throw new InternalServerErrorException(
            AuthMessagesError.INTERNAL_SERVER_ERROR,
          );
        }

        const tokenData: CreateTokenDto = {
          token: token.toString(),
          email,
          isUsed: false,
          token_id,
        };

        this.tokenService.saveToken(tokenData);
      }

      const rol_resp: ResponseRolDto = await this.rolService.getRoleByName(rol);

      if (!rol_resp)
        throw new NotFoundException(UserMessagesError.ROL_NOT_FOUND);

      const newUser = {
        firstName,
        lastName,
        email: emailLW,
        password: dto.password,
        rol: rol_resp.id,
        phone,
      };

      const data: UserEntity = plainToInstance(UserEntity, newUser);

      const userNew = await this.userRepository.saveUser(data);

      if (!userNew) {
        throw new InternalServerErrorException(
          UserMessagesError.INTERNAL_SERVER_ERROR,
        );
      }

      this.invalidateAllCacheKeys(usuario_id);

      return UserMesages.USER_CREATED;
    }

    return;
  }

  async updateUser(id: string, data: UpdateUserDto, usuario_id?: string) {
    delete data.confirm_password;
    await this.validateEmailBD(data.email, id);
    const user = await this.verifyUser(id);

    if (data.old_password) {
      const samePassword = await validatePassword(
        data.old_password,
        user.password,
      );

      if (!samePassword)
        throw new BadRequestException(
          UserMessagesError.USER_PASSWORD_NOT_MATCH_OLD,
        );
    }

    delete data.old_password;

    if (data.password) data.password = await hashPassword(data.password);

    const userToUpdate: Partial<UserEntity> = {};

    for (const key in data) {
      if (data[key] !== undefined && data[key] !== null) {
        userToUpdate[key] = data[key];
      }
    }

    const userUpdate = await this.userRepository.updateUser(
      id,
      userToUpdate as UserEntity,
    );

    if (!userUpdate) {
      return UserMessagesError.USER_ERROR;
    }

    this.invalidateAllCacheKeys(usuario_id);

    return UserMesages.USER_UPDATED;
  }

  async deleteUser(id: string, usuario_id?: string) {
    await this.verifyUser(id);

    const userDeleted: UpdateResult = await this.userRepository.deleteUser(id);

    if (!userDeleted.affected) {
      throw new BadRequestException(UserMessagesError.USER_NOT_DELETED);
    }

    this.invalidateAllCacheKeys(usuario_id);

    return UserMesages.USER_REMOVED;
  }

  async restoreUser(id: string, usuario_id?: string) {
    const user = await this.userRepository.userAlreadyExistsById(id, true);

    if (!user) throw new NotFoundException(UserMessagesError.USER_NOT_FOUND);

    const userDeleted: UpdateResult = await this.userRepository.restoreUser(id);

    if (!userDeleted.affected) {
      throw new BadRequestException(UserMessagesError.USER_NOT_RESTORED);
    }

    this.invalidateAllCacheKeys(usuario_id);

    return UserMesages.USER_RESTORED;
  }
}
