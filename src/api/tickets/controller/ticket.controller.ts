import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TicketService } from '../service/ticket.service';
import { Authorize } from '@/auth/decorators/authorized.decorator';
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
import { OkResponseDto } from '@/shared/utils/dtos/swagger/okresponse.dto';
import { ErrorResponseDto } from '@/shared/utils/dtos/swagger/errorresponse.dto';
import { AuthorizedWithRoles } from '@/auth/decorators/roles.decorator';
import { User } from '@/auth/decorators/user.decorator';
import { UserEntity } from '@/api/users/entity/user.entity';
import { validateQuerystringDto } from '@/shared/utils/functions/validate-querystring';
import { PaginationDto } from '@/shared/utils/dtos/pagination.dto';
import { TicketsEntity } from '../entity/tickets.entity';
import { PaginationMeta } from '@/core/interfaces/pagination-meta.interface';
import { verifyIsAdmin } from '@/shared/utils/functions/verify-admin';
import { UserService } from '@/api/users/service/user.service';
import { CreateTicketDto } from '../dtos/create-ticket.dto';
import { CreateResponseDto } from '@/shared/utils/dtos/swagger/createresponse.dto';
import { ChangeStatusTicketDto } from '../dtos/change-status-ticket.dto';
import { AssignTechDto } from '../dtos/assign-tech.dto';

interface ITicketPaginated {
  tickets: TicketsEntity[];
  meta: PaginationMeta;
}

@Controller('tickets')
// @Authorize()
@ApiTags('Tickets')
@ApiBearerAuth()
export class TicketController {
  constructor(
    private readonly ticketService: TicketService,
    private readonly userService: UserService,
  ) {}

  @Get()
  @ApiResponse({
    status: HttpStatus.OK,
    type: OkResponseDto,
    description:
      'Metodo para obtener todos los tickets que existen en la base de datos',
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
    status: HttpStatus.FORBIDDEN,
    type: ErrorResponseDto,
    description: 'No tienes los permisos suficientes.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    type: ErrorResponseDto,
    description: 'Hubo un error interno en el servidor',
  })
  @ApiOperation({
    summary: 'Obtiene todos los tickets que existen en la base de datos',
  })
  @ApiQuery({ name: 'page', type: 'number', required: false })
  @ApiQuery({ name: 'limit', type: 'number', required: false })
  @ApiQuery({ name: 'deleted', type: 'boolean', required: false })
  @AuthorizedWithRoles('soporte', 'admin')
  async findAll(
    @User() { id: usuario_id }: UserEntity,
    @Query('deleted', new ParseBoolPipe({ optional: true }))
    deletedAt: boolean = false,
    @Query()
    query: Record<string, any>,
  ) {
    const param = await validateQuerystringDto(PaginationDto, query);

    // Averiguar si el usuario logueado tiene el rol admin o no.
    const isAdmin = await verifyIsAdmin(this.userService, usuario_id);

    let response: ITicketPaginated;

    // Si el usuario es admin, obtener todos los tickets. De lo contrario, obtener solo los tickets del usuario logueado.
    if (isAdmin) {
      response = await this.ticketService.getAllTickets(
        usuario_id,
        param,
        deletedAt,
      );
    } else {
      response = await this.ticketService.getAllTicketsForUser(
        usuario_id,
        param,
        deletedAt,
      );
    }

    return response;
  }

  @Get('code/:code')
  @ApiResponse({
    status: HttpStatus.OK,
    type: OkResponseDto,
    description: 'Lista el ticket por el codigo de ticket en la base de datos',
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
    status: HttpStatus.FORBIDDEN,
    type: ErrorResponseDto,
    description: 'No tienes los permisos suficientes.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    type: ErrorResponseDto,
    description: 'Ticket no encontrado',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    type: ErrorResponseDto,
    description: 'Hubo un error interno en el servidor',
  })
  @ApiOperation({
    summary: 'Lista el ticket por el codigo de ticket en la base de datos',
  })
  @AuthorizedWithRoles('soporte', 'admin')
  async findForTicketCode(@Param('code') ticketCode: string) {
    return await this.ticketService.getTicketByTicketCode(ticketCode);
  }

