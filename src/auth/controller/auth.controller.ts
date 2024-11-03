import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from '../service/auth.service';
import { TokenService } from '@/api/token/service/token.service';
import { UserService } from '@/api/users/service/user.service';
import { UserEntity } from '@/api/users/entity/user.entity';
import { PayloadDto } from '../dto/payload.dto';
import { User } from '../decorators/user.decorator';
import { LocalGuard } from '../guards/local.guard';
import { ErrorResponseDto } from '@/shared/utils/dtos/swagger/errorresponse.dto';
import { OkResponseDto } from '@/shared/utils/dtos/swagger/okresponse.dto';
import { Authorize } from '../decorators/authorized.decorator';
import { RefreshtokenDto } from '../dto/refresh-token.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { ForgotPasswordDto } from '../dto/forgot-password';
import { VerifyDto } from '../dto/verify.dto';
import { AuthorizedWithRoles } from '../decorators/roles.decorator';

@Controller('auth')
@ApiTags('Autenticación')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
    private readonly usuarioService: UserService,
  ) {}

  @ApiResponse({
    status: HttpStatus.OK,
    type: OkResponseDto,
    isArray: false,
    description:
      'Sesión iniciada correctamente como usuario con las credenciales especificadas',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    type: ErrorResponseDto,
    isArray: false,
    description: 'Usuario y/o contraseñas incorrectas',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    type: ErrorResponseDto,
    isArray: false,
    description: 'Usuario no encontrado',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    type: ErrorResponseDto,
    isArray: false,
    description: 'Hubo un error interno en el servidor',
  })
  @ApiHeader({
    name: 'basic',
    description: 'Header para autenticación segura',
  })
  @ApiOperation({
    summary: 'Inicie sesión como usuario con las credenciales especificadas',
  })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalGuard)
  login(@User() user: UserEntity) {
    const payload: PayloadDto = {
      email: user.email,
      id: user.id,
    };

    return this.tokenService.generateJWTToken(payload, true, '', user);
  }

  @Post('verify/:token')
  @ApiResponse({
    status: HttpStatus.OK,
    type: OkResponseDto,
    isArray: false,
    description:
      'Validar un nuevo usuario si existe en la base de datos con correo electrónico',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    type: ErrorResponseDto,
    isArray: false,
    description: 'Bad Request',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    type: ErrorResponseDto,
    isArray: false,
    description: 'Internal Server Error',
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Validar un nuevo usuario si existe en la base de datos con correo electrónico',
  })
  validateUser(@Param('token') token: string, @Body() dto: VerifyDto) {
    const { token: tokenBody } = dto;

    if (token !== tokenBody) {
      throw new BadRequestException('Token inválido');
    }

    return this.authService.validateUser(dto);
  }

  @ApiResponse({
    status: HttpStatus.OK,
    type: OkResponseDto,
    isArray: false,
    description: 'Pedir cambio de clave para el usuario',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    type: ErrorResponseDto,
    isArray: false,
    description: 'Email incorrecto',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    type: ErrorResponseDto,
    isArray: false,
    description: 'Usuario no encontrado',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    type: ErrorResponseDto,
    isArray: false,
    description: 'Hubo un error interno en el servidor',
  })
  @ApiOperation({
    summary: 'Pedir cambio de clave para el usuario',
  })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @ApiResponse({
    status: HttpStatus.OK,
    type: OkResponseDto,
    isArray: false,
    description: 'Metodo para cambiar la clave del usuario',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    type: ErrorResponseDto,
    isArray: false,
    description: 'Datos incorrecto',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    type: ErrorResponseDto,
    isArray: false,
    description: 'Usuario no encontrado',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    type: ErrorResponseDto,
    isArray: false,
    description: 'Hubo un error interno en el servidor',
  })
  @ApiOperation({
    summary: 'Metodo para cambiar la clave del usuario',
  })
  @HttpCode(HttpStatus.OK)
  @Post('change-password/:token')
  changePassword(
    @Param('token') token: string,
    @Body() dto: ChangePasswordDto,
  ) {
    const { token: tokenBody } = dto;

    if (token !== tokenBody) {
      throw new BadRequestException('Token inválido');
    }

    return this.authService.changePassword(dto);
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Metodo para refrescar el token del usuario',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: OkResponseDto,
    description: 'Metodo para refrescar el token del usuario',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    type: ErrorResponseDto,
    description: 'Datos incorrectos',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: ErrorResponseDto,
    description: 'No autorizado',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    type: ErrorResponseDto,
    description: 'Usuario no encontrado',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    type: ErrorResponseDto,
    description: 'Hubo un error interno en el servidor',
  })
  @HttpCode(HttpStatus.OK)
  refreshToken(@Body() dto: RefreshtokenDto) {
    return this.authService.refresh(dto);
  }

  @Get('profile')
  @ApiResponse({
    status: HttpStatus.OK,
    type: OkResponseDto,
    description: 'Metodo para obtener datos del usuario logueado',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    type: ErrorResponseDto,
    description: 'Datos incorrectos',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: ErrorResponseDto,
    description: 'No autorizado',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    type: ErrorResponseDto,
    description: 'Usuario no encontrado',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    type: ErrorResponseDto,
    description: 'Hubo un error interno en el servidor',
  })
  @ApiOperation({
    summary: 'Metodo para obtener datos del usuario logueado',
  })
  @Authorize()
  @ApiBearerAuth()
  /**
   * Retrieves the profile information of the currently logged-in user.
   *
   * @param {UserEntity} user - The logged-in user entity containing the user ID.
   * @returns {Promise<ResponseUserDto>} The user profile data.
   *
   * @throws {NotFoundException} If the user is not found.
   */
  obtainUser(@User() { id }: UserEntity) {
    return this.usuarioService.getUserById(id);
  }

  //TODO: luego borrar

  @Get('admin')
  @Authorize()
  @ApiBearerAuth()
  @AuthorizedWithRoles('admin')
  getAdminResource() {
    return 'Admin resource';
  }

  @Get('soporte')
  @AuthorizedWithRoles('soporte', 'admin')
  @ApiBearerAuth()
  getSoporteResource() {
    return 'Soporte resource';
  }
}
