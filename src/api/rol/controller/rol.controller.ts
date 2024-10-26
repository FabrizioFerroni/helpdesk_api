import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseBoolPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PaginationDto } from '@/shared/utils/dtos/pagination.dto';
import { ErrorResponseDto } from '@/shared/utils/dtos/swagger/errorresponse.dto';
import { OkResponseDto } from '@/shared/utils/dtos/swagger/okresponse.dto';
import { CreateResponseDto } from '@/shared/utils/dtos/swagger/createresponse.dto';
import { RolService } from '../service/rol.service';
import { CreateRolDto } from '../dto/create-rol.dto';
import { UpdateRolDto } from '../dto/update-rol.dto';
import { validateQuerystringDto } from '@/shared/utils/functions/validate-querystring';

const USUARIO_ID: string = '16b0c064-529e-4cf5-815a-489d31577495';

@Controller('roles')
@ApiTags('Roles')
@ApiBearerAuth()
// @Authorize()
export class RolController {
  constructor(private readonly rolService: RolService) {}

  @Get()
  @ApiResponse({
    status: HttpStatus.OK,
    type: OkResponseDto,
    description:
      'Metodo para obtener todos los roles que existen en la base de datos',
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
    isArray: false,
    description: 'Rol no encontrado',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    type: ErrorResponseDto,
    description: 'Hubo un error interno en el servidor',
  })
  @ApiOperation({
    summary: 'Obtiene todos los roles que existen en la base de datos',
  })
  @ApiQuery({ name: 'page', type: 'number', required: false })
  @ApiQuery({ name: 'limit', type: 'number', required: false })
  @ApiQuery({ name: 'deleted', type: 'boolean', required: false })
  async findAll(
    @Query('deleted', new ParseBoolPipe({ optional: true }))
    deletedAt: boolean = false,
    @Query()
    query: Record<string, any>,
  ) {
    const param = await validateQuerystringDto(PaginationDto, query);

    return this.rolService.findAll(deletedAt, USUARIO_ID, param);
  }

  @Get(':id')
  @ApiResponse({
    status: HttpStatus.OK,
    type: OkResponseDto,
    description: 'Metodo para obtener un rol por id',
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
    description: 'Rol no encontrado',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    type: ErrorResponseDto,
    description: 'Hubo un error interno en el servidor',
  })
  @ApiOperation({ summary: 'Buscar un rol por el id' })
  async findOne(@Param('id') id: string) {
    return await this.rolService.getById(id);
  }

  @Post()
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: CreateResponseDto,
    description: 'Metodo para crear un nuevo rol',
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
    description: 'Rol no encontrado',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    type: ErrorResponseDto,
    description: 'Hubo un error interno en el servidor',
  })
  @ApiOperation({ summary: 'Agregar un nuevo rol' })
  async create(@Body() dto: CreateRolDto) {
    return await this.rolService.createRol(dto, true, USUARIO_ID);
  }

  @Put(':id')
  @ApiResponse({
    status: HttpStatus.OK,
    type: OkResponseDto,
    description: 'Metodo para editar un rol por id',
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
    description: 'Rol no encontrado',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    type: ErrorResponseDto,
    description: 'Hubo un error interno en el servidor',
  })
  @ApiOperation({ summary: 'Editar un rol por su id' })
  async update(@Param('id') id: string, @Body() dto: UpdateRolDto) {
    return await this.rolService.updateRol(id, dto, true, USUARIO_ID);
  }

  @Delete(':id')
  @ApiResponse({
    status: HttpStatus.OK,
    type: OkResponseDto,
    description: 'Metodo para eliminar un rol por id',
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
    description: 'Rol no encontrado',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    type: ErrorResponseDto,
    description: 'Hubo un error interno en el servidor',
  })
  @ApiOperation({ summary: 'Elimina un rol por el id' })
  async remove(@Param('id') id: string) {
    return await this.rolService.deleteRol(id, USUARIO_ID);
  }

  @Post(':id')
  @ApiResponse({
    status: HttpStatus.OK,
    type: OkResponseDto,
    description: 'Metodo para restaurar un rol borrado por id',
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
    description: 'Rol no encontrado',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    type: ErrorResponseDto,
    description: 'Hubo un error interno en el servidor',
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restaurar un rol borrado por su id' })
  async recovery(@Param('id') id: string) {
    return await this.rolService.restoreRol(id, USUARIO_ID);
  }
}
