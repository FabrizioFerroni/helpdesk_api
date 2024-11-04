import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CategoryInterfaceRepository } from '../repository/category.interface.repository';
import { TransformDto } from '@/shared/utils';
import { CategoryEntity } from '../entity/category.entity';
import { ResponseCategoryDto } from '../dtos/response/response-category.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PaginationService } from '@/core/services/pagination.service';
import { CategoryType } from '../enum/category.enum';
import { CreateCategoryDto } from '../dtos/create-category.dto';
import { CategoryMessagesError } from '../error/error.messages';
import { PaginationDto } from '@/shared/utils/dtos/pagination.dto';
import { separateUUIDUser } from '@/shared/utils/functions/separate-uuid';
import { DefaultPageSize } from '@/shared/utils/constants/querying';
import { PaginationMeta } from '@/core/interfaces/pagination-meta.interface';
import { plainToInstance } from 'class-transformer';
import { invalidateAllCacheKeys } from '@/shared/utils/functions/invalidate-cachekeys';
import { CategoryMessages } from '../messages/category.messages';
import { UpdateCategoryDto } from '../dtos/update-category.dto';
import { UpdateResult } from 'typeorm';
import { ChangeStatusDto } from '@/shared/utils/dtos/change-status.dto';

const KEY: string = 'categories';