  @Get(':id')
  @ApiResponse({
    status: HttpStatus.OK,
    type: OkResponseDto,
    description: 'Metodo para obtener un ticket por id',
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
    status: HttpStatus.FORBIDDEN,
    type: ErrorResponseDto,
    description: 'No tienes los permisos suficientes.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    type: ErrorResponseDto,
    description: 'Ticket no encontrado',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    type: ErrorResponseDto,
    description: 'Hubo un error interno en el servidor',
  })
  @ApiOperation({ summary: 'Buscar un ticket por el id' })
  @AuthorizedWithRoles('soporte', 'admin')
  async findOne(@Param('id') id: string) {
    return await this.ticketService.getTicketById(id);
  }

  @Post()
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: CreateResponseDto,
    description: 'Metodo para crear un nuevo ticket',
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
    status: HttpStatus.FORBIDDEN,
    type: ErrorResponseDto,
    description: 'No tienes los permisos suficientes.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    type: ErrorResponseDto,
    description: 'Hubo un error interno en el servidor',
  })
  @ApiOperation({ summary: 'Agregar un nuevo ticket' })
  @AuthorizedWithRoles('soporte', 'admin')
  async createTicket(
    @Body() dto: CreateTicketDto,
    @User() { id: usuario_id }: UserEntity,
  ) {
    return await this.ticketService.createTicket(dto, usuario_id);
  }

  @Put('status/:id')
  @ApiResponse({
    status: HttpStatus.OK,
    type: CreateResponseDto,
    description: 'Metodo para cambiar el estado del ticket',
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
    status: HttpStatus.FORBIDDEN,
    type: ErrorResponseDto,
    description: 'No tienes los permisos suficientes.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    type: ErrorResponseDto,
    description: 'Ticket no encontrado',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    type: ErrorResponseDto,
    description: 'Hubo un error interno en el servidor',
  })
  @ApiOperation({ summary: 'Metodo para cambiar el estado del ticket' })
  @AuthorizedWithRoles('soporte', 'admin')
  async changeStatus(
    @Param('id') id: string,
    @Body() dto: ChangeStatusTicketDto,
    @User() { id: usuario_id }: UserEntity,
  ) {
    return await this.ticketService.changeStatusTicket(id, dto, usuario_id);
  }

  @Put('assign/tech/:id')
  @ApiResponse({
    status: HttpStatus.OK,
    type: CreateResponseDto,
    description: 'Metodo para asignar un tecnico al ticket',
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
    status: HttpStatus.FORBIDDEN,
    type: ErrorResponseDto,
    description: 'No tienes los permisos suficientes.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    type: ErrorResponseDto,
    description: 'Ticket no encontrado',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    type: ErrorResponseDto,
    description: 'Hubo un error interno en el servidor',
  })
  @ApiOperation({ summary: 'Metodo para asignar un tecnico al ticket' })
  @AuthorizedWithRoles('soporte', 'admin')
  async assingTech(
    @Param('id') id: string,
    @Body() dto: AssignTechDto,
    @User() { id: usuario_id }: UserEntity,
  ) {
    return await this.ticketService.assingTech(id, dto, usuario_id);
  }

  @Delete(':id')
  @ApiResponse({
    status: HttpStatus.OK,
    type: OkResponseDto,
    description: 'Metodo para eliminar un ticket por id',
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
    status: HttpStatus.FORBIDDEN,
    type: ErrorResponseDto,
    description: 'No tienes los permisos suficientes.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    type: ErrorResponseDto,
    description: 'Ticket no encontrado',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    type: ErrorResponseDto,
    description: 'Hubo un error interno en el servidor',
  })
  @ApiOperation({ summary: 'Elimina un ticket por el id' })
  @AuthorizedWithRoles('admin')
  async remove(
    @Param('id') id: string,
    @User() { id: usuario_id }: UserEntity,
  ) {
    return await this.ticketService.deleteTicket(id, usuario_id);
  }

  @Post(':id')
  @ApiResponse({
    status: HttpStatus.OK,
    type: OkResponseDto,
    description: 'Metodo para restaurar un ticket borrado por id',
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
    status: HttpStatus.FORBIDDEN,
    type: ErrorResponseDto,
    description: 'No tienes los permisos suficientes.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    type: ErrorResponseDto,
    description: 'Ticket no encontrado',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    type: ErrorResponseDto,
    description: 'Hubo un error interno en el servidor',
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Restaurar un ticket borrado por su id',
  })
  @AuthorizedWithRoles('admin')
  async recovery(
    @Param('id') id: string,
    @User() { id: usuario_id }: UserEntity,
  ) {
    return await this.ticketService.restoreTicket(id, usuario_id);
  }
}
