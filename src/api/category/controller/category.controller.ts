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
import { CategoryService } from '../service/category.service';
import { OkResponseDto } from '@/shared/utils/dtos/swagger/okresponse.dto';
import { ErrorResponseDto } from '@/shared/utils/dtos/swagger/errorresponse.dto';
import { validateQuerystringDto } from '@/shared/utils/functions/validate-querystring';
import { PaginationDto } from '@/shared/utils/dtos/pagination.dto';
import { User } from '@/auth/decorators/user.decorator';
import { UserEntity } from '@/api/users/entity/user.entity';
import { CreateResponseDto } from '@/shared/utils/dtos/swagger/createresponse.dto';
import { CreateCategoryDto } from '../dtos/create-category.dto';
import { UpdateCategoryDto } from '../dtos/update-category.dto';
import { Authorize } from '@/auth/decorators/authorized.decorator';
import { CategoryType } from '../enum/category.enum';
import { ChangeStatusDto } from '@/shared/utils/dtos/change-status.dto';

@Controller('categories')
@Authorize()
@ApiTags('Categories')
@ApiBearerAuth()
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @ApiResponse({
    status: HttpStatus.OK,
    type: OkResponseDto,
    description:
      'Metodo para obtener todos las categorias y subcategorias que existen en la base de datos',
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
    summary:
      'Obtiene todos las categorias y subcategorias que existen en la base de datos',
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

    return this.categoryService.getAllCategories(usuario_id, param, deletedAt);
  }

  @Get(':type')
  @ApiResponse({
    status: HttpStatus.OK,
    type: OkResponseDto,
    description: 'Listar todas las categorias o subcategorias por el tipo',
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
    summary: 'Listar todas las categorias o subcategorias por el tipo',
  })
  @AuthorizedWithRoles('soporte', 'admin')
  async findAllForType(@Param('type') type: CategoryType) {
    return await this.categoryService.getCategoriesAndSubcategoriesForType(
      type,
    );
  }

  @Get('subcategories/:parentId')
  @ApiResponse({
    status: HttpStatus.OK,
    type: OkResponseDto,
    description:
      'Listar todas las subcategorias de la categoria que se pasa el id',
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
    summary: 'Listar todas las subcategorias de la categoria que se pasa el id',
  })
  @AuthorizedWithRoles('soporte', 'admin')
  async findAllForStatus(@Param('parentId') parentId: string) {
    return await this.categoryService.getCategoriesAndSubcategoriesForParentId(
      parentId,
    );
  }

  @Get(':id')
  @ApiResponse({
    status: HttpStatus.OK,
    type: OkResponseDto,
    description: 'Metodo para obtener un categoria o subcategoria por id',
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
    description: 'Categoria o subcategoria no encontrada',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    type: ErrorResponseDto,
    description: 'Hubo un error interno en el servidor',
  })
  @ApiOperation({ summary: 'Buscar una categoria o subcategoria por el id' })
  @AuthorizedWithRoles('soporte', 'admin')
  async findOne(@Param('id') id: string) {
    return await this.categoryService.getCategoryById(id);
  }

  @Post()
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: CreateResponseDto,
    description: 'Metodo para crear una nueva categoria',
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
  @ApiOperation({ summary: 'Agregar una nueva categoria' })
  @AuthorizedWithRoles('admin')
  async createCategory(
    @Body() dto: CreateCategoryDto,
    @User() { id: usuario_id }: UserEntity,
  ) {
    return await this.categoryService.createCategory(dto, usuario_id);
  }

  @Post(':parentId/subcategory')
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: CreateResponseDto,
    description: 'Metodo para crear una nueva subcategoria',
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
  @ApiOperation({ summary: 'Agregar una nueva subcategoria' })
  @AuthorizedWithRoles('admin')
  async createSubcategory(
    @Param('parentId') parentId: string,
    @Body() dto: CreateCategoryDto,
    @User() { id: usuario_id }: UserEntity,
  ) {
    return await this.categoryService.createSubcategory(
      dto,
      parentId,
      usuario_id,
    );
  }

  @Put(':id')
  @ApiResponse({
    status: HttpStatus.OK,
    type: OkResponseDto,
    description: 'Metodo para editar una categoria por id',
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
    description: 'Categoria no encontrada',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    type: ErrorResponseDto,
    description: 'Hubo un error interno en el servidor',
  })
  @ApiOperation({ summary: 'Editar una categoria por su id' })
  @AuthorizedWithRoles('admin')
  async update(
    @Param('id') id: string,
    @Body() data: UpdateCategoryDto,
    @User() { id: usuario_id }: UserEntity,
  ) {
    return await this.categoryService.updateCategory(id, data, usuario_id);
  }

  @Put(':id/:parentId/subcategory')
  @ApiResponse({
    status: HttpStatus.OK,
    type: OkResponseDto,
    description: 'Metodo para editar una subcategoria por id',
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
    description: 'Subcategoria no encontrada',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    type: ErrorResponseDto,
    description: 'Hubo un error interno en el servidor',
  })
  @ApiOperation({ summary: 'Editar una subcategoria por su id' })
  @AuthorizedWithRoles('admin')
  async updateSubCategory(
    @Param('id') id: string,
    @Param('parentId') parentId: string,
    @Body() data: UpdateCategoryDto,
    @User() { id: usuario_id }: UserEntity,
  ) {
    return await this.categoryService.updateSubCategory(
      id,
      data,
      parentId,
      usuario_id,
    );
  }

  @Put(':id/change-status')
  @ApiResponse({
    status: HttpStatus.OK,
    type: OkResponseDto,
    description: 'Metodo para activar una categoria o subcategoria por id',
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
    description: 'Categoria o subcategoria no encontrada',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    type: ErrorResponseDto,
    description: 'Hubo un error interno en el servidor',
  })
  @ApiOperation({ summary: 'Activar una categoria o subcategoria por su id' })
  @AuthorizedWithRoles('admin')
  async activeCatSub(
    @Param('id') id: string,
    @Body() status: ChangeStatusDto,
    @User() { id: usuario_id }: UserEntity,
  ) {
    return await this.categoryService.activeOrDesactiveCatSub(
      id,
      status,
      usuario_id,
    );
  }

  @Delete(':id')
  @ApiResponse({
    status: HttpStatus.OK,
    type: OkResponseDto,
    description: 'Metodo para eliminar una categoria o subcategoria por id',
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
    description: 'Categoria o subcategoria no encontrada',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    type: ErrorResponseDto,
    description: 'Hubo un error interno en el servidor',
  })
  @ApiOperation({ summary: 'Elimina una categoria o subcategoria por el id' })
  @AuthorizedWithRoles('admin')
  async remove(
    @Param('id') id: string,
    @User() { id: usuario_id }: UserEntity,
  ) {
    return await this.categoryService.deleteCategory(id, usuario_id);
  }

  @Post(':id')
  @ApiResponse({
    status: HttpStatus.OK,
    type: OkResponseDto,
    description:
      'Metodo para restaurar una categoria o subcategoria borrado por id',
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
    description: 'Categoria o subcategoria no encontrada',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    type: ErrorResponseDto,
    description: 'Hubo un error interno en el servidor',
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Restaurar una categoria o subcategoria borrado por su id',
  })
  @AuthorizedWithRoles('admin')
  async recovery(
    @Param('id') id: string,
    @User() { id: usuario_id }: UserEntity,
  ) {
    return await this.categoryService.restoreCategory(id, usuario_id);
  }
}