@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name, {
    timestamp: true,
  });

  constructor(
    @Inject(CategoryInterfaceRepository)
    private readonly categoryRepository: CategoryInterfaceRepository,
    @Inject(TransformDto)
    private readonly transform: TransformDto<
      CategoryEntity,
      ResponseCategoryDto
    >,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly paginationService: PaginationService,
  ) {}

  async verifyCategory(id: string, deleted?: boolean) {
    const category = await this.categoryRepository.getCategoryById(id, deleted);

    if (!category)
      throw new NotFoundException(CategoryMessagesError.CATEGORY_NOT_FOUND);

    return category;
  }

  async validateNamelBD(name: string, id?: string): Promise<void> {
    const existInBD = await this.categoryRepository.categoryAlreadyExists(
      name,
      id,
    );

    if (existInBD) {
      throw new BadRequestException(
        CategoryMessagesError.CATEGORY_ALREADY_EXIST,
      );
    }
  }

  async validateCategoryParentlBD(id: string, type: CategoryType) {
    const existInBD = await this.categoryRepository.getCategoryByIdForType(
      id,
      type,
    );

    if (!existInBD) {
      throw new BadRequestException(CategoryMessagesError.CATEGORY_NOT_EXIST);
    }
  }

  async validateSubCategoryParentBD(
    name: string,
    parent: CategoryEntity,
    id: string,
    type: CategoryType,
  ) {
    const existInBD = await this.categoryRepository.subCategoryAlreadyExists(
      name,
      parent,
      type,
      id,
    );

    if (existInBD) {
      throw new BadRequestException(
        CategoryMessagesError.SUBCATEGORY_ALREADY_EXIST,
      );
    }
  }

  async getAllCategories(
    usuario_id: string,
    param: PaginationDto,
    deletedAt?: boolean,
  ) {
    const { page, limit } = param;

    const cacheKey = `${KEY}_${separateUUIDUser(usuario_id)}-${page}-${limit}${deletedAt ? '_deleted' : ''}`;

    const take = limit ?? DefaultPageSize.CATEGORIES;
    const skip = this.paginationService.calculateOffset(limit, page);

    const categoryCache = await this.cacheManager.get<{
      categories: CategoryEntity[];
      meta: PaginationMeta;
    }>(cacheKey);

    const [data, count] = await this.categoryRepository.getAllCategories(
      skip,
      take,
      deletedAt,
    );

    const categories: CategoryEntity[] = this.transform.transformDtoArray(
      data,
      ResponseCategoryDto,
    );

    const meta = this.paginationService.createMeta(limit, page, count);

    if (categoryCache) {
      const categoryCacheResp = this.transform.transformDtoArray(
        categoryCache.categories,
        ResponseCategoryDto,
      );
      return { categories: categoryCacheResp, meta: categoryCache.meta };
    }

    const response = { categories, meta };
    await this.cacheManager.set(cacheKey, response);

    return response;
  }

  async getCategoriesAndSubcategoriesForType(type: CategoryType) {
    const typeSearch: CategoryType = CategoryType[type.toLocaleUpperCase()];

    if (!typeSearch) {
      throw new BadRequestException('Invalid type');
    }

    const categories =
      await this.categoryRepository.getCategoriesAndSubcategoriesForType(
        typeSearch,
      );

    return this.transform.transformDtoArray(categories, ResponseCategoryDto);
  }

  async getCategoriesAndSubcategoriesForParentId(parentId: string) {
    const parent = await this.categoryRepository.getCategoryById(parentId);

    if (!parent) {
      throw new NotFoundException(CategoryMessagesError.CATEGORY_NOT_FOUND);
    }

    const subcategories =
      await this.categoryRepository.getCategoriesAndSubcategoriesForParentId(
        parent,
      );

    return this.transform.transformDtoArray(subcategories, ResponseCategoryDto);
  }

  async getCategoryById(id: string) {
    const category = await this.categoryRepository.getCategoryById(id);

    if (!category) {
      this.logger.warn(
        `No se ha encontrado una ${category.parent ? 'subcategoria' : 'categoria'} con el id: ${id} en nuestra base de datos`,
      );

      let msg: string;

      category.parent
        ? (msg = CategoryMessagesError.SUBCATEGORY_NOT_FOUND)
        : (msg = CategoryMessagesError.CATEGORY_NOT_FOUND);

      throw new NotFoundException(msg);
    }

    return this.transform.transformDtoObject(category, ResponseCategoryDto);
  }

  async createCategory(dto: CreateCategoryDto, usuario_id?: string) {
    const { name } = dto;

    await this.validateNamelBD(name);

    const exist = await this.categoryRepository.categoryAlreadyExists(name);

    if (exist) {
      throw new BadRequestException(
        CategoryMessagesError.CATEGORY_ALREADY_EXIST,
      );
    }

    const newCategory = {
      name,
      type: CategoryType.CATEGORY,
      status: true,
    };

    const data: CategoryEntity = plainToInstance(CategoryEntity, newCategory);

    const categoryNew = await this.categoryRepository.saveCategory(data);

    if (!categoryNew) {
      throw new InternalServerErrorException(
        CategoryMessagesError.INTERNAL_SERVER_ERROR,
      );
    }

    invalidateAllCacheKeys(this.cacheManager, KEY, usuario_id);

    return CategoryMessages.CATEGORY_CREATED;
  }

  async createSubcategory(
    dto: CreateCategoryDto,
    parentId: string,
    usuario_id?: string,
  ) {
    const { name } = dto;

    await this.validateCategoryParentlBD(parentId, CategoryType.CATEGORY);

    const parent = await this.categoryRepository.getCategoryById(parentId);

    if (!parent || !parent.status) {
      throw new BadRequestException(
        CategoryMessagesError.CATEGORY_NOT_FOUND_OR_NOT_ACTIVE,
      );
    }

    await this.validateSubCategoryParentBD(
      name,
      parent,
      parentId,
      CategoryType.SUBCATEGORY,
    );

    const newSubCategory = {
      name,
      type: CategoryType.SUBCATEGORY,
      status: true,
      parent,
    };

    const data: CategoryEntity = plainToInstance(
      CategoryEntity,
      newSubCategory,
    );

    const subCategoryNew = await this.categoryRepository.saveCategory(data);

    if (!subCategoryNew) {
      throw new InternalServerErrorException(
        CategoryMessagesError.INTERNAL_SERVER_ERROR,
      );
    }

    invalidateAllCacheKeys(this.cacheManager, KEY, usuario_id);

    return CategoryMessages.SUBCATEGORY_CREATED;
  }

  async updateCategory(
    id: string,
    data: UpdateCategoryDto,
    usuario_id?: string,
  ) {
    const { name } = data;

    await this.validateNamelBD(name, id);

    const categoryToUpdate: Partial<CategoryEntity> = {};

    for (const key in data) {
      if (data[key] !== undefined && data[key] !== null) {
        categoryToUpdate[key] = data[key];
      }
    }

    delete categoryToUpdate['parentId'];

    const categoryUpdate = await this.categoryRepository.updateCategory(
      id,
      categoryToUpdate as CategoryEntity,
    );

    if (!categoryUpdate) {
      return CategoryMessagesError.CATEGORY_ERROR;
    }

    invalidateAllCacheKeys(this.cacheManager, KEY, usuario_id);

    return CategoryMessages.CATEGORY_UPDATED;
  }

  async updateSubCategory(
    id: string,
    data: UpdateCategoryDto,
    parentId: string,
    usuario_id?: string,
  ) {
    const { name } = data;

    await this.validateCategoryParentlBD(parentId, CategoryType.CATEGORY);

    const parent = await this.categoryRepository.getCategoryById(parentId);

    if (!parent || !parent.status) {
      throw new BadRequestException(
        CategoryMessagesError.CATEGORY_NOT_FOUND_OR_NOT_ACTIVE,
      );
    }

    await this.validateSubCategoryParentBD(
      name,
      parent,
      parentId,
      CategoryType.SUBCATEGORY,
    );

    const categoryToUpdate: Partial<CategoryEntity> = {};

    for (const key in data) {
      if (data[key] !== undefined && data[key] !== null) {
        categoryToUpdate[key] = data[key];
      }
    }

    delete categoryToUpdate['parentId'];

    const categoryUpdate = await this.categoryRepository.updateCategory(
      id,
      categoryToUpdate as CategoryEntity,
    );

    if (!categoryUpdate) {
      return CategoryMessagesError.CATEGORY_ERROR;
    }

    invalidateAllCacheKeys(this.cacheManager, KEY, usuario_id);

    return CategoryMessages.SUBCATEGORY_UPDATED;
  }

  async activeOrDesactiveCatSub(
    id: string,
    { status }: ChangeStatusDto,
    usuario_id?: string,
  ) {
    const category = await this.verifyCategory(id);

    if (!category) {
      this.logger.warn(
        `activeOrDesactiveCatSub: No se ha encontrado una ${category.parent ? 'subcategoria' : 'categoria'} con el id: ${id} en nuestra base de datos`,
      );

      let msg: string;

      category.parent
        ? (msg = CategoryMessagesError.SUBCATEGORY_NOT_FOUND)
        : (msg = CategoryMessagesError.CATEGORY_NOT_FOUND);

      throw new NotFoundException(msg);
    }

    const categoryUpdate: Partial<CategoryEntity> = { status };

    const categoryUpdateResult = await this.categoryRepository.updateCategory(
      id,
      categoryUpdate as CategoryEntity,
    );

    if (!categoryUpdateResult.affected) {
      throw new BadRequestException(CategoryMessagesError.CATEGORY_ERROR);
    }

    invalidateAllCacheKeys(this.cacheManager, KEY, usuario_id);

    let msgResult: string;

    status
      ? (msgResult = CategoryMessages.CATEGORY_ACTIVED)
      : (msgResult = CategoryMessages.CATEGORY_DESACTIVED);

    return msgResult;
  }

  async deleteCategory(id: string, usuario_id?: string) {
    const category = await this.verifyCategory(id);

    let msg: string;

    category.parent
      ? (msg = CategoryMessages.SUBCATEGORY_REMOVED)
      : (msg = CategoryMessages.CATEGORY_REMOVED);

    const categoryDeleted: UpdateResult =
      await this.categoryRepository.deleteCategory(id);

    if (!categoryDeleted.affected) {
      throw new BadRequestException(CategoryMessagesError.CATEGORY_NOT_DELETED);
    }

    invalidateAllCacheKeys(this.cacheManager, KEY, usuario_id);

    return msg;
  }

  async restoreCategory(id: string, usuario_id?: string) {
    const categoryExist =
      await this.categoryRepository.categoryAlreadyExistsById(id, true);

    const category = await this.verifyCategory(id, true);

    if (!categoryExist) {
      this.logger.warn(
        `No se ha encontrado una ${category.parent ? 'subcategoria' : 'categoria'} con el id: ${id} en nuestra base de datos`,
      );

      let msg: string;

      category.parent
        ? (msg = CategoryMessagesError.SUBCATEGORY_NOT_FOUND)
        : (msg = CategoryMessagesError.CATEGORY_NOT_FOUND);

      throw new NotFoundException(msg);
    }

    let msg: string;

    category.parent
      ? (msg = CategoryMessages.SUBCATEGORY_RESTORED)
      : (msg = CategoryMessages.CATEGORY_RESTORED);

    const categoryDeleted: UpdateResult =
      await this.categoryRepository.restoreCategory(id);

    if (!categoryDeleted.affected) {
      throw new BadRequestException(
        CategoryMessagesError.CATEGORY_NOT_RESTORED,
      );
    }

    invalidateAllCacheKeys(this.cacheManager, KEY, usuario_id);

    return msg;
  }
}
