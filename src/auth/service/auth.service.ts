import { UserEntity } from '@/api/users/entity/user.entity';
import { configApp } from '@/config/app/config.app';
import { TransformDto } from '@/shared/utils';
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthResponseDto } from '../dto/response/response-auth.dto';
import { TokenService } from '@/api/token/service/token.service';
import { MailService } from '@/core/services/mail.service';
import { UserService } from '@/api/users/service/user.service';
import { UserInterfaceRepository } from '@/api/users/repository/user.interface.repository';
import { AuthInterfaceRepository } from '../repository/auth.interface.repository';
import { AuthMessagesError } from '../error/error-messages';
import {
  hashPassword,
  validatePassword,
} from '@/shared/utils/functions/validate-passwords';
import { UserMessagesError } from '@/api/users/errors/error-messages';
import { UpdateTokenDto } from '@/api/token/dto/update-token.dto';
import { VerifyDto } from '../dto/verify.dto';
import { LoginDto } from '../dto/login.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { ForgotPasswordDto } from '../dto/forgot-password';
import { PayloadDto } from '../dto/payload.dto';
import { RefreshtokenDto } from '../dto/refresh-token.dto';
import { UpdateUserDto } from '@/api/users/dto/update-user.dto';
import { UserMesages } from '@/api/users/messages/user.message';
import { CreateTokenDto } from '@/api/token/dto/create-token.dto';

@Injectable()
export class AuthService {
  private failedLoginAttempts = new Map<string, number>();
  private password_failures: number = configApp().max_pass_failures;
  private readonly logger = new Logger(AuthService.name, { timestamp: true });
  private bodyMail: Record<string, string> = {};

  constructor(
    private readonly authRepository: AuthInterfaceRepository,
    private readonly userRepository: UserInterfaceRepository,
    @Inject(TransformDto)
    private readonly transform: TransformDto<UserEntity, AuthResponseDto>,
    private readonly tokenService: TokenService,
    private readonly mailService: MailService,
    private readonly usuarioService: UserService,
  ) {}

  async handleFailedLogin(email: string, id: string) {
    const attempts = this.failedLoginAttempts.get(email) || 0;
    this.failedLoginAttempts.set(email, attempts + 1);

    if (attempts + 1 >= this.password_failures) {
      await this.saveUser(id, false);

      this.handleSuccessfulLogin(email);
      throw new BadRequestException(AuthMessagesError.USER_BLOCKED);
    }
  }

  async handleSuccessfulLogin(email: string) {
    this.failedLoginAttempts.delete(email);
  }

  async login(dto: LoginDto) {
    if (dto.email !== null) dto.email = dto.email.toLowerCase();

    const user = await this.authRepository.getUserByEmail(dto.email);

    if (!user || !user.active) {
      throw new NotFoundException(
        !user
          ? AuthMessagesError.USER_NOT_FOUND
          : AuthMessagesError.USER_IS_NOT_ACTIVE,
      );
    }

    const passwordIsValid = await validatePassword(dto.password, user.password);

    if (!passwordIsValid) {
      await this.handleFailedLogin(dto.email, user.id);
      throw new BadRequestException(
        AuthMessagesError.PASSWORD_OR_EMAIL_INVALID,
      );
    }

    await this.handleSuccessfulLogin(dto.email);

    return this.transform.transformDtoObject(user, AuthResponseDto);
  }

