import { AuthorizedWithRoles } from '@/auth/decorators/roles.decorator';
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
import { OkResponseDto } from '@/shared/utils/dtos/swagger/okresponse.dto';
import { ErrorResponseDto } from '@/shared/utils/dtos/swagger/errorresponse.dto';
import { validateQuerystringDto } from '@/shared/utils/functions/validate-querystring';
import { PaginationDto } from '@/shared/utils/dtos/pagination.dto';
import { User } from '@/auth/decorators/user.decorator';
import { UserEntity } from '@/api/users/entity/user.entity';
import { CreateResponseDto } from '@/shared/utils/dtos/swagger/createresponse.dto';
import { Authorize } from '@/auth/decorators/authorized.decorator';
import { ChangeStatusDto } from '@/shared/utils/dtos/change-status.dto';
import { PriorityService } from '../service/priority.service';
import { CreatePriorityDto } from '../dto/create-priority.dto';
import { UpdatePriorityDto } from '../dto/update-priority.dto';

@Controller('priorities')
@Authorize()
@ApiTags('Priorities')
@ApiBearerAuth()
export class PriorityController {
  constructor(private readonly priorityService: PriorityService) {}

  @Get()
  @ApiResponse({
    status: HttpStatus.OK,
    type: OkResponseDto,
    description:
      'Metodo para obtener todos las prioridades que existen en la base de datos',
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
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    type: ErrorResponseDto,
    description: 'Hubo un error interno en el servidor',
  })
  @ApiOperation({
    summary: 'Obtiene todos las prioridades que existen en la base de datos',
  })
  @ApiQuery({ name: 'page', type: 'number', required: false })
  @ApiQuery({ name: 'limit', type: 'number', required: false })
  @ApiQuery({ name: 'deleted', type: 'boolean', required: false })
  @AuthorizedWithRoles('admin')
  async findAll(
    @User() { id: usuario_id }: UserEntity,
    @Query('deleted', new ParseBoolPipe({ optional: true }))
    deletedAt: boolean = false,
    @Query()
    query: Record<string, any>,
  ) {
    const param = await validateQuerystringDto(PaginationDto, query);

    return this.priorityService.getAllPriorities(usuario_id, param, deletedAt);
  }

  @Get('status/:status')
  @ApiResponse({
    status: HttpStatus.OK,
    type: OkResponseDto,
    description:
      'Listar todas las prioridades por el estado en la base de datos',
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
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    type: ErrorResponseDto,
    description: 'Hubo un error interno en el servidor',
  })
  @ApiOperation({
    summary: 'Listar todas las prioridades por el estado en la base de datos',
  })
  @AuthorizedWithRoles('soporte', 'admin')
  async findAllForStatus(@Param('status') status: string) {
    return await this.priorityService.getPrioritiesForStatus(status);
  }

  @Get(':id')
  @ApiResponse({
    status: HttpStatus.OK,
    type: OkResponseDto,
    description: 'Metodo para obtener un prioridad por id',
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
    description: 'Prioridad no encontrada',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    type: ErrorResponseDto,
    description: 'Hubo un error interno en el servidor',
  })
  @ApiOperation({ summary: 'Buscar una prioridad por el id' })
  @AuthorizedWithRoles('soporte', 'admin')
  async findOne(@Param('id') id: string) {
    return await this.priorityService.getPriorityById(id);
  }

  @Post()
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: CreateResponseDto,
    description: 'Metodo para crear una nueva prioridad',
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
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    type: ErrorResponseDto,
    description: 'Hubo un error interno en el servidor',
  })
  @ApiOperation({ summary: 'Agregar una nueva prioridad' })
  @AuthorizedWithRoles('admin')
  async createPriority(
    @Body() dto: CreatePriorityDto,
    @User() { id: usuario_id }: UserEntity,
  ) {
    return await this.priorityService.createPriority(dto, usuario_id);
  }

  @Put(':id')
  @ApiResponse({
    status: HttpStatus.OK,
    type: OkResponseDto,
    description: 'Metodo para editar una prioridad por id',
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
    description: 'Prioridad no encontrada',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    type: ErrorResponseDto,
    description: 'Hubo un error interno en el servidor',
  })
  @ApiOperation({ summary: 'Editar una prioridad por su id' })
  @AuthorizedWithRoles('admin')
  async updatePriority(
    @Param('id') id: string,
    @Body() data: UpdatePriorityDto,
    @User() { id: usuario_id }: UserEntity,
  ) {
    return await this.priorityService.updatePriority(id, data, usuario_id);
  }

  @Put(':id/change-status')
  @ApiResponse({
    status: HttpStatus.OK,
    type: OkResponseDto,
    description: 'Metodo para activar una prioridad por id',
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
    description: 'Prioridad no encontrada',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    type: ErrorResponseDto,
    description: 'Hubo un error interno en el servidor',
  })
  @ApiOperation({ summary: 'Activar una prioridad por su id' })
  @AuthorizedWithRoles('admin')
  async activePriority(
    @Param('id') id: string,
    @Body() status: ChangeStatusDto,
    @User() { id: usuario_id }: UserEntity,
  ) {
    return await this.priorityService.activeOrDesactivePriority(
      id,
      status,
      usuario_id,
    );
  }

  @Delete(':id')
  @ApiResponse({
    status: HttpStatus.OK,
    type: OkResponseDto,
    description: 'Metodo para eliminar una prioridad por id',
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
    description: 'Prioridad no encontrada',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    type: ErrorResponseDto,
    description: 'Hubo un error interno en el servidor',
  })
  @ApiOperation({ summary: 'Elimina una prioridad por el id' })
  @AuthorizedWithRoles('admin')
  async remove(
    @Param('id') id: string,
    @User() { id: usuario_id }: UserEntity,
  ) {
    return await this.priorityService.deletePriority(id, usuario_id);
  }

  @Post(':id')
  @ApiResponse({
    status: HttpStatus.OK,
    type: OkResponseDto,
    description: 'Metodo para restaurar una prioridad borrado por id',
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
    description: 'Prioridad no encontrada',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    type: ErrorResponseDto,
    description: 'Hubo un error interno en el servidor',
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Restaurar una prioridad borrado por su id',
  })
  @AuthorizedWithRoles('admin')
  async recovery(
    @Param('id') id: string,
    @User() { id: usuario_id }: UserEntity,
  ) {
    return await this.priorityService.restorePriority(id, usuario_id);
  }
}