  async validateUser(dto: VerifyDto) {
    const { email, token } = dto;

    const verifyToken: Record<string, string> =
      this.tokenService.verifyTokenCatch(
        token,
        configApp().secret_jwt_register,
      );

    const userEmailToken = verifyToken['email'];
    const tokenIdJWT = verifyToken['id'];

    const tokenData = await this.tokenService.findByTokenId(tokenIdJWT);

    if (tokenData.isUsed) {
      throw new BadRequestException(AuthMessagesError.USER_TOKEN_USED);
    }

    if (userEmailToken !== email) {
      throw new BadRequestException(AuthMessagesError.USER_MAIL_DIFFERENT);
    }

    const updateTokenData: Partial<UpdateTokenDto> = {
      isUsed: true,
    };

    const tokenId = tokenData.id.toString();

    await this.tokenService.updateToken(tokenId, updateTokenData);

    const user = await this.authRepository.getUserByEmail(userEmailToken);

    if (!user) {
      throw new NotFoundException(UserMessagesError.USER_NOT_FOUND);
    }

    const editUser = {
      active: true,
    };

    const result = await this.userRepository.update(
      user.id,
      editUser as UserEntity,
    );

    if (!result) {
      throw new BadRequestException(UserMessagesError.USER_ERROR);
    }

    this.bodyMail.email = email;
    this.bodyMail.nombre = user.firstName;
    this.bodyMail.lastname = user.lastName;
    this.bodyMail.url = `${configApp().appHost}/iniciarsesion`;
    this.bodyMail.subject = `${user.firstName}, gracias por activar tu cuenta`;

    const responseMail = await this.mailService.sendMail(
      'login',
      this.bodyMail,
    );

    if (!responseMail.ok) {
      this.logger.warn(responseMail.message);
      throw new InternalServerErrorException(
        AuthMessagesError.INTERNAL_SERVER_ERROR,
      );
    }

    return UserMesages.USER_VALIDATED;
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const { email } = dto;

    const user = await this.authRepository.getUserByEmail(email);

    if (!user) {
      throw new NotFoundException(UserMessagesError.USER_NOT_FOUND);
    }

    const token_id = crypto.randomUUID();

    const payload: PayloadDto = {
      email,
      id: token_id,
    };

    const token = this.tokenService.generateJWTToken(payload, false, '1h');

    this.bodyMail.email = email;
    this.bodyMail.nombre = user.firstName;
    this.bodyMail.lastname = user.lastName;
    this.bodyMail.url = `${configApp().appHost}/change-password/${token}`;
    this.bodyMail.subject = `${user.firstName}, sigue los pasos para recuperar tu contraseña`;

    const responseMail = await this.mailService.sendMail(
      'forgot_password',
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

    const tokenSaved = this.tokenService.saveToken(tokenData);

    if (!tokenSaved) {
      throw new InternalServerErrorException(
        AuthMessagesError.INTERNAL_SERVER_ERROR,
      );
    }

    return 'Se ha enviado un correo a su dirección para recuperar su contraseña.';
  }

  async changePassword(dto: ChangePasswordDto) {
    const { email, password, confirm_password, token } = dto;

    const verifyToken: Record<string, string> =
      this.tokenService.verifyTokenCatch(
        token,
        configApp().secret_jwt_register,
      );

    const userEmailToken = verifyToken['email'];

    const tokenIdJWT = verifyToken['id'];

    const tokenData = await this.tokenService.findByTokenId(tokenIdJWT);

    if (tokenData.isUsed) {
      throw new BadRequestException(AuthMessagesError.USER_TOKEN_USED);
    }

    if (userEmailToken !== email) {
      throw new BadRequestException(AuthMessagesError.USER_MAIL_DIFFERENT);
    }

    const updateTokenData: Partial<UpdateTokenDto> = {
      isUsed: true,
    };

    const tokenId = tokenData.id.toString();

    await this.tokenService.updateToken(tokenId, updateTokenData);

    const user = await this.authRepository.getUserByEmail(userEmailToken);

    if (!user) {
      throw new NotFoundException(UserMessagesError.USER_NOT_FOUND);
    }

    if (password !== confirm_password) {
      throw new BadRequestException(UserMessagesError.USER_PASSWORD_NOT_MATCH);
    }

    const editUser = {
      password: await hashPassword(password),
    };

    const result = await this.userRepository.updateUser(
      user.id,
      editUser as UserEntity,
    );

    if (!result) {
      throw new BadRequestException(UserMessagesError.USER_ERROR);
    }

    this.bodyMail.email = email;
    this.bodyMail.nombre = user.firstName;
    this.bodyMail.lastname = user.lastName;
    this.bodyMail.url = `${configApp().appHost}/iniciarsesion`;
    this.bodyMail.subject = `${user.firstName}, has cambiado con éxito la contraseña`;

    const responseMail = await this.mailService.sendMail(
      'recovery',
      this.bodyMail,
    );

    if (!responseMail.ok) {
      this.logger.warn(responseMail.message);
      throw new InternalServerErrorException(
        AuthMessagesError.INTERNAL_SERVER_ERROR,
      );
    }

    return 'Se cambio la contraseña correctamente.';
  }

  async refresh({ token }: RefreshtokenDto) {
    const tokenOld = this.tokenService.verifyTokenCatch(
      token,
      configApp().secret_jwt_refresh,
    );

    if (!tokenOld) throw new UnauthorizedException('Token invalido');

    const payload: PayloadDto = {
      email: tokenOld.email,
      id: tokenOld.id,
    };

    const newToken = this.tokenService.refreshJWTToken(payload);

    return newToken;
  }

  async saveUser(id: string, active: boolean) {
    const partialUpdate: Partial<UpdateUserDto> = {
      active: active,
    };

    return await this.userRepository.updateUser(
      id,
      partialUpdate as unknown as UserEntity,
    );
  }

  async validateEmailBD(email: string, id?: string): Promise<void> {
    const existInBD = await this.userRepository.userAlreadyExists(email, id);

    if (existInBD) {
      throw new BadRequestException(UserMessagesError.USER_ALREADY_EXIST);
    }
  }
}
